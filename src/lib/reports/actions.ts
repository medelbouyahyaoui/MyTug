'use server';

import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/session';
import { REPORT_LABEL, TECHNICAL_REPORTS, type ReportType } from './constants';

export type ReportFilters = {
  from?: string;
  to?: string;
  tugId?: string;
};

export type ReportResult = {
  columns: string[];
  rows: (string | number)[][];
};

function dateRange(filters: ReportFilters) {
  return {
    gte: filters.from ? new Date(filters.from) : undefined,
    lte: filters.to ? new Date(`${filters.to}T23:59:59`) : undefined,
  };
}
function fmtDate(dt: Date | null) {
  return dt ? dt.toLocaleDateString('fr-FR') : '';
}
function fmtDateTime(dt: Date | null) {
  return dt ? dt.toLocaleString('fr-FR') : '';
}

export async function getAvailableReports(): Promise<{ type: ReportType; label: string }[]> {
  const actor = await requireUser();
  const allowedTypes: ReportType[] =
    actor.role === 'ADMINISTRATEUR' || actor.role === 'CHEF_ARMEMENT'
      ? (Object.keys(REPORT_LABEL) as ReportType[])
      : actor.role === 'CHEF_MECANICIEN'
        ? TECHNICAL_REPORTS
        : [];
  return allowedTypes.map((type) => ({ type, label: REPORT_LABEL[type] }));
}

export async function getReportTugs() {
  const actor = await requireUser();
  return prisma.tug.findMany({ where: { companyId: actor.companyId }, orderBy: { name: 'asc' } });
}

