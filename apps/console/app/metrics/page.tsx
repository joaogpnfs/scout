import { COLLECTION_CORRECTION_FIELD_KEY, FieldSchemaSchema } from "@scout/core";
import { db } from "@/lib/db";

export default async function MetricsPage() {
  const totalCaptures = await db.capture.count();
  const reclassifiedCount = await db.correction.count({
    where: { fieldKey: COLLECTION_CORRECTION_FIELD_KEY },
  });

  const reclassificationRate = totalCaptures > 0 ? reclassifiedCount / totalCaptures : 0;
  const accuracy = totalCaptures > 0 ? 1 - reclassificationRate : null;

  const collections = await db.collection.findMany({ orderBy: { name: "asc" } });

  const perCollectionStats = await Promise.all(
    collections.map(async (collection) => {
      const fieldSchema = FieldSchemaSchema.parse(collection.fieldSchema);
      const captureCount = await db.capture.count({ where: { collectionId: collection.id } });

      const correctionCounts = await db.correction.groupBy({
        by: ["fieldKey"],
        where: {
          fieldKey: { not: COLLECTION_CORRECTION_FIELD_KEY },
          capture: { collectionId: collection.id },
        },
        _count: { fieldKey: true },
      });
      const countsByKey = new Map(correctionCounts.map((row) => [row.fieldKey, row._count.fieldKey]));

      const fieldRates = fieldSchema.map((field) => {
        const correctionCount = countsByKey.get(field.key) ?? 0;
        return {
          key: field.key,
          label: field.label,
          correctionCount,
          rate: captureCount > 0 ? correctionCount / captureCount : 0,
        };
      });

      return { collection, captureCount, fieldRates };
    }),
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-8 text-base font-medium text-zinc-100">Metrics</h1>

      <section className="mb-10 rounded-lg border border-zinc-800 p-5">
        <p className="text-xs font-medium text-zinc-400">Classification accuracy</p>
        {totalCaptures === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No captures saved yet.</p>
        ) : (
          <>
            <p className="mt-2 text-2xl font-medium text-zinc-100">{Math.round((accuracy ?? 0) * 100)}%</p>
            <p className="mt-1 text-xs text-zinc-500">
              {reclassifiedCount} of {totalCaptures} captures were reclassified by hand (
              {Math.round(reclassificationRate * 100)}%).
            </p>
          </>
        )}
      </section>

      <section>
        <p className="mb-3 text-xs font-medium text-zinc-400">Per-field correction rate</p>
        <div className="flex flex-col gap-4">
          {perCollectionStats.map(({ collection, captureCount, fieldRates }) => (
            <div key={collection.id} className="rounded-lg border border-zinc-800 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-100">{collection.name}</span>
                <span className="text-xs text-zinc-500">{captureCount} captures</span>
              </div>
              {captureCount === 0 ? (
                <p className="text-xs text-zinc-600">No captures yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {fieldRates.map((field) => (
                    <div key={field.key} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 truncate text-xs text-zinc-400">{field.label}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-amber-500/60"
                          style={{ width: `${Math.round(field.rate * 100)}%` }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right text-xs text-zinc-500">
                        {Math.round(field.rate * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
