import Image from "next/image";
import { ExtractedFieldsSchema, FieldSchemaSchema } from "@scout/core";
import { db } from "@/lib/db";

export async function DetailPanel({ captureId }: { captureId: string }) {
  const capture = await db.capture.findUnique({
    where: { id: captureId },
    include: { collection: true },
  });

  if (!capture) {
    return <div className="w-80 shrink-0 text-sm text-zinc-500">Capture not found.</div>;
  }

  const fieldSchema = FieldSchemaSchema.parse(capture.collection.fieldSchema);
  const extracted = ExtractedFieldsSchema.parse(capture.extracted);

  return (
    <div className="w-80 shrink-0 rounded-lg border border-zinc-800 p-4">
      <div className="overflow-hidden rounded-md border border-zinc-800">
        <Image src={capture.imageUrl} alt="Capture" width={320} height={180} className="w-full object-cover" />
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        {capture.collection.name} · {Math.round(capture.confidence * 100)}% confidence
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {fieldSchema.map((field) => {
          const value = extracted[field.key];
          return (
            <div key={field.key}>
              <p className="text-xs font-medium text-zinc-400">{field.label}</p>
              <p className="text-sm text-zinc-200">
                {Array.isArray(value) ? value.join(", ") : String(value ?? "—")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
