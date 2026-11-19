import { describe, expect, it } from "vitest";
import {
  agencyFee,
  carDisplayPrice,
  carLandedQuote,
  DEFAULT_CAR_PRICING,
  gadgetLandedQuote,
  toLocal,
} from "./pricing";

describe("agencyFee", () => {
  it("uses tiers", () => {
    expect(agencyFee(4000, DEFAULT_CAR_PRICING.agencyTiers)).toBe(350);
    expect(agencyFee(5000, DEFAULT_CAR_PRICING.agencyTiers)).toBe(350);
    expect(agencyFee(9000, DEFAULT_CAR_PRICING.agencyTiers)).toBe(500);
    expect(agencyFee(20000, DEFAULT_CAR_PRICING.agencyTiers)).toBe(800);
  });
});

describe("carDisplayPrice", () => {
  it("adds auction, service, docs and agency fees", () => {
    // 2500 + min(250, 800)=250 + 195 + 95 + 350
    expect(carDisplayPrice(2500, null)).toBe(3390);
    // 8000 + 600 (given) + 295 + 95 + 500
    expect(carDisplayPrice(8000, 600)).toBe(9490);
  });
});

describe("carLandedQuote", () => {
  it("sums all lines and reports margin", () => {
    const q = carLandedQuote({
      buyNowUsd: 8000,
      estAuctionFeeUsd: 600,
      bodyStyle: "SUV",
      destination: "NG",
    });
    const sum = q.lines.reduce((s, l) => s + l.amountUsd, 0);
    expect(q.totalUsd).toBeCloseTo(sum, 2);
    expect(q.marginUsd).toBeCloseTo(500 + 1450 * 0.06, 2);
    expect(q.lines.find((l) => l.key === "duty")?.estimate).toBe(true);
  });
});

describe("gadgetLandedQuote", () => {
  it("applies category margin on landed cost", () => {
    const q = gadgetLandedQuote({
      retailUsd: 1000,
      weightKg: 0.5,
      category: "PHONE",
      destination: "NG",
    });
    // tax 80, forwarding max(6,18)=18, cif 1098, duty 219.6, landed 1317.6, margin 15% = 197.64
    expect(q.marginUsd).toBeCloseTo(197.64, 2);
    expect(q.totalUsd).toBeCloseTo(1515.24, 2);
  });
});

describe("toLocal", () => {
  it("rounds up to whole units", () => {
    expect(toLocal(10.01, 1500.5)).toBe(15021);
  });
});
