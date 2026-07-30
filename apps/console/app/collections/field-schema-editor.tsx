"use client";

import type { FieldSchemaEntry, FieldType } from "@scout/core";

const FIELD_TYPES: FieldType[] = ["text", "number", "currency", "date", "url", "list"];

interface FieldSchemaEditorProps {
  fields: FieldSchemaEntry[];
  onChange: (fields: FieldSchemaEntry[]) => void;
}

const inputClasses =
  "rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-zinc-500";

export function FieldSchemaEditor({ fields, onChange }: FieldSchemaEditorProps) {
  function updateField(index: number, patch: Partial<FieldSchemaEntry>) {
    onChange(fields.map((field, i) => (i === index ? { ...field, ...patch } : field)));
  }

  function removeField(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  function addField() {
    onChange([...fields, { key: "", label: "", type: "text", description: "" }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {fields.map((field, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-md border border-zinc-800 p-3">
          <div className="flex gap-2">
            <input
              className={`${inputClasses} w-32`}
              placeholder="key"
              value={field.key}
              onChange={(event) => updateField(index, { key: event.target.value })}
            />
            <input
              className={`${inputClasses} flex-1`}
              placeholder="Label"
              value={field.label}
              onChange={(event) => updateField(index, { label: event.target.value })}
            />
            <select
              className={inputClasses}
              value={field.type}
              onChange={(event) => updateField(index, { type: event.target.value as FieldType })}
            >
              {FIELD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeField(index)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Remove
            </button>
          </div>
          <input
            className={`${inputClasses} text-xs text-zinc-400`}
            placeholder="Description — what this field captures"
            value={field.description}
            onChange={(event) => updateField(index, { description: event.target.value })}
          />
        </div>
      ))}
      <button type="button" onClick={addField} className="self-start text-xs text-zinc-500 hover:text-zinc-300">
        + Add field
      </button>
    </div>
  );
}
