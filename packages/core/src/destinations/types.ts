import type { ExtractedFields, FieldSchema } from "../types";

export interface DestinationCollection {
  name: string;
  fieldSchema: FieldSchema;
}

export interface DestinationCapture {
  extracted: ExtractedFields;
  confidence: number;
  createdAt: Date;
  imageUrl: string;
}

export interface DestinationWriteResult {
  location: string;
}

/**
 * A Destination owns both writing a Capture and validating its own config
 * shape — callers pass the Collection's raw destinationConfig through
 * unparsed. New destinations plug in without touching call sites.
 */
export interface Destination {
  write(collection: DestinationCollection, capture: DestinationCapture, config: unknown): Promise<DestinationWriteResult>;
}
