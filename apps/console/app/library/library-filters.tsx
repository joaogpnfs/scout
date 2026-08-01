"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface LibraryFiltersProps {
  collections: { id: string; name: string }[];
  selectedCollectionId?: string;
  query?: string;
}

const fieldClasses =
  "rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-500";

export function LibraryFilters({ collections, selectedCollectionId, query }: LibraryFiltersProps) {
  const router = useRouter();
  const [search, setSearch] = useState(query ?? "");

  function navigate(next: { collectionId?: string; q?: string }) {
    const collectionId = "collectionId" in next ? next.collectionId : selectedCollectionId;
    const q = "q" in next ? next.q : query;
    const params = new URLSearchParams();
    if (collectionId) params.set("collectionId", collectionId);
    if (q) params.set("q", q);
    router.push(`/library${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="flex gap-2">
      <select
        className={fieldClasses}
        value={selectedCollectionId ?? ""}
        onChange={(event) => navigate({ collectionId: event.target.value || undefined })}
      >
        <option value="">All Collections</option>
        {collections.map((collection) => (
          <option key={collection.id} value={collection.id}>
            {collection.name}
          </option>
        ))}
      </select>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ q: search || undefined });
        }}
        className="flex-1"
      >
        <input
          className={`${fieldClasses} w-full`}
          placeholder="Search OCR text…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </form>
    </div>
  );
}
