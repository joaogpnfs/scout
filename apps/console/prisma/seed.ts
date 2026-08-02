import {
  DestinationConfigSchema,
  FieldSchemaSchema,
  type DestinationConfig,
  type FieldSchema,
} from "@scout/core";
import { db } from "../lib/db";

interface CollectionSeed {
  name: string;
  icon: string;
  instruction: string;
  fieldSchema: FieldSchema;
  destinationType: string;
  destinationConfig: DestinationConfig;
}

const collections: CollectionSeed[] = [
  {
    name: "Receipts",
    icon: "receipt",
    instruction:
      "This is a purchase receipt. Extract the vendor name, the total amount charged, the transaction date, and each individual line item.",
    fieldSchema: [
      {
        key: "summary",
        label: "Summary",
        type: "text",
        description:
          "One friendly sentence summarizing this receipt for the user, e.g. \"You spent $42 at Trader Joe's on March 3rd.\"",
      },
      { key: "vendor", label: "Vendor", type: "text", description: "Business or store name on the receipt" },
      { key: "total", label: "Total", type: "currency", description: "Final amount charged, including tax" },
      { key: "date", label: "Date", type: "date", description: "Date of the transaction" },
      { key: "lineItems", label: "Line Items", type: "list", description: "Individual items purchased, one per line" },
    ],
    destinationType: "notion",
    destinationConfig: { databaseId: null },
  },
  {
    name: "Study Notes",
    icon: "book-open",
    instruction:
      "This is a screenshot of study material. Extract the main topic, the key concepts covered, and the source it came from.",
    fieldSchema: [
      {
        key: "summary",
        label: "Summary",
        type: "text",
        description:
          "One friendly sentence summarizing what this capture is about and why it matters, e.g. \"You saved a note on health economics from an academic handbook.\"",
      },
      { key: "topic", label: "Topic", type: "text", description: "The main subject of the material" },
      { key: "keyConcepts", label: "Key Concepts", type: "list", description: "Important terms or ideas covered" },
      { key: "source", label: "Source", type: "url", description: "Where the material came from, if identifiable" },
    ],
    destinationType: "obsidian",
    destinationConfig: { vaultPath: null },
  },
  {
    name: "Design References",
    icon: "palette",
    instruction:
      "This is a UI or visual design reference. Extract the source URL if visible, descriptive style tags, and any notes worth remembering about the design.",
    fieldSchema: [
      {
        key: "summary",
        label: "Summary",
        type: "text",
        description:
          "One friendly sentence describing what this design reference shows and its style, e.g. \"You saved a dark dashboard design with a card-based layout.\"",
      },
      { key: "sourceUrl", label: "Source URL", type: "url", description: "Where the design was found, if visible" },
      { key: "styleTags", label: "Style Tags", type: "list", description: "Short descriptors of the visual style" },
      { key: "notes", label: "Notes", type: "text", description: "Anything worth remembering about this reference" },
    ],
    destinationType: "markdown",
    destinationConfig: { folderPath: null },
  },
  {
    name: "Bug Reports",
    icon: "bug",
    instruction:
      "This is a screenshot of a software bug. Extract the steps to reproduce, the expected behavior, the actual behavior, and the environment it occurred in.",
    fieldSchema: [
      {
        key: "summary",
        label: "Summary",
        type: "text",
        description:
          "One friendly sentence describing the bug in plain language, e.g. \"You reported that the DOI text gets cut off on the article page.\"",
      },
      { key: "steps", label: "Steps to Reproduce", type: "list", description: "Ordered steps that trigger the bug" },
      { key: "expected", label: "Expected", type: "text", description: "What should have happened" },
      { key: "actual", label: "Actual", type: "text", description: "What actually happened" },
      { key: "environment", label: "Environment", type: "text", description: "OS, browser, app version, etc." },
    ],
    destinationType: "linear",
    destinationConfig: { teamId: null },
  },
];

async function main(): Promise<void> {
  for (const seed of collections) {
    const fieldSchema = FieldSchemaSchema.parse(seed.fieldSchema);
    const destinationConfig = DestinationConfigSchema.parse(seed.destinationConfig);

    const existing = await db.collection.findFirst({ where: { name: seed.name } });
    if (existing) {
      // Only sync fieldSchema — instruction/destinationConfig may have been
      // customized by hand via /collections since the last seed run.
      await db.collection.update({ where: { id: existing.id }, data: { fieldSchema } });
      console.log(`synced fieldSchema: ${seed.name}`);
      continue;
    }

    await db.collection.create({
      data: {
        name: seed.name,
        icon: seed.icon,
        instruction: seed.instruction,
        fieldSchema,
        destinationType: seed.destinationType,
        destinationConfig,
      },
    });
    console.log(`created: ${seed.name}`);
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
