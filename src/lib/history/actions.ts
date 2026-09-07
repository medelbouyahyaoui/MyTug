'use server';

import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';

export type HistoryEventType = 'CONFIG' | 'TUG_STATUS' | 'CREW' | 'CONTESTATION' | 'DOCUMENT';

export type HistoryEvent = {
  type: HistoryEventType;
  date: Date;
  actor: string;
  description: string;
};

export type HistoryFilters = {
  from?: string;
  to?: string;
  types?: HistoryEventType[];
};

const ALL_TYPES: HistoryEventType[] = ['CONFIG', 'TUG_STATUS', 'CREW', 'CONTESTATION', 'DOCUMENT'];

function dateRange(filters: HistoryFilters) {
  return {
    gte: filters.from ? new Date(filters.from) : undefined,
    lte: filters.to ? new Date(`${filters.to}T23:59:59`) : undefined,
  };
}

/**
 * Vue unifiée hybride : agrège les mécanismes de traçabilité déjà conçus
 * module par module (statuts remorqueur, affectations, contestations,
 * versions de documents) et le journal générique de configuration — seul
 * point qui n'avait pas encore de traçabilité propre.
 */
export async function getHistoryEvents(filters: HistoryFilters): Promise<HistoryEvent[]> {
  const actor = await requireRole('ADMINISTRATEUR', 'CHEF_ARMEMENT');
  const companyId = actor.companyId;
  const period = dateRange(filters);
  const types = filters.types && filters.types.length > 0 ? filters.types : ALL_TYPES;

  const events: HistoryEvent[] = [];

  if (types.includes('CONFIG')) {
    const logs = await prisma.configChangeLog.findMany({
      where: { companyId, createdAt: period },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    for (const l of logs) {
      events.push({
        type: 'CONFIG',
        date: l.createdAt,
        actor: `${l.user.firstName} ${l.user.lastName}`,
        description: `Paramètre « ${l.parameter} » : ${l.oldValue ?? '—'} → ${l.newValue ?? '—'}`,
      });
    }
  }

  if (types.includes('TUG_STATUS')) {
    const history = await prisma.tugStatusHistory.findMany({
      where: { tug: { companyId }, createdAt: period },
      include: { tug: true, changedBy: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    for (const h of history) {
      events.push({
        type: 'TUG_STATUS',
        date: h.createdAt,
        actor: `${h.changedBy.firstName} ${h.changedBy.lastName}`,
        description: `${h.tug.name} → ${h.status}${h.reason ? ` (${h.reason})` : ''}`,
      });
    }
  }

  if (types.includes('CREW')) {
    const assignments = await prisma.postAssignment.findMany({
      where: { tug: { companyId }, startsAt: period },
      include: { tug: true, poste: true, user: true, declaredBy: true },
      orderBy: { startsAt: 'desc' },
      take: 200,
    });
    for (const a of assignments) {
      events.push({
        type: 'CREW',
        date: a.startsAt,
        actor: `${a.declaredBy.firstName} ${a.declaredBy.lastName}`,
        description: `${a.tug.name} — ${a.poste.name} : ${a.user.firstName} ${a.user.lastName}${a.endsAt ? ` (clôturée le ${a.endsAt.toLocaleString('fr-FR')})` : ' (en cours)'}${a.reason ? ` — ${a.reason}` : ''}`,
      });
    }
  }

  if (types.includes('CONTESTATION')) {
    const contestations = await prisma.contestation.findMany({
      where: {
        createdAt: period,
        OR: [{ handoverDeclaration: { service: { tug: { companyId } } } }, { safetyObservation: { tug: { companyId } } }],
      },
      include: { author: true, handoverDeclaration: { include: { service: { include: { tug: true } } } }, safetyObservation: { include: { tug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    for (const c of contestations) {
      const tugName = c.handoverDeclaration?.service.tug.name ?? c.safetyObservation?.tug.name ?? '—';
      events.push({
        type: 'CONTESTATION',
        date: c.createdAt,
        actor: `${c.author.firstName} ${c.author.lastName}`,
        description: `${tugName} — ${c.contestedItem} : ${c.reason} (${c.status === 'OUVERTE' ? 'ouverte' : 'résolue'})`,
      });
    }
  }

  if (types.includes('DOCUMENT')) {
    const versions = await prisma.documentVersion.findMany({
      where: { document: { companyId }, createdAt: period },
      include: { document: true, addedBy: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    for (const v of versions) {
      events.push({
        type: 'DOCUMENT',
        date: v.createdAt,
        actor: `${v.addedBy.firstName} ${v.addedBy.lastName}`,
        description: `${v.document.name} — version ${v.versionNumber}`,
      });
    }
  }

  events.sort((a, b) => b.date.getTime() - a.date.getTime());
  return events.slice(0, 300);
}
