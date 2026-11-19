import { describe, expect, it } from "vitest";
import { mapVehicle } from "./adapters/auction-api";
import { mapProduct } from "./adapters/product-api";

describe("mapVehicle", () => {
  const base = { id: "1", make: "Toyota", model: "Camry", year: 2018, title_type: "Clean Title" };
  it("drops lots without a Buy Now price", () => {
    expect(mapVehicle({ ...base, buy_now_price: null })).toBeNull();
    expect(mapVehicle({ ...base, buy_now_price: 0 })).toBeNull();
  });
  it("drops sold lots", () => {
    expect(mapVehicle({ ...base, buy_now_price: 5000, sale_status: "Sold" })).toBeNull();
  });
  it("maps title type and builds a title", () => {
    const v = mapVehicle({ ...base, buy_now_price: 5000, trim: "SE" });
    expect(v?.title).toBe("2018 Toyota Camry SE");
    expect(v?.titleType).toBe("CLEAN");
  });
});

describe("mapProduct", () => {
  it("drops items without USD price", () => {
    expect(mapProduct({ asin: "A", title: "Apple iPhone 15", price: null }, "PHONE")).toBeNull();
  });
  it("parses weight and condition", () => {
    const p = mapProduct(
      {
        asin: "A",
        title: "Apple iPhone 15 (Renewed)",
        brand: "Apple",
        price: { value: 599, currency: "USD" },
        weight: "6.1 ounces",
      },
      "PHONE",
    );
    expect(p?.condition).toBe("RENEWED");
    expect(p?.weightKg).toBeCloseTo(0.173, 2);
  });
});
