import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { listKioskUsers } from '@/lib/auth/actions';
import { KioskFlow } from './kiosk-flow';

export default async function TabletteKioskPage({
  params,
}: {
  params: Promise<{ tugId: string }>;
}) {
  const { tugId } = await params;
  const tug = await prisma.tug.findUnique({ where: { id: tugId } });
  if (!tug) notFound();

  const users = await listKioskUsers(tug.companyId);

  return <KioskFlow tug={{ id: tug.id, name: tug.name }} users={users} />;
}
