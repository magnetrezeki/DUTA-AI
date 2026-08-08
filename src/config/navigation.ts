type NavigationItem = {
  href: string;
  label: string;
  emphasized?: boolean;
};

export const primaryNavigation: readonly NavigationItem[] = [
  { href: "/connect", label: "Connect" },
  { href: "/news", label: "News" },
  { href: "/map", label: "Map" },
  { href: "/organizations", label: "Komunitas" },
  { href: "/career", label: "Karier" },
  { href: "/ai", label: "Asisten AI" },
  { href: "/login", label: "Masuk" },
  { href: "/dashboard", label: "Dashboard", emphasized: true },
];
