import "./globals.css";
import { adminGet } from "../lib/api";

export const metadata = { title: "Cedarce Admin" };
const nav = [
  ["/", "Dashboard"],
  ["/listings", "Listings"],
  ["/rules", "Filter rules"],
  ["/leads", "Leads"],
  ["/orders", "Orders"],
  ["/sources", "Sources & sync"],
  ["/settings", "Settings"],
];

export default async function Layout({ children }: { children: React.ReactNode }) {
  const me = await adminGet<{ name: string; role: string }>("/me").catch(() => null);
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="flex">
          <aside className="hidden w-56 shrink-0 border-r bg-white p-4 md:block">
            <a href="/" className="block text-lg font-bold text-brand-700">
              Cedarce Admin
            </a>
            <nav className="mt-6 space-y-1 text-sm">
              {nav.map(([h, l]) => (
                <a key={h} href={h} className="block rounded px-2 py-1.5 hover:bg-gray-100">
                  {l}
                </a>
              ))}
            </nav>
            <p className="mt-8 text-xs text-gray-500">
              {me ? (
                `${me.name} · ${me.role}`
              ) : (
                <a href="/login" className="underline">
                  Sign in
                </a>
              )}
            </p>
          </aside>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
