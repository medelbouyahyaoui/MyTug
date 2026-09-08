'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser, type CurrentUser } from '@/lib/auth/session';
import { saveUploadedFile } from './storage';

export type ActionResult = { ok: true } | { ok: false; error: string };
export type CreateTypeResult = { ok: true; id: string } | { ok: false; error: string };

type LinkInput = {
  tugId?: string;
  maintenanceInterventionId?: string;
  certificateId?: string;
  exerciseExecutionId?: string;
  safetyObservationId?: string;
};

/**
 * Droits d'upload/gestion hérités du module lié — pas de permission séparée
 * pour les documents. Un document général (aucun lien) reste réservé à
 * l'administrateur et au chef d'armement, seuls rôles ayant la configuration
 * compagnie.
 */
async function assertCanActOnLink(actor: CurrentUser, link: LinkInput): Promise<ActionResult> {
  const isAdminOrCA = actor.role === 'ADMINISTRATEUR' || actor.role === 'CHEF_ARMEMENT';

  if (link.maintenanceInterventionId) {
    if (actor.role !== 'CHEF_MECANICIEN') return { ok: false, error: 'Réservé au chef mécanicien.' };
    return { ok: true };
  }
  if (link.certificateId) {
    if (!isAdminOrCA) return { ok: false, error: "Réservé à l'administrateur et au chef d'armement." };
    return { ok: true };
  }
  if (link.exerciseExecutionId) {
    if (isAdminOrCA) return { ok: true };
    const execution = await prisma.exerciseExecution.findUnique({ where: { id: link.exerciseExecutionId } });
    if (actor.role !== 'CAPITAINE' || execution?.executedById !== actor.id) {
      return { ok: false, error: "Réservé au capitaine ayant réalisé l'exercice." };
    }
    return { ok: true };
  }
  if (link.safetyObservationId) {
    if (actor.role === 'CHEF_ARMEMENT') return { ok: true };
    const observation = await prisma.safetyObservation.findUnique({ where: { id: link.safetyObservationId } });
    if (actor.role !== 'CAPITAINE' || observation?.authorId !== actor.id) {
      return { ok: false, error: "Réservé à l'auteur de l'observation et au chef d'armement." };
    }
    return { ok: true };
  }
  if (link.tugId) {
    if (isAdminOrCA || actor.role === 'CHEF_MECANICIEN') return { ok: true };
    return { ok: false, error: 'Rôle non autorisé pour ce lien.' };
  }
  // Aucun lien = document général
  if (!isAdminOrCA) return { ok: false, error: "Réservé à l'administrateur et au chef d'armement." };
  return { ok: true };
}

