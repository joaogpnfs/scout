import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { Destination, DestinationWriteResult } from "./types";

export const MarkdownDestinationConfigSchema = z.object({
  folderPath: z.string().min(1),
});
export type MarkdownDestinationConfig = z.infer<typeof MarkdownDestinationConfigSchema>;

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "capture"
  );
}

function toYamlValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => JSON.stringify(item)).join(", ")}]`;
  }
  return JSON.stringify(value ?? null);
}

export const markdownDestination: Destination = {
  async write(collection, capture, rawConfig): Promise<DestinationWriteResult> {
    const config = MarkdownDestinationConfigSchema.parse(rawConfig);

    const frontmatter = [
      "---",
      `collection: ${JSON.stringify(collection.name)}`,
      `confidence: ${capture.confidence}`,
      `createdAt: ${capture.createdAt.toISOString()}`,
      ...collection.fieldSchema.map((field) => `${field.key}: ${toYamlValue(capture.extracted[field.key])}`),
      "---",
      "",
    ].join("\n");

    const body = collection.fieldSchema
      .map((field) => {
        const value = capture.extracted[field.key];
        const rendered = Array.isArray(value) ? value.map((item) => `- ${item}`).join("\n") : String(value ?? "");
        return `## ${field.label}\n\n${rendered}\n`;
      })
      .join("\n");

    const fullDir = path.resolve(config.folderPath);
    await mkdir(fullDir, { recursive: true });
    const filename = `${capture.createdAt.toISOString().slice(0, 10)}-${slugify(collection.name)}-${Date.now()}.md`;
    const fullPath = path.join(fullDir, filename);
    await writeFile(fullPath, `${frontmatter}\n${body}`, "utf-8");

    return { location: fullPath };
  },
};
