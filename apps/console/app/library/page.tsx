import Link from "next/link";
import { db } from "@/lib/db";
import { LibraryFilters } from "./library-filters";
import { DetailPanel } from "./detail-panel";

interface LibraryPageProps {
  searchParams: Promise<{ collectionId?: string; q?: string; captureId?: string }>;
}

function buildHref(base: { collectionId?: string; q?: string; captureId?: string }): string {
  const params = new URLSearchParams();
  if (base.collectionId) params.set("collectionId", base.collectionId);
  if (base.q) params.set("q", base.q);
  if (base.captureId) params.set("captureId", base.captureId);
  const qs = params.toString();
  return `/library${qs ? `?${qs}` : ""}`;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const { collectionId, q, captureId } = await searchParams;

  const collections = await db.collection.findMany({ orderBy: { name: "asc" } });

  const captures = await db.capture.findMany({
    where: {
      ...(collectionId ? { collectionId } : {}),
      ...(q ? { ocrText: { contains: q, mode: "insensitive" } } : {}),
    },
    include: { collection: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto flex max-w-5xl gap-6 px-6 py-16">
      <div className="min-w-0 flex-1">
        <h1 className="mb-6 text-base font-medium text-zinc-100">Library</h1>

        <LibraryFilters collections={collections} selectedCollectionId={collectionId} query={q} />

        <div className="mt-4 flex flex-col divide-y divide-zinc-800 rounded-lg border border-zinc-800">
          {captures.length === 0 ? (
            <p className="px-4 py-6 text-sm text-zinc-500">No captures yet.</p>
          ) : (
            captures.map((capture) => (
              <Link
                key={capture.id}
                href={buildHref({ collectionId, q, captureId: capture.id })}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-900 ${
                  capture.id === captureId ? "bg-zinc-900" : ""
                }`}
              >
                <span className="shrink-0 text-zinc-200">{capture.collection.name}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-zinc-500">{capture.ocrText.slice(0, 100)}</span>
                <span className="shrink-0 text-xs text-zinc-600">
                  {new Date(capture.createdAt).toLocaleDateString()}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      {captureId ? <DetailPanel captureId={captureId} /> : null}
    </main>
  );
}
