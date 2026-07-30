"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DestinationType, FieldSchemaEntry } from "@scout/core";
import { generateFieldSchema, createCollection, updateCollection, type CollectionInput } from "./actions";
import { FieldSchemaEditor } from "./field-schema-editor";

const DESTINATION_TYPES: DestinationType[] = ["markdown", "json", "obsidian", "notion", "linear"];

interface CollectionFormProps {
  mode: "create" | "edit";
  collectionId?: string;
  initial: CollectionInput;
}

const fieldClasses =
  "rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-500";

export function CollectionForm({ mode, collectionId, initial }: CollectionFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [icon, setIcon] = useState(initial.icon);
  const [instruction, setInstruction] = useState(initial.instruction);
  const [fieldSchema, setFieldSchema] = useState<FieldSchemaEntry[]>(initial.fieldSchema);
  const [destinationType, setDestinationType] = useState<DestinationType>(initial.destinationType);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const generated = await generateFieldSchema(instruction);
      setFieldSchema(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate fields");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const input: CollectionInput = { name, icon, instruction, fieldSchema, destinationType };
      const { id } =
        mode === "edit" && collectionId ? await updateCollection(collectionId, input) : await createCollection(input);
      router.push(`/collections/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3">
        <input
          className={`${fieldClasses} w-40`}
          placeholder="Icon"
          value={icon}
          onChange={(event) => setIcon(event.target.value)}
        />
        <input
          className={`${fieldClasses} flex-1`}
          placeholder="Collection name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-zinc-400">Instruction</label>
        <textarea
          className={`${fieldClasses} min-h-24 resize-y`}
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder='e.g. "This is a purchase receipt. Extract the vendor, total, date, and line items."'
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !instruction.trim()}
          className="self-start rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:border-zinc-500 disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate fields"}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-zinc-400">Fields</label>
        <FieldSchemaEditor fields={fieldSchema} onChange={setFieldSchema} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-zinc-400">Destination</label>
        <select
          className={`${fieldClasses} w-48`}
          value={destinationType}
          onChange={(event) => setDestinationType(event.target.value as DestinationType)}
        >
          {DESTINATION_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="text-xs text-amber-400/80">{error}</p> : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !name.trim() || fieldSchema.length === 0}
          className="rounded-md bg-[var(--accent)] px-4 py-1.5 text-xs font-medium text-zinc-950 transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Create Collection"}
        </button>
      </div>
    </div>
  );
}
