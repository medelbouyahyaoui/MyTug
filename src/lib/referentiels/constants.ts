export type RefKind = 'PILOT' | 'MOVEMENT_TYPE' | 'CERTIFICATE_TYPE' | 'EXERCISE_TYPE' | 'MAINTENANCE_EQUIPMENT_TYPE' | 'TUG_TYPE';

export const REF_KIND_LABEL: Record<RefKind, string> = {
  PILOT: 'Pilotes',
  MOVEMENT_TYPE: 'Types de mouvement',
  CERTIFICATE_TYPE: 'Types de certificats',
  EXERCISE_TYPE: "Types d'exercices",
  MAINTENANCE_EQUIPMENT_TYPE: "Types d'équipement de maintenance",
  TUG_TYPE: 'Types de remorqueur',
};