export async function generateReport(type: ReportType, filters: ReportFilters): Promise<ReportResult> {
  const actor = await requireUser();
  const available = await getAvailableReports();
  if (!available.some((r) => r.type === type)) {
    return { columns: ['Erreur'], rows: [["Rapport non autorisé pour ce rôle."]] };
  }

  const companyId = actor.companyId;
  const period = dateRange(filters);
  const tugFilter = filters.tugId ? { tugId: filters.tugId } : {};

  switch (type) {
    case 'MISSIONS_PAR_REMORQUEUR':
    case 'MISSIONS_PAR_CAPITAINE':
    case 'MISSIONS_PAR_PILOTE':
    case 'MISSIONS_PAR_NAVIRE':
    case 'MISSIONS_PAR_TYPE_MOUVEMENT': {
      const orderBy =
        type === 'MISSIONS_PAR_REMORQUEUR'
          ? [{ tug: { name: 'asc' as const } }, { departureFromDockAt: 'desc' as const }]
          : type === 'MISSIONS_PAR_CAPITAINE'
            ? [{ createdBy: { lastName: 'asc' as const } }, { departureFromDockAt: 'desc' as const }]
            : type === 'MISSIONS_PAR_PILOTE'
              ? [{ pilot: { name: 'asc' as const } }, { departureFromDockAt: 'desc' as const }]
              : type === 'MISSIONS_PAR_NAVIRE'
                ? [{ vesselName: 'asc' as const }, { departureFromDockAt: 'desc' as const }]
                : [{ movementType: { name: 'asc' as const } }, { departureFromDockAt: 'desc' as const }];

      const missions = await prisma.mission.findMany({
        where: { tug: { companyId }, departureFromDockAt: period, ...tugFilter },
        include: { tug: true, pilot: true, movementType: true, createdBy: true },
        orderBy,
      });
      return {
        columns: ['Remorqueur', 'Capitaine', 'Pilote', 'Navire', 'Type de mouvement', 'Départ', 'Retour', 'Statut'],
        rows: missions.map((m) => [
          m.tug.name,
          `${m.createdBy.firstName} ${m.createdBy.lastName}`,
          m.pilot.name,
          m.vesselName,
          m.movementType.name,
          fmtDateTime(m.departureFromDockAt),
          fmtDateTime(m.returnToDockAt),
          m.status,
        ]),
      };
    }

    case 'HEURES_MOTEUR': {
      const readings = await prisma.engineHourReading.findMany({
        where: { engine: { tug: { companyId, ...tugFilter } }, recordedAt: period },
        include: { engine: { include: { tug: true } } },
        orderBy: { recordedAt: 'desc' },
      });
      return {
        columns: ['Remorqueur', 'Moteur', 'Heures', 'Date du relevé'],
        rows: readings.map((r) => [r.engine.tug.name, r.engine.label, r.hours, fmtDateTime(r.recordedAt)]),
      };
    }

    case 'CARBURANT': {
      const events = await prisma.fluidEvent.findMany({
        where: { fluidType: 'CARBURANT', tug: { companyId, ...tugFilter }, recordedAt: period },
        include: { tug: true, user: true },
        orderBy: { recordedAt: 'desc' },
      });
      return {
        columns: ['Remorqueur', 'Type', 'Quantité (t)', 'Date', 'Déclarant'],
        rows: events.map((e) => [
          e.tug.name,
          e.eventType === 'AVITAILLEMENT' ? 'Avitaillement' : 'Niveau déclaré',
          e.quantity,
          fmtDateTime(e.recordedAt),
          `${e.user.firstName} ${e.user.lastName}`,
        ]),
      };
    }

    case 'MAINTENANCE': {
      const interventions = await prisma.maintenanceIntervention.findMany({
        where: { tug: { companyId, ...tugFilter }, occurredAt: period },
        include: { tug: true, plan: { include: { engine: true, equipmentType: true } }, responsible: true },
        orderBy: { occurredAt: 'desc' },
      });
      return {
        columns: ['Remorqueur', 'Type', 'Équipement', 'Date', 'Statut', 'Responsable'],
        rows: interventions.map((i) => [
          i.tug.name,
          i.type,
          i.plan?.engine?.label ?? i.plan?.equipmentType?.name ?? '—',
          fmtDateTime(i.occurredAt),
          i.status,
          `${i.responsible.firstName} ${i.responsible.lastName}`,
        ]),
      };
    }

    case 'CERTIFICATS': {
      const certificates = await prisma.certificate.findMany({
        where: { tug: { companyId, ...tugFilter }, createdAt: period },
        include: { tug: true, type: true },
        orderBy: { expiresAt: 'asc' },
      });
      return {
        columns: ['Remorqueur', 'Type', 'Référence', 'Délivré le', 'Expire le', 'Autorité'],
        rows: certificates.map((c) => [c.tug.name, c.type.name, c.referenceNumber ?? '', fmtDate(c.issuedAt), fmtDate(c.expiresAt), c.authority ?? '']),
      };
    }

    case 'EXERCICES': {
      const entries = await prisma.exerciseProgramEntry.findMany({
        where: { tug: { companyId, ...tugFilter }, createdAt: period },
        include: { tug: true, type: true, captain: true, execution: true },
        orderBy: { createdAt: 'desc' },
      });
      return {
        columns: ['Remorqueur', 'Capitaine', 'Type', 'Année', 'Statut', 'Date réelle'],
        rows: entries.map((e) => [
          e.tug.name,
          `${e.captain.firstName} ${e.captain.lastName}`,
          e.type.name,
          e.year,
          e.status,
          e.execution ? fmtDate(e.execution.actualDate) : '',
        ]),
      };
    }

    case 'EQUIPAGES': {
      const assignments = await prisma.postAssignment.findMany({
        where: { tug: { companyId, ...tugFilter }, startsAt: period },
        include: { tug: true, poste: true, user: true },
        orderBy: { startsAt: 'desc' },
      });
      return {
        columns: ['Remorqueur', 'Poste', 'Personne', 'Début', 'Fin', 'Motif'],
        rows: assignments.map((a) => [a.tug.name, a.poste.name, `${a.user.firstName} ${a.user.lastName}`, fmtDateTime(a.startsAt), fmtDateTime(a.endsAt), a.reason ?? '']),
      };
    }

    case 'JOURS_TRAVAILLES': {
      const assignments = await prisma.postAssignment.findMany({
        where: { tug: { companyId, ...tugFilter }, startsAt: period },
        include: { user: true },
      });
      const totals = new Map<string, { name: string; ms: number; count: number }>();
      for (const a of assignments) {
        const end = a.endsAt ?? new Date();
        const ms = end.getTime() - a.startsAt.getTime();
        const key = a.userId;
        const current = totals.get(key) ?? { name: `${a.user.firstName} ${a.user.lastName}`, ms: 0, count: 0 };
        current.ms += ms;
        current.count += 1;
        totals.set(key, current);
      }
      return {
        columns: ['Personne', 'Nombre d\'affectations', 'Heures cumulées'],
        rows: [...totals.values()]
          .sort((a, b) => b.ms - a.ms)
          .map((t) => [t.name, t.count, Math.round((t.ms / (1000 * 60 * 60)) * 10) / 10]),
      };
    }

    case 'REMPLACEMENTS': {
      const assignments = await prisma.postAssignment.findMany({
        where: { tug: { companyId, ...tugFilter }, startsAt: period, reason: { not: null } },
        include: { tug: true, poste: true, user: true, declaredBy: true },
        orderBy: { startsAt: 'desc' },
      });
      return {
        columns: ['Remorqueur', 'Poste', 'Remplacé par', 'Déclaré par', 'Date', 'Motif'],
        rows: assignments.map((a) => [
          a.tug.name,
          a.poste.name,
          `${a.user.firstName} ${a.user.lastName}`,
          `${a.declaredBy.firstName} ${a.declaredBy.lastName}`,
          fmtDateTime(a.startsAt),
          a.reason ?? '',
        ]),
      };
    }

    case 'INCIDENTS': {
      const [logEntries, observations] = await Promise.all([
        prisma.machineLogEntry.findMany({
          where: { isIncident: true, tug: { companyId, ...tugFilter }, createdAt: period },
          include: { tug: true, user: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.safetyObservation.findMany({
          where: { tug: { companyId, ...tugFilter }, createdAt: period },
          include: { tug: true, author: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);
      const rows: (string | number)[][] = [
        ...logEntries.map((e) => ['Journal machine', e.tug.name, `${e.user.firstName} ${e.user.lastName}`, fmtDateTime(e.createdAt), e.observation]),
        ...observations.map((o) => ['Sécurité', o.tug.name, `${o.author.firstName} ${o.author.lastName}`, fmtDateTime(o.createdAt), o.description]),
      ];
      rows.sort((a, b) => (a[3] < b[3] ? 1 : -1));
      return { columns: ['Source', 'Remorqueur', 'Déclarant', 'Date', 'Description'], rows };
    }

    case 'ACTIONS_CORRECTIVES': {
      const actions = await prisma.safetyCorrectiveAction.findMany({
        where: { safetyObservation: { tug: { companyId, ...tugFilter } }, createdAt: period },
        include: { safetyObservation: { include: { tug: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return {
        columns: ['Remorqueur', 'Description', 'Responsable', 'Statut', 'Échéance'],
        rows: actions.map((a) => [a.safetyObservation.tug.name, a.description, a.responsible ?? '', a.status, fmtDate(a.dueDate)]),
      };
    }

    default:
      return { columns: [], rows: [] };
  }
}
