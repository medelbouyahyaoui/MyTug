import 'server-only';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Stockage disque local — dev uniquement. Le système de fichiers d'une
 * fonction serverless Vercel est éphémère et non partagé entre invocations ;
 * ne jamais utiliser cette fonction en production.
 */
async function saveToLocalDisk(file: File, filename: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

/**
 * Vercel Blob — utilisé dès que BLOB_READ_WRITE_TOKEN est présent (fourni
 * automatiquement par Vercel une fois un store Blob connecté au projet).
 * Stockage objet réel, adapté au runtime serverless.
 */
async function saveToVercelBlob(file: File, filename: string): Promise<string> {
  const { put } = await import('@vercel/blob');
  const blob = await put(filename, file, { access: 'public' });
  return blob.url;
}

/**
 * Le nom de fichier est régénéré pour éviter toute collision ou traversée de
 * chemin, quel que soit le backend.
 */
export async function saveUploadedFile(file: File): Promise<string> {
  const ext = path.extname(file.name).slice(0, 10);
  const filename = `${randomUUID()}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return saveToVercelBlob(file, filename);
  }
  return saveToLocalDisk(file, filename);
}
