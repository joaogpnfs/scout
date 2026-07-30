"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import {
  classify,
  extract,
  prepareImage,
  transcribe,
  ExtractedFieldsSchema,
  FieldSchemaSchema,
  type FieldSchema,
} from "@scout/core";
import { db } from "@/lib/db";

export interface ProcessCaptureResult {
  imageUrl: string;
  ocrText: string;
  collectionId: string;
  collectionName: string;
  confidence: number;
  reasoning: string;
  fieldSchema: FieldSchema;
  fields: Record<string, unknown>;
  uncertainFieldKeys: string[];
}

export async function processCapture(formData: FormData): Promise<ProcessCaptureResult> {
  const file = formData.get("image");
  if (!(file instanceof File)) {
    throw new Error("No image provided");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = await prepareImage(buffer);

  const collections = await db.collection.findMany({
    select: { id: true, name: true, instruction: true, fieldSchema: true },
  });
  if (collections.length === 0) {
    throw new Error("No Collections exist yet — create one first.");
  }

  const ocrText = await transcribe(image);
  const classification = await classify(
    ocrText,
    collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      instruction: collection.instruction,
    })),
  );

  const collection = collections.find((candidate) => candidate.id === classification.collectionId);
  if (!collection) {
    throw new Error(`classify returned unknown collectionId: ${classification.collectionId}`);
  }

  const fieldSchema = FieldSchemaSchema.parse(collection.fieldSchema);

  const recentCorrections = await db.correction.findMany({
    where: { capture: { collectionId: collection.id } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const extraction = await extract(
    image,
    { name: collection.name, instruction: collection.instruction, fieldSchema },
    recentCorrections,
  );

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const filename = `${randomUUID()}.jpg`;
  await writeFile(path.join(uploadsDir, filename), Buffer.from(image.base64, "base64"));

  return {
    imageUrl: `/uploads/${filename}`,
    ocrText,
    collectionId: collection.id,
    collectionName: collection.name,
    confidence: classification.confidence,
    reasoning: classification.reasoning,
    fieldSchema,
    fields: extraction.fields,
    uncertainFieldKeys: extraction.uncertainFieldKeys,
  };
}

export interface SaveCaptureInput {
  collectionId: string;
  imageUrl: string;
  ocrText: string;
  confidence: number;
  originalFields: Record<string, unknown>;
  editedFields: Record<string, unknown>;
}

function stringifyFieldValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  return String(value);
}

export async function saveCapture(input: SaveCaptureInput): Promise<{ captureId: string }> {
  const extracted = ExtractedFieldsSchema.parse(input.editedFields);

  const capture = await db.capture.create({
    data: {
      collectionId: input.collectionId,
      imageUrl: input.imageUrl,
      ocrText: input.ocrText,
      extracted,
      confidence: input.confidence,
      status: "done",
    },
  });

  const correctionRows = Object.entries(input.editedFields)
    .filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(input.originalFields[key]))
    .map(([key, value]) => ({
      captureId: capture.id,
      fieldKey: key,
      aiValue: stringifyFieldValue(input.originalFields[key]),
      userValue: stringifyFieldValue(value),
    }));

  if (correctionRows.length > 0) {
    await db.correction.createMany({ data: correctionRows });
  }

  revalidatePath("/capture");

  return { captureId: capture.id };
}
