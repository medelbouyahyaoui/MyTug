/**
 * Amorçage minimal : une compagnie, un compte Administrateur, un remorqueur
 * et un capitaine + un chef mécanicien pour pouvoir tester les deux flux de
 * connexion de bout en bout. À lancer une seule fois sur une base vide :
 *   npx tsx prisma/seed.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { randomBytes, scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
async function hashSecret(secret: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(secret, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.company.findFirst();
  if (existing) {
    console.log('Une compagnie existe déjà — amorçage ignoré.');
    return;
  }

  const company = await prisma.company.create({
    data: {
      name: "Remorquage de l'Estuaire",
      homePort: 'Port du Havre',
      address: "Quai de l'Amirauté, 76600 Le Havre",
    },
  });

  await Promise.all(
    ['Capitaine', 'Chef mécanicien', 'Graisseur', 'Matelot 1', 'Matelot 2', 'Autres'].map((name) =>
      prisma.poste.create({ data: { companyId: company.id, name } })
    )
  );

  const tugTypeAsd = await prisma.tugType.create({ data: { companyId: company.id, name: 'ASD' } });
  await prisma.tugType.create({ data: { companyId: company.id, name: 'Conventionnel' } });

  const tug = await prisma.tug.create({
    data: { companyId: company.id, name: 'ARGOS', tugTypeId: tugTypeAsd.id },
  });

  const adminPassword = 'MyTug2026!';
  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      firstName: 'Admin',
      lastName: 'MyTug',
      role: 'ADMINISTRATEUR',
      email: 'admin@mytug.local',
      passwordHash: await hashSecret(adminPassword),
    },
  });

  const capitainePin = '1234';
  const capitaine = await prisma.user.create({
    data: {
      companyId: company.id,
      firstName: 'Marc',
      lastName: 'Delande',
      role: 'CAPITAINE',
      pinHash: await hashSecret(capitainePin),
    },
  });

  const chefMecaPin = '5678';
  const chefMeca = await prisma.user.create({
    data: {
      companyId: company.id,
      firstName: 'Yasmine',
      lastName: 'Rahmouni',
      role: 'CHEF_MECANICIEN',
      pinHash: await hashSecret(chefMecaPin),
    },
  });

  const chefArmementPassword = 'MyTug2026!';
  const chefArmement = await prisma.user.create({
    data: {
      companyId: company.id,
      firstName: 'Paul',
      lastName: 'Vasseur',
      role: 'CHEF_ARMEMENT',
      email: 'p.vasseur@remorquage-estuaire.fr',
      passwordHash: await hashSecret(chefArmementPassword),
    },
  });

  // Matelots / graisseur : fiches personne suivies (jours travaillés,
  // remplacements) sans compte de connexion (rôle MEMBRE_EQUIPAGE).
  await prisma.user.createMany({
    data: [
      { companyId: company.id, firstName: 'Ahmed', lastName: 'Zahiri', role: 'MEMBRE_EQUIPAGE' },
      { companyId: company.id, firstName: 'Sami', lastName: 'Touil', role: 'MEMBRE_EQUIPAGE' },
      { companyId: company.id, firstName: 'Khalid', lastName: 'Larbi', role: 'MEMBRE_EQUIPAGE' },
    ],
  });

  console.log('Amorçage terminé :');
  console.log(`  Compagnie       : ${company.name} (${company.id})`);
  console.log(`  Remorqueur      : ${tug.name}`);
  console.log(`  Admin           : ${admin.email} / mot de passe: ${adminPassword}`);
  console.log(`  Capitaine       : ${capitaine.firstName} ${capitaine.lastName} / PIN: ${capitainePin}`);
  console.log(`  Chef mécanicien : ${chefMeca.firstName} ${chefMeca.lastName} / PIN: ${chefMecaPin}`);
  console.log(`  Chef d'armement : ${chefArmement.email} / mot de passe: ${chefArmementPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
