import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { prisma } from "@cedarce/db";
import type { JobDeps } from "./context";

/**
 * Mirror source images into our own bucket (never hotlink). Produces a 1200px WebP; the CDN can resize further.
 * Skips silently when storage is not configured (local dev shows source URLs).
 */
export async function mirrorImages(listingId: string, deps: JobDeps) {
  const endpoint = process.env["S3_ENDPOINT"];
  const bucket = process.env["S3_BUCKET"];
  const cdn = process.env["CDN_BASE_URL"];
  if (!endpoint || !bucket || !cdn) return { skipped: true };

  const s3 = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env["S3_ACCESS_KEY_ID"] ?? "",
      secretAccessKey: process.env["S3_SECRET_ACCESS_KEY"] ?? "",
    },
  });
  const images = await prisma.image.findMany({ where: { listingId, cdnUrl: null } });
  let done = 0;
  for (const img of images) {
    try {
      const res = await fetch(img.sourceUrl);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const out = await sharp(buf)
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      const key = `listings/${listingId}/${img.id}.webp`;
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: out.data,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      await prisma.image.update({
        where: { id: img.id },
        data: { cdnUrl: `${cdn}/${key}`, width: out.info.width, height: out.info.height },
      });
      done++;
    } catch (err) {
      deps.log.warn({ err, imageId: img.id }, "mirror failed");
    }
  }
  return { mirrored: done };
}
