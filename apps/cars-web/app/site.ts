export const SITE = {
  brand: "Cedarce Cars" as const,
  vertical: "cars" as "cars" | "gadgets",
  tagline: "Buy Now cars from US auctions, delivered to Lagos and Accra",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  nav: [
    { href: "/listings", label: "Browse cars" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/fees", label: "Fees" },
  ],
};
