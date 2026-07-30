import sharp from "sharp";

export type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export interface EncodedImage {
  mediaType: ImageMediaType;
  base64: string;
}

const MAX_WIDTH = 1024;

export async function prepareImage(input: Buffer): Promise<EncodedImage> {
  const resized = await sharp(input)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  return { mediaType: "image/jpeg", base64: resized.toString("base64") };
}
