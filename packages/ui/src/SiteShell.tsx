import type { ReactNode } from "react";

export function SiteShell({
  brand,
  nav,
  children,
  whatsappHref,
}: {
  brand: string;
  nav: Array<{ href: string; label: string }>;
  children: ReactNode;
  whatsappHref: string;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="/" className="text-lg font-bold text-brand-700">
            {brand}
          </a>
          <nav className="hidden gap-6 text-sm md:flex">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-brand-600">
                {n.label}
              </a>
            ))}
          </nav>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            Chat on WhatsApp
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="mt-16 border-t py-8 text-center text-xs text-gray-500">
        <p>
          {brand} is an independent buying agent. We are not affiliated with any auction, retailer
          or marketplace we source from.
        </p>
        <p className="mt-1">
          Duty, VAT and shipping shown on this site are estimates. Final duty is set by customs on
          arrival.
        </p>
      </footer>
    </div>
  );
}
