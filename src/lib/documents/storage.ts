import 'server-only';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Stockage disque local (suffisant pour le développement — à remplacer par
 * un stockage objet type S3/Blob avant un déploiement serverless). Le nom de
 * fichier est régénéré pour éviter toute collision ou traversée de chemin.
 */
export async function saveUploadedFile(file: File): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(file.name).slice(0, 10);
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/${filename}`;
}
