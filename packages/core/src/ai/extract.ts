import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { ExtractedFieldsSchema, type Correction, type FieldSchema, type FieldType } from "../types";
import { getAnthropicClient, logUsage } from "./client";
import type { EncodedImage } from "./image";

export interface ExtractCollectionInput {
  name: string;
  instruction: string;
  fieldSchema: FieldSchema;
}

const ExtractResultSchema = z.object({
  fields: ExtractedFieldsSchema,
  uncertainFieldKeys: z.array(z.string()),
});
export type ExtractResult = z.infer<typeof ExtractResultSchema>;

const EXTRACT_MODEL = "claude-sonnet-5";
const EXTRACT_TOOL_NAME = "extract_fields";

function fieldTypeToJsonSchema(type: FieldType): Record<string, unknown> {
  switch (type) {
    case "text":
    case "url":
      return { type: "string" };
    case "number":
    case "currency":
      return { type: "number" };
    case "date":
      return { type: "string", description: "ISO 8601 date, YYYY-MM-DD" };
    case "list":
      return { type: "array", items: { type: "string" } };
  }
}

function buildExtractInputSchema(fieldSchema: FieldSchema): Anthropic.Tool.InputSchema {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const field of fieldSchema) {
    properties[field.key] = {
      ...fieldTypeToJsonSchema(field.type),
      description: field.description,
    };
    required.push(field.key);
  }

  return {
    type: "object",
    properties: {
      fields: {
        type: "object",
        properties,
        required,
        additionalProperties: false,
        description: "The extracted field values, one per Collection field.",
      },
      uncertainFieldKeys: {
        type: "array",
        items: { type: "string", enum: fieldSchema.map((field) => field.key) },
        description: "Keys of fields you were not confident about, if any. Empty array if none.",
      },
    },
    required: ["fields", "uncertainFieldKeys"],
    additionalProperties: false,
  };
}

function buildFewShotBlock(corrections: Correction[]): string {
  if (corrections.length === 0) {
    return "";
  }

  const examples = corrections
    .map(
      (correction) =>
        `- field "${correction.fieldKey}": you previously extracted "${correction.aiValue}", but the correct value was "${correction.userValue}"`,
    )
    .join("\n");

  return `\n\nRecent corrections a user made on this Collection — learn from them:\n\n${examples}`;
}

export async function extract(
  image: EncodedImage,
  collection: ExtractCollectionInput,
  recentCorrections: Correction[] = [],
): Promise<ExtractResult> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: EXTRACT_MODEL,
    max_tokens: 1024,
    tools: [
      {
        name: EXTRACT_TOOL_NAME,
        description: `Extract structured fields from a screenshot for the "${collection.name}" Collection.`,
        input_schema: buildExtractInputSchema(collection.fieldSchema),
        strict: true,
      },
    ],
    tool_choice: { type: "tool", name: EXTRACT_TOOL_NAME },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: image.mediaType, data: image.base64 },
          },
          {
            type: "text",
            text: `${collection.instruction}${buildFewShotBlock(recentCorrections)}`,
          },
        ],
      },
    ],
  });

  logUsage({
    call: "extract",
    model: EXTRACT_MODEL,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("extract: model did not return a tool_use block");
  }

  return ExtractResultSchema.parse(toolUse.input);
}
