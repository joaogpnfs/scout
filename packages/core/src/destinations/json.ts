import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { Destination, DestinationWriteResult } from "./types";

export const JsonDestinationConfigSchema = z.object({
  folderPath: z.string().min(1),
});
export type JsonDestinationConfig = z.infer<typeof JsonDestinationConfigSchema>;

export const jsonDestination: Destination = {
  async write(collection, capture, rawConfig): Promise<DestinationWriteResult> {
    const config = JsonDestinationConfigSchema.parse(rawConfig);

    const payload = {
      collection: collection.name,
      confidence: capture.confidence,
      createdAt: capture.createdAt.toISOString(),
      imageUrl: capture.imageUrl,
      fields: capture.extracted,
    };

    const fullDir = path.resolve(config.folderPath);
    await mkdir(fullDir, { recursive: true });
    const filename = `${capture.createdAt.toISOString().slice(0, 10)}-${Date.now()}.json`;
    const fullPath = path.join(fullDir, filename);
    await writeFile(fullPath, JSON.stringify(payload, null, 2), "utf-8");

    return { location: fullPath };
  },
};
