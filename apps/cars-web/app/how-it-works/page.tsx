import { SITE } from "../site";
export const metadata = { title: "How it works" };
const steps =
  SITE.vertical === "cars"
    ? [
        [
          "Choose a car",
          "Every car on this site is a fixed-price Buy Now listing, so there is no bidding and no auction uncertainty.",
        ],
        [
          "Chat with us",
          "Tap the WhatsApp button on any car. We confirm the condition, title type and your destination, and offer an optional independent inspection.",
        ],
        [
          "Get a full quote",
          "One written quote with every line: car, auction fee, platform fees, shipping, our service fee and a customs duty estimate. Valid 24 hours.",
        ],
        [
          "Pay by bank transfer",
          "No online payments. You pay in naira or cedis to our business account. We only buy once your payment clears.",
        ],
        [
          "We buy and ship",
          "We purchase the car the same day, wire the auction, arrange inland pickup and ocean shipping (RoRo or container), and send you the Bill of Lading.",
        ],
        [
          "Clear and collect",
          "Our clearing agent handles customs at Tincan or Tema. You pay duty at actuals, then collect or we deliver. Typical total time: 6–10 weeks.",
        ],
      ]
    : [
        [
          "Choose a gadget",
          "Phones, laptops and tablets sourced from trusted US retailers, listed with a transparent landed price.",
        ],
        [
          "Chat with us",
          "Tap WhatsApp on any item. We confirm the exact model, storage and colour and check live availability.",
        ],
        [
          "Get a full quote",
          "Item price, US tax, air freight, duty estimate and our service fee in one message. Valid 24 hours.",
        ],
        [
          "Pay by bank transfer",
          "No online payments. Pay in naira or cedis; we buy once it clears.",
        ],
        ["We buy and ship", "We purchase and air-freight the item through our forwarder."],
        ["Delivered to you", "Typical total time: 7–14 days. Unboxing photo on delivery."],
      ];
export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">How it works</h1>
      <ol className="mt-6 space-y-5">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
              {i + 1}
            </span>
            <div>
              <h2 className="font-semibold">{t}</h2>
              <p className="text-gray-600">{d}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
