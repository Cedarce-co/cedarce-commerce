import argon2 from "argon2";
import { prisma } from "./index";

/** Idempotent seed: sources, default rules, settings, one admin, plus sample listings via the CSV adapter files. */
async function main() {
  await prisma.source.upsert({
    where: { key: "csv" },
    update: {},
    create: {
      key: "csv",
      name: "Curated file (dev/launch)",
      vertical: "CARS",
      config: { path: "packages/db/seed/cars.sample.json" },
    },
  });
  await prisma.source.upsert({
    where: { key: "csv-gadgets" },
    update: {},
    create: {
      key: "csv-gadgets",
      name: "Curated file (dev/launch)",
      vertical: "GADGETS",
      config: { path: "packages/db/seed/gadgets.sample.json" },
    },
  });
  await prisma.source.upsert({
    where: { key: "auction-api" },
    update: {},
    create: {
      key: "auction-api",
      name: "Licensed auction data API",
      vertical: "CARS",
      enabled: false,
    },
  });
  await prisma.source.upsert({
    where: { key: "auctionexport" },
    update: {},
    create: {
      key: "auctionexport",
      name: "AuctionExport partner feed",
      vertical: "CARS",
      enabled: false,
    },
  });
  await prisma.source.upsert({
    where: { key: "amazon-product-api" },
    update: {},
    create: {
      key: "amazon-product-api",
      name: "Product data API (Amazon US)",
      vertical: "GADGETS",
      enabled: false,
      config: { defaultCategory: "PHONE" },
    },
  });

  if ((await prisma.filterRule.count()) === 0) {
    await prisma.filterRule.createMany({
      data: [
        {
          vertical: "CARS",
          name: "Core Japanese & Korean 2012+ under $20k",
          kind: "INCLUDE",
          priority: 10,
          criteria: {
            make: ["Toyota", "Lexus", "Honda", "Acura", "Nissan", "Hyundai", "Kia", "Mazda"],
            yearMin: 2012,
            priceMaxUsd: 20000,
            titleType: ["CLEAN", "SALVAGE"],
            saleType: "BUY_NOW",
          },
        },
        {
          vertical: "CARS",
          name: "German premium 2014+ under $30k",
          kind: "INCLUDE",
          priority: 5,
          criteria: {
            make: ["Mercedes-Benz", "BMW", "Audi"],
            yearMin: 2014,
            priceMaxUsd: 30000,
            saleType: "BUY_NOW",
          },
        },
        {
          vertical: "CARS",
          name: "No flood / burn / biohazard",
          kind: "EXCLUDE",
          priority: 100,
          criteria: {
            excludeDamage: [
              "Flood",
              "Water/Flood",
              "Burn",
              "Burn - Engine",
              "Burn - Interior",
              "Biohazard/Chemical",
            ],
            saleType: "BUY_NOW",
          },
        },
        {
          vertical: "GADGETS",
          name: "Flagship phones",
          kind: "INCLUDE",
          priority: 10,
          criteria: {
            category: ["PHONE"],
            brand: ["Apple", "Samsung", "Google"],
            priceMinUsd: 250,
            ratingMin: 4,
            reviewCountMin: 100,
            inStockOnly: true,
          },
        },
        {
          vertical: "GADGETS",
          name: "Laptops $400–$2,500",
          kind: "INCLUDE",
          priority: 10,
          criteria: {
            category: ["LAPTOP"],
            brand: ["Apple", "Dell", "Lenovo", "HP", "ASUS"],
            priceMinUsd: 400,
            priceMaxUsd: 2500,
            ratingMin: 4,
            inStockOnly: true,
          },
        },
      ],
    });
  }

  const settings: Record<string, unknown> = {
    "whatsapp.number": process.env["NEXT_PUBLIC_WHATSAPP_NUMBER"] ?? "2348000000000",
    "destination.NG.maxVehicleAgeYears": 15,
    "destination.GH.maxVehicleAgeYears": 10,
    "quote.validityHours": 24,
  };
  for (const [key, value] of Object.entries(settings))
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as never },
    });

  const email = process.env["SEED_ADMIN_EMAIL"] ?? "admin@cedarce.com";
  const password = process.env["SEED_ADMIN_PASSWORD"] ?? "change-me-now";
  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Cedarce Owner",
      role: "OWNER",
      passwordHash: await argon2.hash(password),
    },
  });

  await prisma.fxRate.create({ data: { quote: "NGN", rate: 1550 } });
  await prisma.fxRate.create({ data: { quote: "GHS", rate: 15.5 } });

  console.log(`Seeded. Admin login: ${email} / ${password} (change it).`);
}

main().finally(() => prisma.$disconnect());
