import 'server-only';
import { prisma } from '@/lib/prisma';

/**
 * Heure de relève prévue la plus récente (aujourd'hui si déjà passée,
 * sinon hier) — l'heure de relève est unique pour toute la flotte
 * (décision module Équipages).
 */
function mostRecentReliefTime(reliefTimeOfDay: string, now: Date): Date {
  const [h, m] = reliefTimeOfDay.split(':').map(Number);
  const candidate = new Date(now);
  candidate.setHours(h, m, 0, 0);
  if (candidate > now) candidate.setDate(candidate.getDate() - 1);
  return candidate;
}

/**
 * Prise de service — Capitaine ou Chef mécanicien s'identifiant par PIN sur
 * la tablette du remorqueur. Crée le Service en cours s'il n'existe pas
 * encore, enregistre la prise de service (délai d'1h, indépendant entre les
 * deux rôles) et ouvre l'assignation de poste correspondante.
 */
export async function takeService(userId: string, tugId: string, companyId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const posteName = user.role === 'CAPITAINE' ? 'Capitaine' : 'Chef mécanicien';

  const [company, poste] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
    prisma.poste.findFirst({ where: { companyId, name: posteName } }),
  ]);

  const now = new Date();

  let service = await prisma.service.findFirst({ where: { tugId, actualEnd: null } });
  if (!service) {
    const plannedStart = mostRecentReliefTime(company.reliefTimeOfDay, now);
    service = await prisma.service.create({
      data: { tugId, plannedStart, actualStart: now },
    });
  }

  const deadlineAt = new Date(service.plannedStart.getTime() + 60 * 60 * 1000);
  const status = now <= deadlineAt ? 'A_TEMPS' : 'EN_RETARD';

  await prisma.servicePickup.create({
    data: {
      serviceId: service.id,
      userId,
      role: user.role === 'CAPITAINE' ? 'CAPITAINE' : 'CHEF_MECANICIEN',
      deadlineAt,
      pickedUpAt: now,
      status,
    },
  });

  if (poste) {
    const alreadyHolding = await prisma.postAssignment.findFirst({
      where: { serviceId: service.id, posteId: poste.id, userId, endsAt: null },
    });
    if (!alreadyHolding) {
      await prisma.postAssignment.updateMany({
        where: { serviceId: service.id, posteId: poste.id, endsAt: null },
        data: { endsAt: now },
      });
      await prisma.postAssignment.create({
        data: {
          tugId,
          posteId: poste.id,
          userId,
          serviceId: service.id,
          startsAt: now,
          declaredById: userId, // prise de service personnelle, pas une déclaration par un tiers
        },
      });
    }
  }

  return { serviceId: service.id, status };
}
