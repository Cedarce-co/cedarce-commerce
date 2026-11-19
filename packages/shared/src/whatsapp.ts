/** Build a wa.me deep link with a prefilled message that carries the listing reference. */
export function whatsappLink(number: string, message: string): string {
  const digits = number.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function listingEnquiryMessage(opts: {
  brand: "Cedarce Cars" | "Cedarce Gadgets";
  title: string;
  ref: string;
  priceUsd: number;
  url?: string;
}): string {
  const lines = [
    `Hi ${opts.brand}, I'm interested in: ${opts.title}`,
    `Ref: ${opts.ref} · Price: $${opts.priceUsd.toLocaleString("en-US")}`,
  ];
  if (opts.url) lines.push(opts.url);
  lines.push("Please send me a full landed-cost quote.");
  return lines.join("\n");
}
