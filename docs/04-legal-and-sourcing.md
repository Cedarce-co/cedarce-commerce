# Legal and Sourcing Strategy

This is the part of the plan that decides whether the business is durable. The short version: **buy through AuctionExport and Amazon, but do not scrape either site to build the public catalogue.** Use licensed data feeds for display and keep the purchase relationship separate from the data relationship.

## Cars: what AuctionExport's terms say (checked 19 Nov 2026)

AuctionExport's Terms of Use (`/en/Home/Terms_Of_Use`) include:

- §1.3: "Unless stated otherwise the Services are for your personal and non-commercial use only."
- §9.1: "None of the content may be downloaded, copied, reproduced, transmitted, stored, sold or distributed" without prior written consent.
- §15: no reproduction or redistribution of content "including caching, framing and similar means" without written permission.
- §5.2(h): no advertising or offering to buy or sell goods for any commercial purpose on the site.
- §5.2(k): nothing that could "overburden or impair" the site.
- `robots.txt` blocks several AI crawlers but allows Googlebot and Bingbot; it does not define an API.

Also relevant: AuctionExport is itself a broker on top of Copart, IAAI and dealer inventory. The photos and lot data on its pages originate from those auctions.

**Consequences for the plan**

1. **Buying through AuctionExport as an agent is fine.** Cedarce holds one business account, deposits funds, clicks Buy Now on behalf of a customer and pays the invoice. That is ordinary use of their service and what their "authorized dealers" already do. Ask them explicitly for a dealer account so one account can legitimately serve many end buyers (§4.1 allows one account per dealer).
2. **Republishing their listings and photos on cars.cedarce.com without written consent breaches §9.1 and §15.** Mitigate by, in order of preference:
   - **a) Written partner agreement with AuctionExport.** Email sales/partnerships: Cedarce brings them buyers from Nigeria/Ghana, wants to display a filtered subset of Buy Now inventory with attribution and a link, and asks for a feed or permission. Many brokers say yes because every car we sell is a car they sell. The adapter is built so that the day they say yes we can switch it on.
   - **b) Licensed auction-data API** (e.g. Apibara Vehicle Auction Data API, or an Apify Copart/IAAI dataset actor) that exposes Copart/IAAI Buy Now lots with the same filters. The catalogue is built from that feed; when a customer picks a lot we locate the same lot on AuctionExport (by VIN/lot number) and buy it there. Cost is typically tens to a few hundred dollars per month at our volume. **This is the default for Phase 1.**
   - **c) Manual/CSV curation** for launch: the ops agent exports 50–200 hand-picked Buy Now cars a week with our own summaries and only the data needed to identify the car. Zero licensing risk, low volume.
3. **Never hotlink images.** Whatever the source, mirror to our storage so that licensing, performance and "image disappears when sold" are all under our control.
4. **Keep an audit trail.** Each Listing records its `sourceId` and `sourceUrl`; if a source asks us to take content down we can do it per source in one admin action.

## Gadgets: what Amazon allows

- Amazon's **Product Advertising API 5.0 was retired in 2026** in favour of the **Creators API**, which requires an approved Associates account that keeps generating qualifying sales. Its licence exists to drive traffic _to_ Amazon; using the data to sell the goods ourselves off-Amazon is outside that licence and keys get revoked when referral sales stop.
- Amazon's Conditions of Use prohibit scraping and automated data collection.
- Buying on Amazon and reselling elsewhere is legal (first-sale doctrine); Amazon's "dropshipping policy" governs sellers _on_ Amazon, which we are not.

**Consequences**

1. **Catalogue data comes from a third-party product-data API** (Rainforest API, Keepa, or an Apify Amazon actor). They are paid per request; at a 2,000-product catalogue refreshed daily this is in the $50–$150/month range. Store only what we need: ASIN, title, brand, model, price, availability, rating, dimensions, weight, image URLs.
2. **Images and copy:** manufacturer press images where allowed, or our own photos of delivered units, plus our own short descriptions. Do not republish Amazon's product copy or customer reviews.
3. **Buying:** a Cedarce Amazon business account, orders shipped to a US forwarder (or Amazon Global Shipping to Nigeria where the item is eligible). Keep order receipts attached to the Order record.
4. **Branding:** the site says "Sourced from trusted US retailers". Do not use the Amazon logo or claim affiliation.

## Nigeria / Ghana import notes to verify with the clearing agent

- Nigeria duties on the customs valuation (not purchase price): 35 % import duty, 5 % ECOWAS levy, 7 % port levy, VAT (7.5 %). AuctionExport's guide still shows 5 % VAT; confirm the current rate.
- Nigeria has age-based restrictions on used vehicle imports and periodically changes them. Expose a `maxVehicleAgeYears` setting per destination in admin so the filter rules can exclude ineligible cars automatically.
- Ghana: Tema port, duty on CIF value, penalties for over-age vehicles. Same setting applies.
- Phones/laptops: generally personal-use imports with low duty but subject to VAT and courier handling fees; confirm with the forwarder.
- Nigeria Data Protection Regulation (NDPR): we store names and phone numbers of leads; keep a privacy page, a retention policy and a way to delete on request.

## Operating entity and money

- Operate under a registered company (CAC in Nigeria), with a business bank account that can receive naira and send USD wires.
- Written customer terms sent and acknowledged on WhatsApp before payment: no cancellation after Buy Now, duty is an estimate, delivery windows are estimates, deposits non-refundable once the car is bought.
- Keep customer money and operating money separate; every incoming payment is matched to an Order in admin the same day.
