import Link from "next/link";
import { db } from "@/lib/db";

export default async function CollectionsPage() {
  const collections = await db.collection.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-base font-medium text-zinc-100">Collections</h1>
        <Link
          href="/collections/new"
          className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-zinc-950 hover:opacity-90"
        >
          New Collection
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {collections.map((collection) => (
          <div key={collection.id} className="flex flex-col gap-2 rounded-lg border border-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-100">{collection.name}</span>
              <span className="text-xs text-zinc-500">{collection.icon}</span>
            </div>
            <p className="line-clamp-2 text-xs text-zinc-400">{collection.instruction}</p>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <Link href={`/collections/${collection.id}`} className="text-zinc-300 hover:text-zinc-100">
                Edit
              </Link>
              <Link href={`/collections/new?from=${collection.id}`} className="text-zinc-500 hover:text-zinc-300">
                Duplicate
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
