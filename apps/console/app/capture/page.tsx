"use client";

import { useCallback, useRef, useState } from "react";
import { processCapture, saveCapture, type ProcessCaptureResult } from "./actions";
import { ReviewPanel } from "./review-panel";

type Status = "idle" | "processing" | "review" | "saving" | "saved" | "error";

export default function CapturePage() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ProcessCaptureResult | null>(null);
  const [fields, setFields] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setStatus("processing");
    setError(null);
    try {
      const formData = new FormData();
      formData.set("image", file);
      const processed = await processCapture(formData);
      setResult(processed);
      setFields(processed.fields);
      setStatus("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const item = Array.from(event.clipboardData.items).find((candidate) => candidate.type.startsWith("image/"));
      const file = item?.getAsFile();
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handleSave = useCallback(async () => {
    if (!result) return;
    setStatus("saving");
    try {
      await saveCapture({
        collectionId: result.collectionId,
        imageUrl: result.imageUrl,
        ocrText: result.ocrText,
        confidence: result.confidence,
        originalFields: result.fields,
        editedFields: fields,
      });
      setStatus("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }, [result, fields]);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setFields({});
    setError(null);
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      {status === "idle" || status === "error" ? (
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          onPaste={handlePaste}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          className="flex h-64 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 text-center transition hover:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <p className="text-sm text-zinc-300">Drag, drop, or paste a screenshot</p>
          <p className="text-xs text-zinc-500">or click to browse</p>
          {error ? <p className="mt-2 text-xs text-amber-400/80">{error}</p> : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </div>
      ) : null}

      {status === "processing" ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2">
          <p className="text-sm text-zinc-400">Classifying and extracting…</p>
        </div>
      ) : null}

      {(status === "review" || status === "saving") && result ? (
        <ReviewPanel
          result={result}
          fields={fields}
          onChange={setFields}
          onSave={handleSave}
          onDiscard={reset}
          saving={status === "saving"}
        />
      ) : null}

      {status === "saved" && result ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-zinc-300">Saved to {result.collectionName}.</p>
          <button
            onClick={reset}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500"
          >
            Capture another <kbd className="ml-1 text-zinc-500">⏎</kbd>
          </button>
        </div>
      ) : null}
    </main>
  );
}
