import { verticalSchema, type Vertical } from "@cedarce/shared";

export function parseVertical(param: string): Vertical {
  const map: Record<string, Vertical> = { cars: "CARS", gadgets: "GADGETS" };
  const v = map[param.toLowerCase()];
  if (!v) {
    const err = new Error(`Unknown vertical '${param}'`) as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  return verticalSchema.parse(v);
}
