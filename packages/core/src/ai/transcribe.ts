import { getAnthropicClient, logUsage } from "./client";
import type { EncodedImage } from "./image";

const TRANSCRIBE_MODEL = "claude-haiku-4-5";

/**
 * Reads the visible text out of a screenshot via a vision call to a fast model.
 * Stand-in for Phase 8's native OCR (Vision framework / Windows.Media.Ocr) — swap
 * this out once that lands. classify() itself stays text-only either way.
 */
export async function transcribe(image: EncodedImage): Promise<string> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: TRANSCRIBE_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: image.mediaType, data: image.base64 } },
          { type: "text", text: "Transcribe all visible text in this screenshot, verbatim. No commentary." },
        ],
      },
    ],
  });

  logUsage({
    call: "transcribe (OCR stand-in)",
    model: TRANSCRIBE_MODEL,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
}
