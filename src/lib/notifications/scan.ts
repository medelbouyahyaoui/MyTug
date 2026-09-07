import 'server-only';
import { prisma } from '@/lib/prisma';
import type { NotificationSeverity } from '@prisma/client';

const DAY_MS = 24 * 60 * 60 * 1000;

type Entry = {
  userId: string;
  dedupeKey: string;
  severity: NotificationSeverity;
  title: string;
  detail?: string;
  linkUrl?: string;
};

async function onDutyUserId(tugId: string, posteName: 'Capitaine' | 'Chef mécanicien'): Promise<string | null> {
  const service = await prisma.service.findFirst({ where: { tugId, actualEnd: null } });
  if (!service) return null;
  const assignment = await prisma.postAssignment.findFirst({
    where: { serviceId: service.id, endsAt: null, poste: { name: posteName } },
  });
  return assignment?.userId ?? null;
}

/**
 * Scanne les seuils de la compagnie (carburant, maintenance, certificats,
 * exercices, sécurité) et crée les notifications manquantes. Idempotent :
 * dedupeKey + contrainte unique (userId, dedupeKey) garantissent une seule
 * notification par seuil franchi et par destinataire, jamais de rappel.
 */
export async function scanCompanyNotifications(companyId: string): Promise<void> {
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  const entries: Entry[] = [];

  const [admins, chefArmementUsers, tugs] = await Promise.all([
    prisma.user.findMany({ where: { companyId, role: 'ADMINISTRATEUR', status: 'ACTIF' } }),
    prisma.user.findMany({ where: { companyId, role: 'CHEF_ARMEMENT', status: 'ACTIF' } }),
    prisma.tug.findMany({ where: { companyId, isArchived: false } }),
  ]);
  const caIds = chefArmementUsers.map((u) => u.id);
  const adminIds = admins.map((u) => u.id);

  for (const tug of tugs) {
    // Carburant — seuil unique de la compagnie, donc aussi le palier le plus urgent.
    const lastFuelDeclaration = await prisma.fluidEvent.findFirst({
      where: { tugId: tug.id, fluidType: 'CARBURANT', eventType: 'NIVEAU_DECLARE' },
      orderBy: { recordedAt: 'desc' },
    });
    if (lastFuelDeclaration && tug.fuelCapacityT) {
      const pct = (lastFuelDeclaration.quantity / tug.fuelCapacityT) * 100;
      if (pct <= company.fuelAlertThresholdPct) {
        const onDutyCm = await onDutyUserId(tug.id, 'Chef mécanicien');
        const onDutyCaptain = await onDutyUserId(tug.id, 'Capitaine');
        const recipients = [...(onDutyCm ? [onDutyCm] : []), ...caIds, ...(onDutyCaptain ? [onDutyCaptain] : [])];
        const dedupeKey = `FUEL:${tug.id}:${company.fuelAlertThresholdPct}`;
        for (const userId of new Set(recipients)) {
          entries.push({
            userId,
            dedupeKey,
            severity: 'CRITICAL',
            title: `Carburant bas — ${tug.name}`,
            detail: `Niveau déclaré à ${pct.toFixed(0)}% (seuil ${company.fuelAlertThresholdPct}%).`,
            linkUrl: `/flotte/${tug.id}/machine`,
          });
        }
      }
    }

    // Maintenance — 3 paliers (heures et/ou calendaire), le plus urgent des deux compte.
    const plans = await prisma.maintenancePlan.findMany({ where: { tugId: tug.id }, include: { engine: true } });
    for (const plan of plans) {
      const remainingHours = plan.nextDueHours != null && plan.engine ? plan.nextDueHours - plan.engine.currentHours : null;
      const remainingDays = plan.nextDueAt != null ? (plan.nextDueAt.getTime() - Date.now()) / DAY_MS : null;

      let tier: 'ALERT1' | 'ALERT2' | 'DUE' | null = null;
      if (remainingHours != null) {
        if (remainingHours <= 0) tier = 'DUE';
        else if (remainingHours <= company.maintenanceHoursAlert2) tier = 'ALERT2';
        else if (remainingHours <= company.maintenanceHoursAlert1) tier = 'ALERT1';
      }
      if (remainingDays != null) {
        const dayTier: typeof tier = remainingDays <= 0 ? 'DUE' : remainingDays <= company.maintenanceDaysAlert3 ? 'ALERT2' : remainingDays <= company.maintenanceDaysAlert1 ? 'ALERT1' : null;
        const rank = { ALERT1: 1, ALERT2: 2, DUE: 3 } as const;
        if (dayTier && (!tier || rank[dayTier] > rank[tier])) tier = dayTier;
      }
      if (!tier) continue;

      const onDutyCm = await onDutyUserId(tug.id, 'Chef mécanicien');
      const recipients = [...(onDutyCm ? [onDutyCm] : []), ...caIds];
      if (tier === 'DUE') {
        const onDutyCaptain = await onDutyUserId(tug.id, 'Capitaine');
        if (onDutyCaptain) recipients.push(onDutyCaptain);
      }
      const equipmentLabel = plan.engine?.label ?? 'équipement';
      const dedupeKey = `MAINTENANCE:${plan.id}:${tier}`;
      const label = tier === 'DUE' ? 'échéance atteinte' : tier === 'ALERT2' ? 'échéance proche' : 'échéance à prévoir';
      for (const userId of new Set(recipients)) {
        entries.push({
          userId,
          dedupeKey,
          severity: tier === 'DUE' ? 'CRITICAL' : tier === 'ALERT2' ? 'WARNING' : 'INFO',
          title: `Maintenance — ${equipmentLabel} (${tug.name})`,
          detail: `Plan de maintenance : ${label}.`,
          linkUrl: `/flotte/${tug.id}/maintenance`,
        });
      }
    }

    // Certificats — 3 paliers calendaires.
    const certificates = await prisma.certificate.findMany({ where: { tugId: tug.id }, include: { type: true } });
    for (const cert of certificates) {
      if (!cert.expiresAt) continue;
      const remainingDays = (cert.expiresAt.getTime() - Date.now()) / DAY_MS;
      let tier: 'J60' | 'J30' | 'J7' | null = null;
      if (remainingDays <= company.certificateDaysAlert3) tier = 'J7';
      else if (remainingDays <= company.certificateDaysAlert2) tier = 'J30';
      else if (remainingDays <= company.certificateDaysAlert1) tier = 'J60';
      if (!tier) continue;

      const recipients = [...adminIds, ...caIds];
      if (tier === 'J7') {
        const onDutyCaptain = await onDutyUserId(tug.id, 'Capitaine');
        if (onDutyCaptain) recipients.push(onDutyCaptain);
      }
      const dedupeKey = `CERTIFICATE:${cert.id}:${tier}`;
      for (const userId of new Set(recipients)) {
        entries.push({
          userId,
          dedupeKey,
          severity: tier === 'J7' ? 'CRITICAL' : tier === 'J30' ? 'WARNING' : 'INFO',
          title: `Certificat — ${cert.type.name} (${tug.name})`,
          detail: `Expire le ${cert.expiresAt.toLocaleDateString('fr-FR')}.`,
          linkUrl: `/flotte/${tug.id}/certificats-exercices`,
        });
      }
    }

    // Exercices — à venir (30 jours) / en retard, par capitaine concerné.
    const entriesForTug = await prisma.exerciseProgramEntry.findMany({
      where: { tugId: tug.id, status: { in: ['PREVU', 'A_VENIR', 'EN_RETARD'] } },
      include: { type: true, execution: true },
    });
    for (const programEntry of entriesForTug) {
      if (programEntry.execution || !programEntry.plannedAt) continue;
      const remainingDays = (programEntry.plannedAt.getTime() - Date.now()) / DAY_MS;
      const tier = remainingDays <= 0 ? 'EN_RETARD' : remainingDays <= 30 ? 'A_VENIR' : null;
      if (!tier) continue;

      const dedupeKey = `EXERCISE:${programEntry.id}:${tier}`;
      for (const userId of new Set([programEntry.captainId, ...caIds])) {
        entries.push({
          userId,
          dedupeKey,
          severity: tier === 'EN_RETARD' ? 'CRITICAL' : 'INFO',
          title: `Exercice ${tier === 'EN_RETARD' ? 'en retard' : 'à venir'} — ${programEntry.type.name} (${tug.name})`,
          detail: tier === 'EN_RETARD' ? "Échéance dépassée, à réaliser dès que possible." : `Prévu le ${programEntry.plannedAt.toLocaleDateString('fr-FR')}.`,
          linkUrl: `/flotte/${tug.id}/certificats-exercices`,
        });
      }
    }

    // Sécurité — notification au chef d'armement dès la soumission.
    const submittedObservations = await prisma.safetyObservation.findMany({ where: { tugId: tug.id, status: 'SOUMIS' } });
    for (const observation of submittedObservations) {
      const dedupeKey = `SAFETY:${observation.id}:SOUMIS`;
      for (const userId of new Set(caIds)) {
        entries.push({
          userId,
          dedupeKey,
          severity: 'WARNING',
          title: `Observation de sécurité à valider — ${tug.name}`,
          detail: observation.description.slice(0, 120),
          linkUrl: `/flotte/${tug.id}/securite`,
        });
      }
    }
  }

  if (entries.length > 0) {
    await prisma.notification.createMany({ data: entries, skipDuplicates: true });
  }
}
