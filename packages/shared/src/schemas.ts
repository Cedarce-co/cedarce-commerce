import { z } from "zod";
import { DESTINATIONS, VERTICALS } from "./constants";

export const verticalSchema = z.enum(VERTICALS);
export const destinationSchema = z.enum(DESTINATIONS);

/** Query string accepted by GET /v1/:vertical/listings */
export const listingQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  make: z.string().optional(), // comma-separated allowed
  model: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  bodyStyle: z.string().optional(),
  titleType: z.string().optional(),
  yearMin: z.coerce.number().int().min(1900).max(2100).optional(),
  yearMax: z.coerce.number().int().min(1900).max(2100).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  featured: z.coerce.boolean().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "year_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});
export type ListingQuery = z.infer<typeof listingQuerySchema>;

/** Body accepted by POST /v1/leads */
export const createLeadSchema = z.object({
  vertical: verticalSchema,
  listingId: z.string().optional(),
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{8,15}$/, "Enter a WhatsApp number with country code, e.g. +2348012345678"),
  email: z.string().email().optional().or(z.literal("")),
  country: destinationSchema.optional(),
  city: z.string().trim().max(80).optional(),
  message: z.string().trim().max(1000).optional(),
  utmSource: z.string().max(80).optional(),
  utmCampaign: z.string().max(80).optional(),
});
export type CreateLead = z.infer<typeof createLeadSchema>;

/** Admin filter rule criteria. Keys are optional; omitted keys do not constrain. */
export const carFilterCriteriaSchema = z.object({
  make: z.array(z.string()).optional(),
  model: z.array(z.string()).optional(),
  yearMin: z.number().int().optional(),
  yearMax: z.number().int().optional(),
  priceMinUsd: z.number().optional(),
  priceMaxUsd: z.number().optional(),
  bodyStyle: z.array(z.string()).optional(),
  fuel: z.array(z.string()).optional(),
  transmission: z.array(z.string()).optional(),
  drive: z.array(z.string()).optional(),
  titleType: z.array(z.enum(["CLEAN", "SALVAGE", "REBUILT", "OTHER"])).optional(),
  excludeDamage: z.array(z.string()).optional(),
  runAndDrive: z.boolean().optional(),
  odometerMax: z.number().int().optional(),
  locationState: z.array(z.string()).optional(),
  auctionHouse: z.array(z.string()).optional(),
  saleType: z.literal("BUY_NOW").default("BUY_NOW"),
});
export type CarFilterCriteria = z.infer<typeof carFilterCriteriaSchema>;

export const gadgetFilterCriteriaSchema = z.object({
  category: z.array(z.enum(["PHONE", "LAPTOP", "TABLET", "ACCESSORY"])).optional(),
  brand: z.array(z.string()).optional(),
  model: z.array(z.string()).optional(),
  priceMinUsd: z.number().optional(),
  priceMaxUsd: z.number().optional(),
  condition: z.array(z.enum(["NEW", "RENEWED", "USED"])).optional(),
  ratingMin: z.number().min(0).max(5).optional(),
  reviewCountMin: z.number().int().optional(),
  inStockOnly: z.boolean().default(true),
});
export type GadgetFilterCriteria = z.infer<typeof gadgetFilterCriteriaSchema>;

export const filterRuleSchema = z.object({
  vertical: verticalSchema,
  name: z.string().min(2).max(120),
  kind: z.enum(["INCLUDE", "EXCLUDE"]),
  criteria: z.union([carFilterCriteriaSchema, gadgetFilterCriteriaSchema]),
  priority: z.number().int().default(0),
  enabled: z.boolean().default(true),
});
export type FilterRuleInput = z.infer<typeof filterRuleSchema>;
