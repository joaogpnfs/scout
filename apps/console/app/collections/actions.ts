"use server";

import { revalidatePath } from "next/cache";
import {
  generateSchema,
  DestinationConfigSchema,
  FieldSchemaSchema,
  type DestinationConfig,
  type DestinationType,
  type FieldSchema,
} from "@scout/core";
import { db } from "@/lib/db";

export async function generateFieldSchema(instruction: string): Promise<FieldSchema> {
  if (!instruction.trim()) {
    throw new Error("Write an instruction first.");
  }
  return generateSchema(instruction);
}

export interface CollectionInput {
  name: string;
  icon: string;
  instruction: string;
  fieldSchema: FieldSchema;
  destinationType: DestinationType;
  destinationConfig: DestinationConfig;
}

export async function createCollection(input: CollectionInput): Promise<{ id: string }> {
  const fieldSchema = FieldSchemaSchema.parse(input.fieldSchema);
  const destinationConfig = DestinationConfigSchema.parse(input.destinationConfig);

  const collection = await db.collection.create({
    data: {
      name: input.name,
      icon: input.icon,
      instruction: input.instruction,
      fieldSchema,
      destinationType: input.destinationType,
      destinationConfig,
    },
  });

  revalidatePath("/collections");
  return { id: collection.id };
}

export async function updateCollection(id: string, input: CollectionInput): Promise<{ id: string }> {
  const fieldSchema = FieldSchemaSchema.parse(input.fieldSchema);
  const destinationConfig = DestinationConfigSchema.parse(input.destinationConfig);

  await db.collection.update({
    where: { id },
    data: {
      name: input.name,
      icon: input.icon,
      instruction: input.instruction,
      fieldSchema,
      destinationType: input.destinationType,
      destinationConfig,
    },
  });

  revalidatePath("/collections");
  revalidatePath(`/collections/${id}`);
  return { id };
}
