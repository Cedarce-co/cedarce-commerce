# Admin Filters and Pricing Rules

## Filter rules (which cars/gadgets appear on the site)

Admins do not pick cars one by one; they write rules and the sync workers do the rest. A listing is shown when it matches **at least one INCLUDE rule and no EXCLUDE rule**, and only if it is Buy Now and `ACTIVE`.

Filter dimensions mirror the facets available on AuctionExport and the auction feeds:

| Dimension                   | Cars                                                                            | Gadgets                             |
| --------------------------- | ------------------------------------------------------------------------------- | ----------------------------------- |
| Make / brand                | Toyota, Lexus, Honda, Mercedes… (including Chinese makes if desired)            | Apple, Samsung, Dell, Lenovo, HP…   |
| Model                       | Camry, RAV4…                                                                    | iPhone 15, Galaxy S24, MacBook Air… |
| Year / release year         | min–max                                                                         | min                                 |
| Price (USD)                 | min–max                                                                         | min–max                             |
| Category                    | Clean, Salvage, Repo, Electric, Chinese cars, Live auction (excluded by design) | Phone, Laptop, Tablet, Accessory    |
| Body style                  | Sedan, SUV, Pickup, Van…                                                        | —                                   |
| Fuel / transmission / drive | Petrol, Hybrid, EV; Auto/Manual; FWD/AWD                                        | —                                   |
| Title type                  | Clean, Salvage, Rebuilt                                                         | Condition: New, Renewed             |
| Damage                      | Primary damage codes (exclude e.g. Flood, Burn)                                 | —                                   |
| Run & drive                 | yes/no                                                                          | —                                   |
| Odometer                    | max                                                                             | —                                   |
| Location                    | US state / Canada                                                               | Marketplace (US)                    |
| Rating                      | —                                                                               | min stars, min reviews              |

Rule JSON example (cars):

```json
{
  "name": "Core Toyota/Lexus/Honda 2012+ under $15k",
  "kind": "INCLUDE",
  "criteria": {
    "make": ["Toyota", "Lexus", "Honda"],
    "yearMin": 2012,
    "priceMaxUsd": 15000,
    "titleType": ["clean", "salvage"],
    "saleType": "BUY_NOW",
    "excludeDamage": ["Flood", "Burn", "Biohazard"]
  },
  "priority": 10
}
```

Each rule is also what the discover worker turns into source queries, so a tighter rule set means fewer API calls.

## Pricing rules (what price the customer sees)

`displayPrice = sourcePrice + passThroughFees + cedarceFee`, computed per listing at sync time and recomputed when rules or FX change. The estimator on the listing page adds shipping and duty for the chosen destination.

Cars fee lines (defaults, editable):

| Line                             | Default                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| Auction buyer fee                | from source estimate, else 10 % capped at $800                                                   |
| AuctionExport service fee        | $195 if price ≤ $2,999.99 else $295                                                              |
| Documentation                    | $95                                                                                              |
| Cedarce agency fee               | $350 (< $5k) / $500 ($5k–$15k) / 4 % (> $15k)                                                    |
| Shipping to NG (RoRo)            | per-body-style table, e.g. sedan $1,250, SUV $1,450, pickup $1,600                               |
| Shipping to NG (container share) | per-body-style table                                                                             |
| Duty estimate NG                 | (35 % + 5 % + 7 %) × customs value + 7.5 % VAT, customs value ≈ 85 % of purchase price (tunable) |

Gadgets fee lines:

| Line                   | Default                                                   |
| ---------------------- | --------------------------------------------------------- |
| US sales tax           | 8 %                                                       |
| Forwarding (air)       | $12/kg, min $18, on dimensional weight                    |
| Duty + VAT estimate NG | 20 % of CIF (tunable)                                     |
| Cedarce margin         | per category: phones 15 %, laptops 12 %, accessories 30 % |

The customer always sees the breakdown, with the duty line marked as an estimate.
