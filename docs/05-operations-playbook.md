# Operations Playbook

Written for the sales/ops agent. Everything here has an admin screen or a WhatsApp template behind it.

## Daily routine

1. Open admin dashboard: check "last successful sync" for each source is green. If red, ping the engineer.
2. Work the Leads board: every NEW lead gets a first reply within 15 minutes during working hours.
3. Update every open Order with any new status, and send the customer the templated update.
4. Reconcile payments: match every bank credit to an Order; mark `PAID`.
5. End of day: post one "delivered" or "just landed" story on social with a listing link.

## Car order runbook

| Stage      | Who            | What happens                                                                                                                                                          | Admin action                                                             |
| ---------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| NEW lead   | Customer       | Clicks WhatsApp on a listing; message carries the listing ref                                                                                                         | Lead auto-created from the form, or created manually from the chat       |
| CONTACTED  | Agent          | Confirms destination, asks about budget, explains salvage vs clean, offers inspection                                                                                 | Lead → CONTACTED                                                         |
| QUOTED     | Agent          | Generates quote from the estimator (vehicle + auction fee + AE fees + shipping + agency fee + duty estimate), sends PDF, quote valid 24 h                             | Lead → QUOTED; Order created in `QUOTE`                                  |
| PAID       | Customer       | Pays full naira amount by bank transfer                                                                                                                               | Order → PAID with receipt attached; nothing is bought before this        |
| PURCHASED  | Agent          | Funds AuctionExport account if needed, clicks Buy Now, forwards confirmation email; wires the balance within 3 business days (late fees start day 4, storage $50/day) | Order → PURCHASED with auction invoice no.                               |
| IN_TRANSIT | AuctionExport  | Inland pickup, title received, ocean booking (RoRo if it drives, container otherwise)                                                                                 | Order → IN_TRANSIT with vessel + ETA; send BoL to customer when received |
| AT_PORT    | Clearing agent | Vessel arrives; customs valuation issued; agent sends final duty figure                                                                                               | Order → AT_PORT; invoice customer the duty balance                       |
| CLEARED    | Clearing agent | Duties paid, vehicle released, condition report collected                                                                                                             | Order → CLEARED                                                          |
| DELIVERED  | Agent          | Customer collects or we deliver; photos; review request; referral code                                                                                                | Order → DELIVERED                                                        |
| CANCELLED  |                | Only before PURCHASED; refund minus bank fees                                                                                                                         | Order → CANCELLED with reason                                            |

Hard rules: never click Buy Now before funds have cleared; never promise a delivery date, only a window; always disclose title type and damage codes in the quote.

## Gadget order runbook

| Stage      | What happens                                                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QUOTE      | Agent confirms exact model/colour/storage, checks live price and availability, sends quote (price + tax + forwarding + duty estimate + margin) valid 24 h |
| PAID       | Customer pays; receipt attached                                                                                                                           |
| PURCHASED  | Agent buys on Amazon to the forwarder's US address (or Amazon Global Shipping); order no. recorded                                                        |
| IN_TRANSIT | Forwarder confirms receipt and air-freight AWB                                                                                                            |
| AT_PORT    | Arrived Lagos; duty paid                                                                                                                                  |
| DELIVERED  | Local courier delivers; unboxing photo; review request                                                                                                    |

## WhatsApp templates (first versions)

- **First reply:** "Hi {name}, thanks for reaching out about the {title} (ref {ref}). To get you an exact landed price, which city will you be collecting in, and would you like an independent inspection before purchase? I'll send you a full quote within the hour."
- **Quote:** "Here is your quote for {title}: vehicle ${price}, auction fee ${fee}, AuctionExport fees ${ae}, shipping ${ship}, Cedarce service ${agency}, estimated duty ${duty} (final figure comes from customs). Total today ₦{total_ngn}. Valid 24 h. Bank details: {bank}. We only buy after your payment clears."
- **Purchased:** "Great news, we have bought your {title}. Auction invoice {inv}. Next: pickup and shipping booking, usually 7–14 days. I'll update you at each step."
- **Shipped:** "Your {title} is on {vessel}, sailing {date}, ETA {port} {eta}. Bill of Lading attached."
- **Delivered:** "Delivered! Thank you for buying with Cedarce. Your referral code {code} gives friends $50 off and earns you the same."

## Escalations

- Source site shows a car sold after customer paid → refund within 24 h or offer alternatives; never hold funds silently.
- Customs valuation far above estimate → agent explains the valuation document; Cedarce absorbs nothing but waives its margin on the shipping line as goodwill if the gap exceeds 25 %.
- Damage worse than photos → share the auction's condition codes and the port condition report; offer the inspection next time; log a `Listing` note for the model.
