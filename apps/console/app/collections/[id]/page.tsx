import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DestinationConfigSchema, DestinationTypeSchema, FieldSchemaSchema } from "@scout/core";
import { CollectionForm } from "../collection-form";

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = await db.collection.findUnique({ where: { id } });
  if (!collection) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-8 text-base font-medium text-zinc-100">Edit Collection</h1>
      <CollectionForm
        mode="edit"
        collectionId={collection.id}
        initial={{
          name: collection.name,
          icon: collection.icon,
          instruction: collection.instruction,
          fieldSchema: FieldSchemaSchema.parse(collection.fieldSchema),
          destinationType: DestinationTypeSchema.parse(collection.destinationType),
          destinationConfig: DestinationConfigSchema.parse(collection.destinationConfig),
        }}
      />
    </main>
  );
}
