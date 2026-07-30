import { z } from "zod";
import { FieldSchemaSchema, type FieldSchema } from "../types";
import { getAnthropicClient, logUsage } from "./client";

const GenerateSchemaResultSchema = z.object({ fields: FieldSchemaSchema });

const GENERATE_SCHEMA_MODEL = "claude-sonnet-5";
const GENERATE_SCHEMA_TOOL_NAME = "propose_field_schema";

const FIELD_TYPE_ENUM = ["text", "number", "currency", "date", "url", "list"];

export async function generateSchema(instruction: string): Promise<FieldSchema> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: GENERATE_SCHEMA_MODEL,
    max_tokens: 1024,
    tools: [
      {
        name: GENERATE_SCHEMA_TOOL_NAME,
        description:
          "Propose a field schema — the structured data to extract from every capture — for a new Collection, based on the user's natural-language instruction.",
        input_schema: {
          type: "object",
          properties: {
            fields: {
              type: "array",
              description: "The proposed fields to extract for this Collection. Keep it focused.",
              minItems: 1,
              items: {
                type: "object",
                properties: {
                  key: { type: "string", description: 'camelCase machine key, e.g. "vendor"' },
                  label: { type: "string", description: 'Human-readable label, e.g. "Vendor"' },
                  type: { type: "string", enum: FIELD_TYPE_ENUM },
                  description: {
                    type: "string",
                    description: "What this field captures and how to recognize it in a screenshot.",
                  },
                },
                required: ["key", "label", "type", "description"],
              },
            },
          },
          required: ["fields"],
        },
        strict: true,
      },
    ],
    tool_choice: { type: "tool", name: GENERATE_SCHEMA_TOOL_NAME },
    messages: [
      {
        role: "user",
        content: `A user is creating a Collection with this instruction:\n\n"${instruction}"\n\nPropose the fields that should be extracted from each capture in this Collection. Only include fields the instruction actually implies.`,
      },
    ],
  });

  logUsage({
    call: "generateSchema",
    model: GENERATE_SCHEMA_MODEL,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("generateSchema: model did not return a tool_use block");
  }

  return GenerateSchemaResultSchema.parse(toolUse.input).fields;
}
