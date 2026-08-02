"use server";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import {
  classify,
  extract,
  getDestination,
  prepareImage,
  transcribe,
  COLLECTION_CORRECTION_FIELD_KEY,
  ExtractedFieldsSchema,
  FieldSchemaSchema,
  type EncodedImage,
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
  collections: { id: string; name: string }[];
}

async function runExtraction(image: EncodedImage, collectionId: string) {
  const collection = await db.collection.findUnique({ where: { id: collectionId } });
  if (!collection) {
    throw new Error(`Unknown collectionId: ${collectionId}`);
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

  return { collection, fieldSchema, extraction };
}

export async function processCapture(formData: FormData): Promise<ProcessCaptureResult> {
  const file = formData.get("image");
  if (!(file instanceof File)) {
    throw new Error("No image provided");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const image = await prepareImage(buffer);

  const allCollections = await db.collection.findMany({
    select: { id: true, name: true, instruction: true, fieldSchema: true },
  });
  if (allCollections.length === 0) {
    throw new Error("No Collections exist yet — create one first.");
  }

  const ocrText = await transcribe(image);
  const classification = await classify(
    ocrText,
    allCollections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      instruction: collection.instruction,
    })),
  );

  const { collection, fieldSchema, extraction } = await runExtraction(image, classification.collectionId);

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
    collections: allCollections.map((candidate) => ({ id: candidate.id, name: candidate.name })),
  };
}

export interface ReextractInput {
  imageUrl: string;
  collectionId: string;
}

export async function reextract(input: ReextractInput): Promise<ProcessCaptureResult> {
  const fullPath = path.join(process.cwd(), "public", input.imageUrl);
  const buffer = await readFile(fullPath);
  const image: EncodedImage = { mediaType: "image/jpeg", base64: buffer.toString("base64") };

  const { collection, fieldSchema, extraction } = await runExtraction(image, input.collectionId);

  const allCollections = await db.collection.findMany({ select: { id: true, name: true } });

  return {
    imageUrl: input.imageUrl,
    ocrText: "",
    collectionId: collection.id,
    collectionName: collection.name,
    confidence: 1,
    reasoning: "Manually reclassified.",
    fieldSchema,
    fields: extraction.fields,
    uncertainFieldKeys: extraction.uncertainFieldKeys,
    collections: allCollections,
  };
}

export interface SaveCaptureInput {
  collectionId: string;
  originalCollectionId: string;
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

  const collection = await db.collection.findUnique({ where: { id: input.collectionId } });
  if (!collection) {
    throw new Error(`Unknown collectionId: ${input.collectionId}`);
  }

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

  const destination = getDestination(collection.destinationType);
  if (destination) {
    try {
      const result = await destination.write(
        { name: collection.name, fieldSchema: FieldSchemaSchema.parse(collection.fieldSchema) },
        { extracted, confidence: capture.confidence, createdAt: capture.createdAt, imageUrl: capture.imageUrl },
        collection.destinationConfig,
      );
      console.log(`[destination] wrote ${collection.destinationType} capture to ${result.location}`);
    } catch (error) {
      console.warn(`[destination] skipped ${collection.destinationType} write:`, error);
    }
  }

  const correctionRows = Object.entries(input.editedFields)
    .filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(input.originalFields[key]))
    .map(([key, value]) => ({
      captureId: capture.id,
      fieldKey: key,
      aiValue: stringifyFieldValue(input.originalFields[key]),
      userValue: stringifyFieldValue(value),
    }));

  if (input.collectionId !== input.originalCollectionId) {
    correctionRows.push({
      captureId: capture.id,
      fieldKey: COLLECTION_CORRECTION_FIELD_KEY,
      aiValue: input.originalCollectionId,
      userValue: input.collectionId,
    });
  }

  if (correctionRows.length > 0) {
    await db.correction.createMany({ data: correctionRows });
  }

  revalidatePath("/capture");

  return { captureId: capture.id };
}
