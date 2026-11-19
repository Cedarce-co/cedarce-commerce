export const SITE = {
  brand: "Cedarce Gadgets" as const,
  vertical: "gadgets" as "cars" | "gadgets",
  tagline: "Genuine phones and laptops at US prices, delivered to your door",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  nav: [
    { href: "/listings", label: "Browse gadgets" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/fees", label: "Fees" },
  ],
};
