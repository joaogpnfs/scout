import type { Destination } from "./types";
import { markdownDestination } from "./markdown";
import { jsonDestination } from "./json";

const registry: Partial<Record<string, Destination>> = {
  markdown: markdownDestination,
  json: jsonDestination,
};

/** Returns undefined for destination types that aren't shipped yet (obsidian/notion/linear). */
export function getDestination(destinationType: string): Destination | undefined {
  return registry[destinationType];
}
