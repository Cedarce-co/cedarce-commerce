import type { Metadata } from "next";
import "./globals.css";
import { SiteShell } from "@cedarce/ui";
import { whatsappLink } from "@cedarce/shared";
import { SITE } from "./site";

export const metadata: Metadata = {
  title: { default: SITE.brand, template: `%s · ${SITE.brand}` },
  description: SITE.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteShell
          brand={SITE.brand}
          nav={SITE.nav}
          whatsappHref={whatsappLink(SITE.whatsapp, `Hi ${SITE.brand}, I'd like some help.`)}
        >
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
