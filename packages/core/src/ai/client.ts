import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | undefined;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export interface UsageLog {
  call: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export function logUsage(log: UsageLog): void {
  console.log(
    `[ai] ${log.call} model=${log.model} input_tokens=${log.inputTokens} output_tokens=${log.outputTokens}`,
  );
}
