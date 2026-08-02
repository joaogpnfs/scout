import { db } from "@/lib/db";
import {
  DestinationConfigSchema,
  DestinationTypeSchema,
  FieldSchemaSchema,
  type DestinationConfig,
  type DestinationType,
  type FieldSchema,
} from "@scout/core";
import { CollectionForm } from "../collection-form";

export default async function NewCollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  let initial = {
    name: "",
    icon: "",
    instruction: "",
    fieldSchema: [] as FieldSchema,
    destinationType: "markdown" as DestinationType,
    destinationConfig: {} as DestinationConfig,
  };

  if (from) {
    const source = await db.collection.findUnique({ where: { id: from } });
    if (source) {
      initial = {
        name: `${source.name} copy`,
        icon: source.icon,
        instruction: source.instruction,
        fieldSchema: FieldSchemaSchema.parse(source.fieldSchema),
        destinationType: DestinationTypeSchema.parse(source.destinationType),
        destinationConfig: DestinationConfigSchema.parse(source.destinationConfig),
      };
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-8 text-base font-medium text-zinc-100">New Collection</h1>
      <CollectionForm mode="create" initial={initial} />
    </main>
  );
}
