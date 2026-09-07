-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMINISTRATEUR', 'CHEF_ARMEMENT', 'CHEF_MECANICIEN', 'CAPITAINE', 'DISPATCHER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIF', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "TugOperationalStatus" AS ENUM ('DISPONIBLE', 'OCCUPE', 'MAINTENANCE', 'DESARME', 'ACTIVE_TEMPORAIREMENT', 'INDISPONIBLE');

-- CreateEnum
CREATE TYPE "EngineKind" AS ENUM ('PRINCIPAL', 'AUXILIAIRE');

-- CreateEnum
CREATE TYPE "ServicePickupRole" AS ENUM ('CAPITAINE', 'CHEF_MECANICIEN');

-- CreateEnum
CREATE TYPE "ServicePickupStatus" AS ENUM ('A_TEMPS', 'EN_RETARD', 'NON_EFFECTUEE');

-- CreateEnum
CREATE TYPE "HandoverKind" AS ENUM ('CAPITAINE', 'CHEF_MECANICIEN');

-- CreateEnum
CREATE TYPE "ContestationStatus" AS ENUM ('OUVERTE', 'RESOLUE');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('EN_COURS', 'TERMINEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "MachineState" AS ENUM ('NORMAL', 'A_SURVEILLER', 'PANNE');

-- CreateEnum
CREATE TYPE "FluidType" AS ENUM ('CARBURANT', 'HUILE');

-- CreateEnum
CREATE TYPE "FluidEventType" AS ENUM ('AVITAILLEMENT', 'NIVEAU_DECLARE');

-- CreateEnum
CREATE TYPE "MaintenanceIntervalType" AS ENUM ('HEURES', 'CALENDAIRE', 'LES_DEUX');

-- CreateEnum
CREATE TYPE "MaintenanceCalendarUnit" AS ENUM ('JOURS', 'MOIS', 'ANNEES');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE');

-- CreateEnum
CREATE TYPE "ExerciseEntryStatus" AS ENUM ('PREVU', 'A_VENIR', 'REALISE', 'EN_RETARD', 'ANNULE');

-- CreateEnum
CREATE TYPE "SafetyStatus" AS ENUM ('BROUILLON', 'SOUMIS', 'VALIDE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIF', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "homePort" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "serviceCycleWorkDays" INTEGER NOT NULL DEFAULT 3,
    "serviceCycleRestDays" INTEGER NOT NULL DEFAULT 6,
    "reliefTimeOfDay" TEXT NOT NULL DEFAULT '06:00',
    "fuelAlertThresholdPct" INTEGER NOT NULL DEFAULT 20,
    "maintenanceHoursAlert1" INTEGER NOT NULL DEFAULT 50,
    "maintenanceHoursAlert2" INTEGER NOT NULL DEFAULT 10,
    "maintenanceDaysAlert1" INTEGER NOT NULL DEFAULT 30,
    "maintenanceDaysAlert2" INTEGER NOT NULL DEFAULT 7,
    "maintenanceDaysAlert3" INTEGER NOT NULL DEFAULT 1,
    "certificateDaysAlert1" INTEGER NOT NULL DEFAULT 60,
    "certificateDaysAlert2" INTEGER NOT NULL DEFAULT 30,
    "certificateDaysAlert3" INTEGER NOT NULL DEFAULT 7,
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigChangeLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfigChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poste" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Poste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pilot" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pilot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovementType" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovementType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateType" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificateType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseType" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceEquipmentType" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceEquipmentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TugType" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TugType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIF',
    "email" TEXT,
    "passwordHash" TEXT,
    "pinHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tug" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "internalCode" TEXT,
    "tugTypeId" TEXT NOT NULL,
    "status" "TugOperationalStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "imo" TEXT,
    "callSign" TEXT,
    "flag" TEXT,
    "yearBuilt" INTEGER,
    "shipyard" TEXT,
    "lengthM" DOUBLE PRECISION,
    "widthM" DOUBLE PRECISION,
    "draftM" DOUBLE PRECISION,
    "tonnageGT" DOUBLE PRECISION,
    "displacementT" DOUBLE PRECISION,
    "bollardPullT" DOUBLE PRECISION,
    "speedKnots" DOUBLE PRECISION,
    "propulsionType" TEXT,
    "fuelCapacityT" DOUBLE PRECISION,
    "oilCapacityL" DOUBLE PRECISION,
    "waterCapacityL" DOUBLE PRECISION,
    "fireFightingEquipment" TEXT,
    "towingEquipment" TEXT,
    "winch" TEXT,
    "extraSpecs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Engine" (
    "id" TEXT NOT NULL,
    "tugId" TEXT NOT NULL,
    "kind" "EngineKind" NOT NULL,
    "label" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "powerKw" DOUBLE PRECISION,
    "currentHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Engine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TugStatusHistory" (
    "id" TEXT NOT NULL,
    "tugId" TEXT NOT NULL,
    "status" "TugOperationalStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "reason" TEXT,
    "temporaryActivationStart" TIMESTAMP(3),
    "temporaryActivationEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TugStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostAssignment" (
    "id" TEXT NOT NULL,
    "tugId" TEXT NOT NULL,
    "posteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "reason" TEXT,
    "declaredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "tugId" TEXT NOT NULL,
    "plannedStart" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePickup" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ServicePickupRole" NOT NULL,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "pickedUpAt" TIMESTAMP(3),
    "status" "ServicePickupStatus" NOT NULL DEFAULT 'A_TEMPS',
    "notifiedChiefAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicePickup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoverDeclaration" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "HandoverKind" NOT NULL,
    "fuelRemainingT" DOUBLE PRECISION,
    "oilRemainingL" DOUBLE PRECISION,
    "engineHourReadings" JSONB,
    "technicalState" TEXT,
    "remarks" TEXT,
    "isValidated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HandoverDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contestation" (
    "id" TEXT NOT NULL,
    "handoverDeclarationId" TEXT,
    "safetyObservationId" TEXT,
    "authorId" TEXT NOT NULL,
    "contestedItem" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ContestationStatus" NOT NULL DEFAULT 'OUVERTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Contestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "tugId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "operationGroupId" TEXT,
    "pilotId" TEXT NOT NULL,
    "vesselName" TEXT NOT NULL,
    "movementTypeId" TEXT NOT NULL,
    "movementTypeOtherDetail" TEXT,
    "position" TEXT,
    "departureFromDockAt" TIMESTAMP(3) NOT NULL,
    "movementStartAt" TIMESTAMP(3),
    "movementEndAt" TIMESTAMP(3),
    "returnToDockAt" TIMESTAMP(3),
    "requestedTugTypeId" TEXT,
    "externalAssistanceRequested" BOOLEAN NOT NULL DEFAULT false,
    "externalAssistanceCompany" TEXT,
    "externalAssistanceReason" TEXT,
    "status" "MissionStatus" NOT NULL DEFAULT 'EN_COURS',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineHourReading" (
    "id" TEXT NOT NULL,
    "engineId" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngineHourReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineLogEntry" (
    "id" TEXT NOT NULL,
    "tugId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "state" "MachineState" NOT NULL,
    "observation" TEXT NOT NULL,
    "isIncident" BOOLEAN NOT NULL DEFAULT false,
    "correctiveAction" TEXT,
    "remarks" TEXT,
    "linkedMaintenanceInterventionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MachineLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FluidEvent" (
    "id" TEXT NOT NULL,
    "tugId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fluidType" "FluidType" NOT NULL,
    "eventType" "FluidEventType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FluidEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenancePlan" (
    "id" TEXT NOT NULL,
    "tugId" TEXT NOT NULL,
    "engineId" TEXT,
    "equipmentTypeId" TEXT,
    "equipmentFreeText" TEXT,
    "intervalType" "MaintenanceIntervalType" NOT NULL,
    "intervalHours" DOUBLE PRECISION,
    "intervalCalendarValue" INTEGER,
    "intervalCalendarUnit" "MaintenanceCalendarUnit",
    "lastDoneAt" TIMESTAMP(3),
    "lastDoneHours" DOUBLE PRECISION,
    "nextDueAt" TIMESTAMP(3),
    "nextDueHours" DOUBLE PRECISION,
    "responsibleId" TEXT NOT NULL,
    "instructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenancePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceIntervention" (
    "id" TEXT NOT NULL,
    "tugId" TEXT NOT NULL,
    "planId" TEXT,
    "type" "MaintenanceType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "engineHoursAtIntervention" DOUBLE PRECISION,
    "description" TEXT,
    "performedBy" TEXT,
    "responsibleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'terminée',
    "partsUsed" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceTask" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "MaintenanceTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "tugId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "authority" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseProgramEntry" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "tugId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "captainId" TEXT NOT NULL,
    "plannedAt" TIMESTAMP(3),
    "frequency" TEXT,
    "requiredParticipants" TEXT,
    "status" "ExerciseEntryStatus" NOT NULL DEFAULT 'PREVU',
    "remarks" TEXT,
    "referenceDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseProgramEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseExecution" (
    "id" TEXT NOT NULL,
    "programEntryId" TEXT NOT NULL,
    "executedById" TEXT NOT NULL,
    "actualDate" TIMESTAMP(3) NOT NULL,
    "participants" TEXT,
    "result" TEXT,
    "observations" TEXT,
    "correctiveActions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyObservation" (
    "id" TEXT NOT NULL,
    "tugId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SafetyStatus" NOT NULL DEFAULT 'BROUILLON',
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyCorrectiveAction" (
    "id" TEXT NOT NULL,
    "safetyObservationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responsible" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ouverte',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyCorrectiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIF',
    "expiresAt" TIMESTAMP(3),
    "tugId" TEXT,
    "maintenanceInterventionId" TEXT,
    "certificateId" TEXT,
    "exerciseExecutionId" TEXT,
    "safetyObservationId" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "severity" "NotificationSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Poste_companyId_name_key" ON "Poste"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_role_idx" ON "User"("companyId", "role");

-- CreateIndex
CREATE INDEX "PostAssignment_tugId_serviceId_posteId_idx" ON "PostAssignment"("tugId", "serviceId", "posteId");

-- CreateIndex
CREATE INDEX "Mission_tugId_status_idx" ON "Mission"("tugId", "status");

-- CreateIndex
CREATE INDEX "Mission_operationGroupId_idx" ON "Mission"("operationGroupId");

-- CreateIndex
CREATE INDEX "EngineHourReading_engineId_recordedAt_idx" ON "EngineHourReading"("engineId", "recordedAt");

-- CreateIndex
CREATE INDEX "ExerciseProgramEntry_tugId_captainId_year_idx" ON "ExerciseProgramEntry"("tugId", "captainId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseExecution_programEntryId_key" ON "ExerciseExecution"("programEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_versionNumber_key" ON "DocumentVersion"("documentId", "versionNumber");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "ConfigChangeLog" ADD CONSTRAINT "ConfigChangeLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigChangeLog" ADD CONSTRAINT "ConfigChangeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poste" ADD CONSTRAINT "Poste_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pilot" ADD CONSTRAINT "Pilot_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementType" ADD CONSTRAINT "MovementType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateType" ADD CONSTRAINT "CertificateType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseType" ADD CONSTRAINT "ExerciseType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceEquipmentType" ADD CONSTRAINT "MaintenanceEquipmentType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TugType" ADD CONSTRAINT "TugType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentType" ADD CONSTRAINT "DocumentType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tug" ADD CONSTRAINT "Tug_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tug" ADD CONSTRAINT "Tug_tugTypeId_fkey" FOREIGN KEY ("tugTypeId") REFERENCES "TugType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engine" ADD CONSTRAINT "Engine_tugId_fkey" FOREIGN KEY ("tugId") REFERENCES "Tug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TugStatusHistory" ADD CONSTRAINT "TugStatusHistory_tugId_fkey" FOREIGN KEY ("tugId") REFERENCES "Tug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TugStatusHistory" ADD CONSTRAINT "TugStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAssignment" ADD CONSTRAINT "PostAssignment_tugId_fkey" FOREIGN KEY ("tugId") REFERENCES "Tug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAssignment" ADD CONSTRAINT "PostAssignment_posteId_fkey" FOREIGN KEY ("posteId") REFERENCES "Poste"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAssignment" ADD CONSTRAINT "PostAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAssignment" ADD CONSTRAINT "PostAssignment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAssignment" ADD CONSTRAINT "PostAssignment_declaredById_fkey" FOREIGN KEY ("declaredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_tugId_fkey" FOREIGN KEY ("tugId") REFERENCES "Tug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePickup" ADD CONSTRAINT "ServicePickup_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePickup" ADD CONSTRAINT "ServicePickup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverDeclaration" ADD CONSTRAINT "HandoverDeclaration_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverDeclaration" ADD CONSTRAINT "HandoverDeclaration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contestation" ADD CONSTRAINT "Contestation_handoverDeclarationId_fkey" FOREIGN KEY ("handoverDeclarationId") REFERENCES "HandoverDeclaration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contestation" ADD CONSTRAINT "Contestation_safetyObservationId_fkey" FOREIGN KEY ("safetyObservationId") REFERENCES "SafetyObservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contestation" ADD CONSTRAINT "Contestation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_tugId_fkey" FOREIGN KEY ("tugId") REFERENCES "Tug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "Pilot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_movementTypeId_fkey" FOREIGN KEY ("movementTypeId") REFERENCES "MovementType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_requestedTugTypeId_fkey" FOREIGN KEY ("requestedTugTypeId") REFERENCES "TugType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineHourReading" ADD CONSTRAINT "EngineHourReading_engineId_fkey" FOREIGN KEY ("engineId") REFERENCES "Engine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineLogEntry" ADD CONSTRAINT "MachineLogEntry_tugId_fkey" FOREIGN KEY ("tugId") REFERENCES "Tug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineLogEntry" ADD CONSTRAINT "MachineLogEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineLogEntry" ADD CONSTRAINT "MachineLogEntry_linkedMaintenanceInterventionId_fkey" FOREIGN KEY ("linkedMaintenanceInterventionId") REFERENCES "MaintenanceIntervention"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FluidEvent" ADD CONSTRAINT "FluidEvent_tugId_fkey" FOREIGN KEY ("tugId") REFERENCES "Tug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FluidEvent" ADD CONSTRAINT "FluidEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_tugId_fkey" FOREIGN KEY ("tugId") REFERENCES "Tug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_engineId_fkey" FOREIGN KEY ("engineId") REFERENCES "Engine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES "MaintenanceEquipmentType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceIntervention" ADD CONSTRAINT "MaintenanceIntervention_tugId_fkey" FOREIGN KEY ("tugId") REFERENCES "Tug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceIntervention" ADD CONSTRAINT "MaintenanceIntervention_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MaintenancePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceIntervention" ADD CONSTRAINT "MaintenanceIntervention_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceTask" ADD CONSTRAINT "MaintenanceTask_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "MaintenanceIntervention"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_tugId_fkey" FOREIGN KEY ("tugId") REFERENCES "Tug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "CertificateType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseProgramEntry" ADD CONSTRAINT "ExerciseProgramEntry_tugId_fkey" FOREIGN KEY ("tugId") REFERENCES "Tug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseProgramEntry" ADD CONSTRAINT "ExerciseProgramEntry_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ExerciseType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseProgramEntry" ADD CONSTRAINT "ExerciseProgramEntry_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseExecution" ADD CONSTRAINT "ExerciseExecution_programEntryId_fkey" FOREIGN KEY ("programEntryId") REFERENCES "ExerciseProgramEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseExecution" ADD CONSTRAINT "ExerciseExecution_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyObservation" ADD CONSTRAINT "SafetyObservation_tugId_fkey" FOREIGN KEY ("tugId") REFERENCES "Tug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyObservation" ADD CONSTRAINT "SafetyObservation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyObservation" ADD CONSTRAINT "SafetyObservation_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyCorrectiveAction" ADD CONSTRAINT "SafetyCorrectiveAction_safetyObservationId_fkey" FOREIGN KEY ("safetyObservationId") REFERENCES "SafetyObservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "DocumentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tugId_fkey" FOREIGN KEY ("tugId") REFERENCES "Tug"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_maintenanceInterventionId_fkey" FOREIGN KEY ("maintenanceInterventionId") REFERENCES "MaintenanceIntervention"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_exerciseExecutionId_fkey" FOREIGN KEY ("exerciseExecutionId") REFERENCES "ExerciseExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_safetyObservationId_fkey" FOREIGN KEY ("safetyObservationId") REFERENCES "SafetyObservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
