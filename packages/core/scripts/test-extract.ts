import path from "node:path";
import { readFile } from "node:fs/promises";
import { config } from "dotenv";
import {
  classify,
  extract,
  prepareImage,
  transcribe,
  type ClassifyCollectionInput,
  type FieldSchema,
} from "../src/index";

// Reuses apps/console's .env for ANTHROPIC_API_KEY so the key only lives in one place.
// Safe to run after the imports above: nothing in this module tree reads
// process.env at import time, only inside functions called from main() below.
config({ path: path.resolve(import.meta.dirname, "../../../apps/console/.env"), quiet: true });

// The Phase 1 seed Collections, duplicated here so this script runs without a
// database — packages/core stays headless per the Phase 2 spec.
const COLLECTIONS: (ClassifyCollectionInput & { fieldSchema: FieldSchema })[] = [
  {
    id: "receipts",
    name: "Receipts",
    instruction:
      "This is a purchase receipt. Extract the vendor name, the total amount charged, the transaction date, and each individual line item.",
    fieldSchema: [
      { key: "vendor", label: "Vendor", type: "text", description: "Business or store name on the receipt" },
      { key: "total", label: "Total", type: "currency", description: "Final amount charged, including tax" },
      { key: "date", label: "Date", type: "date", description: "Date of the transaction" },
      { key: "lineItems", label: "Line Items", type: "list", description: "Individual items purchased, one per line" },
    ],
  },
  {
    id: "study-notes",
    name: "Study Notes",
    instruction:
      "This is a screenshot of study material. Extract the main topic, the key concepts covered, and the source it came from.",
    fieldSchema: [
      { key: "topic", label: "Topic", type: "text", description: "The main subject of the material" },
      { key: "keyConcepts", label: "Key Concepts", type: "list", description: "Important terms or ideas covered" },
      { key: "source", label: "Source", type: "url", description: "Where the material came from, if identifiable" },
    ],
  },
  {
    id: "design-references",
    name: "Design References",
    instruction:
      "This is a UI or visual design reference. Extract the source URL if visible, descriptive style tags, and any notes worth remembering about the design.",
    fieldSchema: [
      { key: "sourceUrl", label: "Source URL", type: "url", description: "Where the design was found, if visible" },
      { key: "styleTags", label: "Style Tags", type: "list", description: "Short descriptors of the visual style" },
      { key: "notes", label: "Notes", type: "text", description: "Anything worth remembering about this reference" },
    ],
  },
  {
    id: "bug-reports",
    name: "Bug Reports",
    instruction:
      "This is a screenshot of a software bug. Extract the steps to reproduce, the expected behavior, the actual behavior, and the environment it occurred in.",
    fieldSchema: [
      { key: "steps", label: "Steps to Reproduce", type: "list", description: "Ordered steps that trigger the bug" },
      { key: "expected", label: "Expected", type: "text", description: "What should have happened" },
      { key: "actual", label: "Actual", type: "text", description: "What actually happened" },
      { key: "environment", label: "Environment", type: "text", description: "OS, browser, app version, etc." },
    ],
  },
];

async function main(): Promise<void> {
  const imagePath = process.argv[2];
  if (!imagePath) {
    console.error("Usage: pnpm test:extract <path-to-image>");
    process.exit(1);
  }

  const buffer = await readFile(imagePath);
  const image = await prepareImage(buffer);

  console.log("Transcribing...");
  const ocrText = await transcribe(image);
  console.log("--- OCR text ---");
  console.log(ocrText);

  console.log("\nClassifying...");
  const classification = await classify(ocrText, COLLECTIONS);
  console.log("--- Classification ---");
  console.log(classification);

  const collection = COLLECTIONS.find((candidate) => candidate.id === classification.collectionId);
  if (!collection) {
    throw new Error(`classify returned unknown collectionId: ${classification.collectionId}`);
  }

  console.log("\nExtracting...");
  const extraction = await extract(image, collection, []);
  console.log("--- Extraction ---");
  console.log(extraction);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
