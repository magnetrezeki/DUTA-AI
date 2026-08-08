export const userRoles = [
  "member",
  "trusted_contributor",
  "organization_admin",
  "employer",
  "moderator",
  "country_admin",
  "super_admin",
] as const;

export type UserRole = (typeof userRoles)[number];

export const platformAdminRoles: readonly UserRole[] = [
  "moderator",
  "country_admin",
  "super_admin",
];

export function isPlatformAdminRole(role: UserRole) {
  return platformAdminRoles.includes(role);
}

export const roleLabels: Record<UserRole, string> = {
  member: "Anggota",
  trusted_contributor: "Kontributor Tepercaya",
  organization_admin: "Admin Organisasi",
  employer: "Pemberi Kerja",
  moderator: "Moderator",
  country_admin: "Admin Negara",
  super_admin: "Super Admin",
};
