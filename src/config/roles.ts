export const FAMILY_ROLES = ["familia", "docente", "egresado", "otro"] as const;
export type FamilyRole = (typeof FAMILY_ROLES)[number];

export const FAMILY_ROLE_LABEL: Record<FamilyRole, string> = {
  familia: "Familia",
  docente: "Docente",
  egresado: "Egresado/a",
  otro: "Otro",
};

export const FAMILY_ROLE_OPTIONS: ReadonlyArray<{ value: FamilyRole; label: string }> =
  FAMILY_ROLES.map((value) => ({ value, label: FAMILY_ROLE_LABEL[value] }));
