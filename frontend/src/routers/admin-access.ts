export type UserRole = "PLATFORM_ADMIN" | "ADMIN" | "EMPLOYEE";

export const roleLabels: Record<UserRole, string> = {
  PLATFORM_ADMIN: "Suporte Nupify",
  ADMIN: "Administrador",
  EMPLOYEE: "Funcionário",
};

export const canManageRestaurant = (role?: UserRole) =>
  role === "ADMIN" || role === "PLATFORM_ADMIN";

export const canOperateSales = (role?: UserRole) =>
  role === "ADMIN" || role === "EMPLOYEE";

export const adminHome = (role?: UserRole) =>
  role === "ADMIN" ? "/admin/dashboard" : "/admin/mesas";

export function canAccessAdminSection(role: UserRole, section: string) {
  switch (section) {
    case "tables":
    case "orders":
      return Object.hasOwn(roleLabels, role);
    case "users":
      return role === "PLATFORM_ADMIN";
    case "settings":
    case "menu":
    case "promotions":
    case "menuPreview":
    case "menuPreviewFromProducts":
      return canManageRestaurant(role);
    case "dashboard":
    case "reports":
      return role === "ADMIN";
    default:
      return false;
  }
}

const sections: Record<string, string> = {
  dashboard: "dashboard",
  relatorios: "reports",
  pedidos: "orders",
  mesas: "tables",
  cardapio: "menu",
  promocoes: "promotions",
  "ver-cardapio": "menuPreview",
  configuracoes: "settings",
  usuarios: "users",
};

export function canAccessAdminPath(role: UserRole, pathname: string) {
  const section = pathname.toLowerCase().split("/").filter(Boolean)[1];
  return !section || canAccessAdminSection(role, sections[section]);
}
