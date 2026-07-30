"use client";

import type { FieldSchemaEntry } from "@scout/core";

interface DynamicFieldProps {
  field: FieldSchemaEntry;
  value: unknown;
  uncertain: boolean;
  onChange: (value: unknown) => void;
}

export function DynamicField({ field, value, uncertain, onChange }: DynamicFieldProps) {
  const inputClasses = `w-full rounded-md border bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-500 ${
    uncertain ? "border-amber-500/40" : "border-zinc-800"
  }`;

  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
        {field.label}
        {uncertain ? (
          <span className="text-amber-400/70" title="The model wasn't confident about this field">
            ·
          </span>
        ) : null}
      </label>

      {field.type === "list" ? (
        <textarea
          className={`${inputClasses} min-h-16 resize-y`}
          value={Array.isArray(value) ? value.join("\n") : String(value ?? "")}
          onChange={(event) => onChange(event.target.value.split("\n").filter(Boolean))}
        />
      ) : field.type === "date" ? (
        <input
          type="date"
          className={inputClasses}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.type === "number" || field.type === "currency" ? (
        <input
          type="number"
          className={inputClasses}
          value={typeof value === "number" ? value : ""}
          onChange={(event) => onChange(event.target.valueAsNumber)}
        />
      ) : (
        <input
          type={field.type === "url" ? "url" : "text"}
          className={inputClasses}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
