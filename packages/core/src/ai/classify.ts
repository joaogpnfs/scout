import { z } from "zod";
import { getAnthropicClient, logUsage } from "./client";

export interface ClassifyCollectionInput {
  id: string;
  name: string;
  instruction: string;
}

const ClassifyResultSchema = z.object({
  collectionId: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});
export type ClassifyResult = z.infer<typeof ClassifyResultSchema>;

const CLASSIFY_MODEL = "claude-haiku-4-5";
const CLASSIFY_TOOL_NAME = "classify_capture";

export async function classify(
  ocrText: string,
  collections: ClassifyCollectionInput[],
): Promise<ClassifyResult> {
  if (collections.length === 0) {
    throw new Error("classify requires at least one collection");
  }

  const client = getAnthropicClient();
  const collectionIds = collections.map((collection) => collection.id);
  const collectionsBlock = collections
    .map((collection) => `- id: ${collection.id}\n  name: ${collection.name}\n  instruction: ${collection.instruction}`)
    .join("\n");

  const response = await client.messages.create({
    model: CLASSIFY_MODEL,
    max_tokens: 512,
    tools: [
      {
        name: CLASSIFY_TOOL_NAME,
        description:
          "Classify a screenshot's OCR text into exactly one of the user's Collections, based on each Collection's natural-language instruction.",
        input_schema: {
          type: "object",
          properties: {
            collectionId: {
              type: "string",
              enum: collectionIds,
              description: "The id of the Collection that best matches this capture.",
            },
            confidence: {
              type: "number",
              description: "How confident you are in this classification, as a number from 0 to 1.",
            },
            reasoning: {
              type: "string",
              description: "One or two sentences explaining why this Collection was chosen.",
            },
          },
          required: ["collectionId", "confidence", "reasoning"],
          additionalProperties: false,
        },
        strict: true,
      },
    ],
    tool_choice: { type: "tool", name: CLASSIFY_TOOL_NAME },
    messages: [
      {
        role: "user",
        content: `Here is the OCR text extracted from a screenshot:\n\n${ocrText}\n\nHere are the user's Collections:\n\n${collectionsBlock}\n\nWhich Collection does this capture belong to?`,
      },
    ],
  });

  logUsage({
    call: "classify",
    model: CLASSIFY_MODEL,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("classify: model did not return a tool_use block");
  }

  return ClassifyResultSchema.parse(toolUse.input);
}
