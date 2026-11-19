# Cedarce Commerce — Business Plan

Two assisted-buying storefronts run by one team on one backend:

| Brand           | Domain              | What it sells                                                                  | Where it is sourced                                     |
| --------------- | ------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Cedarce Cars    | cars.cedarce.com    | Used, salvage and repo vehicles from North American auctions, **Buy Now only** | AuctionExport (and, later, a licensed auction-data API) |
| Cedarce Gadgets | gadgets.cedarce.com | Phones, laptops, tablets, accessories                                          | Amazon US catalogue via a product-data API              |

Cedarce is not a marketplace and not a reseller holding stock. Cedarce is a **buying agent**: the customer picks an item on our site, talks to us on WhatsApp, pays us by bank transfer, and we buy, ship, clear and deliver on their behalf for a fee. No online payments in v1.

## 1. Working assumptions

These are decisions I made to keep the plan concrete. Change any of them and the rest of the plan still holds.

- **Primary market is Nigeria, secondary Ghana.** AuctionExport already publishes Nigeria and Ghana import guides, ships to Tincan Port, and lists Access Bank and Stanbic as deposit channels. Cedarce's other projects are Nigeria-focused. The site shows prices in USD with a naira estimate.
- **Customers pay in full before we buy.** AuctionExport demands full payment by wire within 3 business days of a Buy Now, with 0.125 %/day late fees and $50/day storage after that. We cannot carry that risk, so the customer funds the purchase first.
- **No stock, no warehouse.** Every order is bought to order.
- **Team at launch is 3 people:** one engineer (you), one sales/ops agent on WhatsApp, one contracted clearing agent at the port. Everyone else is a vendor.

## 2. Customer and problem

**Cars.** Buyers in Nigeria and Ghana want US auction cars because they are 30–50 % cheaper than local used cars, but the process is scary: foreign websites, USD deposits, wire transfers, auction jargon (salvage titles, "run and drive"), RoRo vs container, customs valuation, port touts. Existing options are either do-it-yourself on AuctionExport, or informal "my guy in Texas" agents with no accountability.

**Gadgets.** Buyers want genuine phones and laptops at US prices. Local retail carries a 30–60 % premium and a real risk of refurbished units sold as new. Amazon ships only some items to Nigeria, charges heavy import fees up front, and does not take local payment methods.

**Cedarce's answer** in both cases: a clean local-language catalogue, transparent landed-cost quotes, a human on WhatsApp, local bank payment, and one accountable party from click to delivery.

## 3. Revenue model

### Cars

A per-vehicle quote with these lines, shown to the customer before they pay:

| Line                          | Who sets it     | Notes                                                                                                                               |
| ----------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Vehicle Buy Now price         | Source          | Displayed as-is; Buy Now prices on AuctionExport are often 3–5 % negotiable, which is our upside                                    |
| Auction buyer fee             | Auction         | Estimated per listing; passed through at cost                                                                                       |
| AuctionExport service fee     | AuctionExport   | $195 (≤ $2,999.99) or $295 (≥ $3,000), passed through                                                                               |
| Documentation / title courier | AuctionExport   | $95, passed through                                                                                                                 |
| Inland + ocean shipping       | Shipping line   | Quoted per lot; passed through with a 5–8 % handling margin                                                                         |
| **Cedarce agency fee**        | **Cedarce**     | **$350 flat under $5,000; $500 from $5,000–$15,000; 4 % above $15,000**                                                             |
| Inspection (optional)         | Third party     | $150–$250, Cedarce keeps $50                                                                                                        |
| Customs duty and port charges | Nigeria Customs | Estimated only (35 % duty + 5 % ECOWAS + 7 % port levy + 7.5 % VAT on customs valuation); invoiced at actuals by the clearing agent |
| Clearing agent fee            | Clearing agent  | Fixed partner rate, Cedarce keeps a referral margin                                                                                 |

Expected gross margin per car: **$450–$900**. At 8 cars/month that is roughly $4,000–$7,000/month gross; at 25 cars/month, $12,000–$22,000.

### Gadgets

Price shown on site = (Amazon price + US sales tax + forwarding + duty estimate) × margin. Margin policy, editable in admin per category:

| Category    | Target markup on landed cost |
| ----------- | ---------------------------- |
| Phones      | 12–18 %                      |
| Laptops     | 10–15 %                      |
| Accessories | 25–40 %                      |

Expected gross margin per order: **$40–$150**. Gadgets is lower margin but higher volume and much faster cash cycle (7–14 days vs 6–10 weeks for cars).

### Later revenue (not v1)

- Cedarce Verified inspection reports as a paid add-on.
- Financing partner referral fees (cars).
- Warranty/insurance partner referral (gadgets).
- Paid "find me a car" sourcing service for specific requests.

## 4. Cost structure

**Fixed monthly (lean):**