export async function getDocumentsOverview() {
  const actor = await requireUser();
  const isAdminOrCA = actor.role === 'ADMINISTRATEUR' || actor.role === 'CHEF_ARMEMENT';

  const [documents, documentTypes, tugs, interventions, certificates, executions, observations] = await Promise.all([
    prisma.document.findMany({
      where: { companyId: actor.companyId },
      include: {
        type: true,
        author: true,
        tug: true,
        maintenanceIntervention: { include: { tug: true } },
        certificate: { include: { type: true, tug: true } },
        exerciseExecution: { include: { programEntry: { include: { type: true, tug: true } } } },
        safetyObservation: { include: { tug: true } },
        versions: { orderBy: { versionNumber: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.documentType.findMany({ where: { companyId: actor.companyId, isArchived: false }, orderBy: { name: 'asc' } }),
    prisma.tug.findMany({ where: { companyId: actor.companyId, isArchived: false }, orderBy: { name: 'asc' } }),
    actor.role === 'CHEF_MECANICIEN' || isAdminOrCA
      ? prisma.maintenanceIntervention.findMany({
          where: { tug: { companyId: actor.companyId } },
          include: { tug: true },
          orderBy: { occurredAt: 'desc' },
          take: 50,
        })
      : Promise.resolve([]),
    isAdminOrCA
      ? prisma.certificate.findMany({ where: { tug: { companyId: actor.companyId } }, include: { type: true, tug: true }, orderBy: { createdAt: 'desc' }, take: 50 })
      : Promise.resolve([]),
    actor.role === 'CAPITAINE' || isAdminOrCA
      ? prisma.exerciseExecution.findMany({
          where: {
            programEntry: { tug: { companyId: actor.companyId } },
            ...(actor.role === 'CAPITAINE' ? { executedById: actor.id } : {}),
          },
          include: { programEntry: { include: { type: true, tug: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
      : Promise.resolve([]),
    actor.role === 'CAPITAINE' || actor.role === 'CHEF_ARMEMENT'
      ? prisma.safetyObservation.findMany({
          where: {
            tug: { companyId: actor.companyId },
            ...(actor.role === 'CAPITAINE' ? { authorId: actor.id } : {}),
          },
          include: { tug: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
      : Promise.resolve([]),
  ]);

  const documentsWithExpiry = documents.map((d) => ({
    ...d,
    isExpired: d.expiresAt != null && d.expiresAt.getTime() < Date.now(),
  }));

  return {
    documents: documentsWithExpiry,
    documentTypes,
    tugs,
    interventions,
    certificates,
    executions,
    observations,
    role: actor.role,
    canCreate: actor.role !== 'DISPATCHER',
    canManageGeneral: isAdminOrCA,
  };
}

export async function createDocumentType(name: string): Promise<CreateTypeResult> {
  const actor = await requireUser();
  if (actor.role !== 'ADMINISTRATEUR' && actor.role !== 'CHEF_ARMEMENT') {
    return { ok: false, error: "Réservé à l'administrateur et au chef d'armement." };
  }
  if (!name.trim()) return { ok: false, error: 'Nom requis.' };
  const type = await prisma.documentType.create({ data: { companyId: actor.companyId, name } });
  revalidatePath('/administration/societe');
  return { ok: true, id: type.id };
}

/** Types de documents, actifs et archivés — gestion Société (§45, avec Postes). */
export async function getAllDocumentTypes() {
  const actor = await requireUser();
  if (actor.role !== 'ADMINISTRATEUR' && actor.role !== 'CHEF_ARMEMENT') return [];
  return prisma.documentType.findMany({ where: { companyId: actor.companyId }, orderBy: { name: 'asc' } });
}

export async function toggleDocumentTypeArchived(id: string, isArchived: boolean): Promise<ActionResult> {
  const actor = await requireUser();
  if (actor.role !== 'ADMINISTRATEUR' && actor.role !== 'CHEF_ARMEMENT') {
    return { ok: false, error: "Réservé à l'administrateur et au chef d'armement." };
  }
  await prisma.documentType.update({ where: { id }, data: { isArchived } });
  revalidatePath('/administration/societe');
  return { ok: true };
}

export async function createDocument(formData: FormData): Promise<ActionResult> {
  const actor = await requireUser();

  const name = String(formData.get('name') || '').trim();
  const typeId = String(formData.get('typeId') || '');
  const expiresAtRaw = String(formData.get('expiresAt') || '');
  const file = formData.get('file');

  if (!name) return { ok: false, error: 'Nom requis.' };
  if (!typeId) return { ok: false, error: 'Type requis.' };
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Fichier requis.' };

  const link: LinkInput = {
    tugId: String(formData.get('tugId') || '') || undefined,
    maintenanceInterventionId: String(formData.get('maintenanceInterventionId') || '') || undefined,
    certificateId: String(formData.get('certificateId') || '') || undefined,
    exerciseExecutionId: String(formData.get('exerciseExecutionId') || '') || undefined,
    safetyObservationId: String(formData.get('safetyObservationId') || '') || undefined,
  };

  const permission = await assertCanActOnLink(actor, link);
  if (!permission.ok) return permission;

  const fileUrl = await saveUploadedFile(file);

  await prisma.document.create({
    data: {
      companyId: actor.companyId,
      typeId,
      name,
      expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
      authorId: actor.id,
      tugId: link.tugId || null,
      maintenanceInterventionId: link.maintenanceInterventionId || null,
      certificateId: link.certificateId || null,
      exerciseExecutionId: link.exerciseExecutionId || null,
      safetyObservationId: link.safetyObservationId || null,
      versions: { create: { versionNumber: 1, fileUrl, addedById: actor.id } },
    },
  });

  revalidatePath('/documents');
  return { ok: true };
}

export async function addDocumentVersion(documentId: string, formData: FormData): Promise<ActionResult> {
  const actor = await requireUser();

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) return { ok: false, error: 'Document introuvable.' };

  const permission = await assertCanActOnLink(actor, {
    tugId: document.tugId ?? undefined,
    maintenanceInterventionId: document.maintenanceInterventionId ?? undefined,
    certificateId: document.certificateId ?? undefined,
    exerciseExecutionId: document.exerciseExecutionId ?? undefined,
    safetyObservationId: document.safetyObservationId ?? undefined,
  });
  if (!permission.ok) return permission;

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Fichier requis.' };

  const fileUrl = await saveUploadedFile(file);
  const last = await prisma.documentVersion.findFirst({ where: { documentId }, orderBy: { versionNumber: 'desc' } });

  await prisma.documentVersion.create({
    data: { documentId, versionNumber: (last?.versionNumber ?? 0) + 1, fileUrl, addedById: actor.id },
  });

  revalidatePath('/documents');
  return { ok: true };
}

export async function toggleDocumentStatus(documentId: string): Promise<ActionResult> {
  const actor = await requireUser();

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) return { ok: false, error: 'Document introuvable.' };

  const permission = await assertCanActOnLink(actor, {
    tugId: document.tugId ?? undefined,
    maintenanceInterventionId: document.maintenanceInterventionId ?? undefined,
    certificateId: document.certificateId ?? undefined,
    exerciseExecutionId: document.exerciseExecutionId ?? undefined,
    safetyObservationId: document.safetyObservationId ?? undefined,
  });
  if (!permission.ok) return permission;

  await prisma.document.update({
    where: { id: documentId },
    data: { status: document.status === 'ACTIF' ? 'ARCHIVE' : 'ACTIF' },
  });

  revalidatePath('/documents');
  return { ok: true };
}
