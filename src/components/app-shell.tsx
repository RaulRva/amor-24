"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCouple } from "@/components/couple-context";
import { createClient } from "@/lib/supabase/client";

const tabs = [
  { href: "/", label: "Hoy", icon: HomeIcon },
  { href: "/calendario", label: "Agenda", icon: CalIcon },
  { href: "/album", label: "Álbum", icon: AlbumIcon },
  { href: "/ahorros", label: "Ahorros", icon: SaveIcon },
];

const moreLinks = [
  { href: "/mapa", label: "Mapa" },
  { href: "/ecos", label: "Ecos" },
  { href: "/cuenta-atras", label: "Cuentas atrás" },
  { href: "/suenos", label: "Sueños" },
  { href: "/ajustes", label: "Ajustes" },
];

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}

function AlbumIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m8 15 2.5-3 2 2.5L16 11l5 6" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M9 12h6" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.2 6.2l1.6 1.6M16.2 16.2l1.6 1.6M6.2 17.8l1.6-1.6M16.2 7.8l1.6-1.6" />
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, partner } = useCouple();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreLinks.some((link) => pathname === link.href);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  async function leaveSpace() {
    if (!window.confirm("¿Salir de este espacio? Luego podéis crear uno nuevo o uniros a otro.")) return;
    const { error } = await createClient().rpc("leave_couple");
    if (error) return;
    router.replace("/unirse");
    router.refresh();
  }

  return (
    <div className="shell">
      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.28em] text-ink-soft uppercase">nosotros</p>
          <h1 className="font-serif text-[2rem] leading-none">24</h1>
        </div>
        <div className="flex items-end gap-3">
          <p className="max-w-[52%] text-right text-sm leading-snug text-ink-soft">
            {profile.display_name}
            {partner ? ` · ${partner.display_name}` : " · esperando a tu persona"}
          </p>
          <Link href="/ajustes" aria-label="Ajustes" className="grid h-10 w-10 place-items-center rounded-full bg-paper-2 text-ink">
            <GearIcon />
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>

      <nav className="tabbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href} className={active ? "active" : ""}>
              <Icon />
              {tab.label}
            </Link>
          );
        })}
        <button type="button" className={moreActive || moreOpen ? "active" : ""} onClick={() => setMoreOpen(true)}>
          <MoreIcon />
          Más
        </button>
      </nav>

      {moreOpen ? (
        <>
          <button className="more-backdrop" aria-label="Cerrar" onClick={() => setMoreOpen(false)} />
          <div className="more-sheet">
            <p className="mb-2 text-[11px] tracking-[0.22em] text-ink-soft uppercase">más</p>
            {moreLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            <button className="more-item" onClick={leaveSpace}>
              Salir
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
