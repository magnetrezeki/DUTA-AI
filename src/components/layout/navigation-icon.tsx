import type { NavigationIcon as NavigationIconName } from "@/config/navigation";

export function NavigationIcon({ name, className = "size-5" }: { name: NavigationIconName; className?: string }) {
  const paths = {
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    spark: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" /><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></>,
    connect: <><path d="M8 12a4 4 0 0 1 4-4h3" /><path d="M16 12a4 4 0 0 1-4 4H9" /><path d="m13 5 3 3-3 3M11 19l-3-3 3-3" /></>,
    news: <><path d="M4 5h16v14H4z" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
    career: <><path d="M4 8h16v11H4zM9 8V5h6v3" /><path d="M4 12h16M10 12v2h4v-2" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15M15 6v15" /></>,
    community: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2" /><path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M15 15c3 0 5 1.5 5.5 4" /></>,
    login: <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name]}</svg>;
}
