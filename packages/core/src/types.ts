import { z } from "zod";

/**
 * Recursive JSON value schema. Prisma's `Json` columns are untyped `JsonValue`
 * at the DB boundary — every read/write in this codebase must go through a
 * schema below rather than touching that raw value directly.
 */
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

export const FieldTypeSchema = z.enum(["text", "number", "currency", "date", "url", "list"]);
export type FieldType = z.infer<typeof FieldTypeSchema>;

export const FieldSchemaEntrySchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: FieldTypeSchema,
  description: z.string(),
});
export type FieldSchemaEntry = z.infer<typeof FieldSchemaEntrySchema>;

export const FieldSchemaSchema = z.array(FieldSchemaEntrySchema);
export type FieldSchema = z.infer<typeof FieldSchemaSchema>;

export const DestinationTypeSchema = z.enum(["markdown", "json", "obsidian", "notion", "linear"]);
export type DestinationType = z.infer<typeof DestinationTypeSchema>;

export const DestinationConfigSchema = z.record(z.string(), JsonValueSchema);
export type DestinationConfig = z.infer<typeof DestinationConfigSchema>;

export const CollectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  icon: z.string().min(1),
  instruction: z.string().min(1),
  fieldSchema: FieldSchemaSchema,
  destinationType: DestinationTypeSchema,
  destinationConfig: DestinationConfigSchema,
  createdAt: z.date(),
});
export type Collection = z.infer<typeof CollectionSchema>;

export const CaptureStatusSchema = z.enum(["pending", "processing", "done", "failed"]);
export type CaptureStatus = z.infer<typeof CaptureStatusSchema>;

export const ExtractedFieldsSchema = z.record(z.string(), JsonValueSchema);
export type ExtractedFields = z.infer<typeof ExtractedFieldsSchema>;

export const CaptureSchema = z.object({
  id: z.string(),
  collectionId: z.string(),
  imageUrl: z.string(),
  ocrText: z.string(),
  extracted: ExtractedFieldsSchema,
  confidence: z.number().min(0).max(1),
  status: CaptureStatusSchema,
  createdAt: z.date(),
});
export type Capture = z.infer<typeof CaptureSchema>;

/**
 * Reserved fieldKey for Correction rows that record a reclassification (the
 * user picked a different Collection than the one classify() proposed),
 * rather than an edit to one of the Collection's own fields. Console-only —
 * this is the console's own reuse of the Correction table for the accuracy
 * metric, not something the desktop app's queue model needs to know about.
 */
export const COLLECTION_CORRECTION_FIELD_KEY = "__collection__";

export const CorrectionSchema = z.object({
  id: z.string(),
  captureId: z.string(),
  fieldKey: z.string(),
  aiValue: z.string(),
  userValue: z.string(),
  createdAt: z.date(),
});
export type Correction = z.infer<typeof CorrectionSchema>;
