"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { ProcessCaptureResult } from "./actions";
import { DynamicField } from "./dynamic-field";

interface ReviewPanelProps {
  result: ProcessCaptureResult;
  fields: Record<string, unknown>;
  onChange: (fields: Record<string, unknown>) => void;
  onSave: () => void;
  onDiscard: () => void;
  saving: boolean;
}

export function ReviewPanel({ result, fields, onChange, onSave, onDiscard, saving }: ReviewPanelProps) {
  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditable = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (event.key === "Enter" && (event.metaKey || event.ctrlKey || !isEditable)) {
        event.preventDefault();
        onSave();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onDiscard();
      }
    }
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [onSave, onDiscard]);

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <Image
          src={result.imageUrl}
          alt="Capture thumbnail"
          width={640}
          height={360}
          className="w-full object-cover"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-200">
          {result.collectionName}
        </span>
        <span className="text-xs text-zinc-500">{Math.round(result.confidence * 100)}% confidence</span>
      </div>

      <div className="flex flex-col gap-3">
        {result.fieldSchema.map((field) => (
          <DynamicField
            key={field.key}
            field={field}
            value={fields[field.key]}
            uncertain={result.uncertainFieldKeys.includes(field.key)}
            onChange={(value) => onChange({ ...fields, [field.key]: value })}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button onClick={onDiscard} className="text-xs text-zinc-500 hover:text-zinc-300">
          Discard <kbd className="ml-1 text-zinc-600">Esc</kbd>
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-md bg-[var(--accent)] px-4 py-1.5 text-xs font-medium text-zinc-950 transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"} <kbd className="ml-1 opacity-70">⏎</kbd>
        </button>
      </div>
    </div>
  );
}
