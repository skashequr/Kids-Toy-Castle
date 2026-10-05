import { createHash } from "crypto";
import sharp from "sharp";
import { requireAdmin } from "@/server/guard";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const BANNER_WIDTH = 2014;
const BANNER_HEIGHT = 781;
const BANNER_RATIO_TOLERANCE = 0.005;
const CATEGORY_WIDTH = 1200;
const CATEGORY_HEIGHT = 900;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "An image file is required." }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return Response.json({ error: "Use a JPG, PNG, WebP, GIF, or AVIF image." }, { status: 400 });
    }

    if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
      return Response.json({ error: "Images must be no larger than 10 MB." }, { status: 400 });
    }

    const purpose = formData.get("purpose");
    if (purpose === "banner") {
      const metadata = await sharp(Buffer.from(await file.arrayBuffer())).metadata();
      if (!metadata.width || !metadata.height) {
        return Response.json({ error: "The image dimensions could not be read." }, { status: 400 });
      }

      const expectedRatio = BANNER_WIDTH / BANNER_HEIGHT;
      const actualRatio = metadata.width / metadata.height;
      const ratioDifference = Math.abs(actualRatio - expectedRatio) / expectedRatio;
      if (ratioDifference > BANNER_RATIO_TOLERANCE) {
        return Response.json(
          {
            error: `Banner images must use the ${BANNER_WIDTH}:${BANNER_HEIGHT} ratio. This image is ${metadata.width}:${metadata.height}.`,
          },
          { status: 400 },
        );
      }
    }

    if (purpose === "category") {
      const metadata = await sharp(Buffer.from(await file.arrayBuffer())).metadata();
      if (metadata.width !== CATEGORY_WIDTH || metadata.height !== CATEGORY_HEIGHT) {
        return Response.json(
          {
            error: `Category images must be exactly ${CATEGORY_WIDTH}×${CATEGORY_HEIGHT}px. This image is ${metadata.width ?? "unknown"}×${metadata.height ?? "unknown"}px.`,
          },
          { status: 400 },
        );
      }
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Cloudinary upload is not configured.");
      return Response.json({ error: "Image storage is not configured." }, { status: 503 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = purpose === "banner"
      ? "luxen/banners"
      : purpose === "category"
        ? "luxen/categories"
        : "luxen/products";
    const signature = createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const cloudinaryData = new FormData();
    cloudinaryData.set("file", file, file.name);
    cloudinaryData.set("api_key", apiKey);
    cloudinaryData.set("timestamp", String(timestamp));
    cloudinaryData.set("folder", folder);
    cloudinaryData.set("signature", signature);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: cloudinaryData },
    );
    const result = await cloudinaryResponse.json() as { secure_url?: string; error?: { message?: string } };

    if (!cloudinaryResponse.ok || !result.secure_url) {
      console.error("Cloudinary upload failed:", result.error?.message ?? cloudinaryResponse.status);
      return Response.json({ error: "Image upload failed. Please try again." }, { status: 502 });
    }

    return Response.json({ url: result.secure_url });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Image upload error:", error);
    return Response.json({ error: "Image upload failed. Please try again." }, { status: 500 });
  }
}
