export type ReportType =
  | 'MISSIONS_PAR_REMORQUEUR'
  | 'MISSIONS_PAR_CAPITAINE'
  | 'MISSIONS_PAR_PILOTE'
  | 'MISSIONS_PAR_NAVIRE'
  | 'MISSIONS_PAR_TYPE_MOUVEMENT'
  | 'HEURES_MOTEUR'
  | 'CARBURANT'
  | 'MAINTENANCE'
  | 'CERTIFICATS'
  | 'EXERCICES'
  | 'EQUIPAGES'
  | 'JOURS_TRAVAILLES'
  | 'REMPLACEMENTS'
  | 'INCIDENTS'
  | 'ACTIONS_CORRECTIVES';

export const REPORT_LABEL: Record<ReportType, string> = {
  MISSIONS_PAR_REMORQUEUR: 'Missions par remorqueur',
  MISSIONS_PAR_CAPITAINE: 'Missions par capitaine',
  MISSIONS_PAR_PILOTE: 'Missions par pilote',
  MISSIONS_PAR_NAVIRE: 'Missions par navire',
  MISSIONS_PAR_TYPE_MOUVEMENT: 'Missions par type de mouvement',
  HEURES_MOTEUR: 'Heures moteur',
  CARBURANT: 'Carburant',
  MAINTENANCE: 'Maintenance',
  CERTIFICATS: 'Certificats',
  EXERCICES: 'Exercices',
  EQUIPAGES: 'Équipages',
  JOURS_TRAVAILLES: 'Jours/heures travaillés par personne',
  REMPLACEMENTS: 'Remplacements',
  INCIDENTS: 'Incidents',
  ACTIONS_CORRECTIVES: 'Actions correctives',
};

export const TECHNICAL_REPORTS: ReportType[] = ['HEURES_MOTEUR', 'CARBURANT', 'MAINTENANCE'];
