export type NavigationIcon = "home" | "spark" | "connect" | "news" | "career" | "map" | "community" | "login";

export type NavigationItem = {
  href: string;
  label: string;
  shortLabel?: string;
  description?: string;
  icon: NavigationIcon;
  emphasized?: boolean;
};

export const moduleNavigation: readonly NavigationItem[] = [
  { href: "/ai", label: "DUTA AI", description: "Asisten informasi", icon: "spark" },
  { href: "/connect", label: "Connect", description: "Layanan resmi", icon: "connect" },
  { href: "/news", label: "News", description: "Informasi terkurasi", icon: "news" },
  { href: "/career", label: "Karier", description: "Peluang kerja", icon: "career" },
  { href: "/map", label: "Map", description: "Direktori komunitas", icon: "map" },
  { href: "/organizations", label: "Organisasi", shortLabel: "Komunitas", description: "Jejaring diaspora", icon: "community" },
];

export const accountNavigation: readonly NavigationItem[] = [
  { href: "/login", label: "Masuk", icon: "login" },
  { href: "/dashboard", label: "Dashboard", icon: "home", emphasized: true },
];

export const primaryNavigation = [...moduleNavigation, ...accountNavigation] as const;