| Item                                                                            | Est. USD/month |
| ------------------------------------------------------------------------------- | -------------- |
| Hosting (1 VPS for API + workers, managed Postgres, Redis, object storage, CDN) | 60–120         |
| Product/auction data APIs (see sourcing doc)                                    | 50–300         |
| WhatsApp Business (free app at first; Cloud API conversations later)            | 0–50           |
| Domain, email, monitoring                                                       | 20             |
| Sales/ops agent salary                                                          | market rate    |

**Variable per order:** bank transfer fees (Access Bank 3 %, Stanbic 2 % on deposits to AuctionExport), card fees (3.8 % above $2,500 cumulative), FX spread, payment of all pass-through lines.

**Working capital:** Cedarce needs a USD float of at least **$2,000–$5,000** in its AuctionExport account to be able to click Buy Now the moment a customer's naira lands, since the auction needs a 10 % deposit (minimum $600) to reserve a car and the full wire within 3 business days.

## 5. Go-to-market

1. **Pre-launch (weeks 1–2):** WhatsApp Business account, Instagram/TikTok/Facebook pages, 20 seed listings in each vertical, 3 explainer videos ("what a salvage title means", "how much does it really cost to land a Camry", "how we buy your laptop from Amazon").
2. **Launch:** paid Meta ads geo-targeted to Lagos, Abuja, Port Harcourt and Accra, pointing at specific listings. Target CAC under $25 per qualified WhatsApp lead.
3. **Content/SEO:** one landed-cost guide per popular model (Camry, Corolla, Accord, RAV4, Lexus RX, Highlander) and per gadget (iPhone, Galaxy S, MacBook Air, ThinkPad). These pages are the long-term lead engine.
4. **Referrals:** $50 credit per referred car buyer, ₦5,000 per referred gadget buyer.
5. **Trust assets:** every delivered order becomes a public "delivered" post with the customer's permission; a public fee schedule page; a public "how we protect your money" page.

## 6. Operations

See `05-operations-playbook.md` for step-by-step runbooks. Summary of the two flows:

**Car order (6–10 weeks):**
Lead on WhatsApp → written quote (PDF generated from admin) → customer pays naira to Cedarce → Cedarce funds AuctionExport and clicks Buy Now → Cedarce wires the balance within 3 business days → title and car collected by inland transport → ocean shipping booked (RoRo if drivable, container otherwise) → Bill of Lading forwarded to customer → clearing agent handles customs on arrival → customer collects or we deliver → review request.

**Gadget order (7–14 days):**
Lead → quote → payment → purchase on Amazon shipped to a US forwarder (or Amazon Global Shipping where available) → forwarder air-freights to Lagos → local courier → delivery → review request.

## 7. Key risks and mitigations

| Risk                                                                                                                                                                                                                                       | Mitigation                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source terms of use.** AuctionExport's Terms of Use allow personal, non-commercial use only and forbid reproducing content without written consent. Amazon forbids scraping and the Creators API licence restricts how data may be used. | Do not scrape either site for the public catalogue. Use a licensed data API for cars (Copart/IAAI aggregators), request a written dealer/partner agreement with AuctionExport, and use a third-party product API plus our own copy and images for gadgets. Full detail in `04-legal-and-sourcing.md`. |
| **Customer pays, car sells before we buy**                                                                                                                                                                                                 | Site refreshes listings every 15–60 min and hides sold ones; quote is valid 24 h; keep a USD float so we can click Buy Now within minutes of payment.                                                                                                                                                 |
| **FX volatility**                                                                                                                                                                                                                          | Quote in USD, show naira estimate, lock the naira amount only for 24 h, convert on receipt.                                                                                                                                                                                                           |
| **Non-payment / fraud**                                                                                                                                                                                                                    | No work starts before cleared funds. Deposits non-refundable once we have bought. Clear written terms accepted on WhatsApp.                                                                                                                                                                           |
| **Damage, misdescription, missing parts**                                                                                                                                                                                                  | Encourage paid inspections; show full auction damage codes; never describe a salvage car as clean.                                                                                                                                                                                                    |
| **Customs valuation surprises**                                                                                                                                                                                                            | Show duty as an estimate with a visible range; clearing agent gives a firm figure before the ship docks.                                                                                                                                                                                              |
| **Chargebacks and disputes**                                                                                                                                                                                                               | Bank transfer only, written quote, signed order confirmation.                                                                                                                                                                                                                                         |
| **Key-person risk**                                                                                                                                                                                                                        | Everything lives in the admin: leads, orders, stage history, documents.                                                                                                                                                                                                                               |

## 8. Twelve-month targets

| Month | Cars/month | Gadgets/month | Monthly gross margin |
| ----- | ---------- | ------------- | -------------------- |
| 3     | 3          | 15            | ~$3,000              |
| 6     | 8          | 40            | ~$8,000              |
| 12    | 20         | 100           | ~$20,000             |

Break-even on fixed costs is around 3 cars + 15 gadgets per month at the margins above.
