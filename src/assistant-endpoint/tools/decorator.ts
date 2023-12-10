import { Accountability, SchemaOverview } from "@directus/types";
import { Knex } from "knex";
import type { JSONSchema7 } from "json-schema";

export type GPTFunctionMetadata = {
  /** If not indicated, the function name is taken */
  name?: string;
  parameters?: JSONSchema7;
};

export type GPTFunctionContext = {
  accountability: Accountability;
  args: Record<string, any>;
  database: Knex<any, any[]>;
  schema: SchemaOverview;
  services: Record<string, any>;
};

export type GPTFunctionRegistered = {
  target: new () => any;
  metadata: GPTFunctionMetadata;
  handler: (context: GPTFunctionContext) => Promise<any>;
};

export const FunctionsRegistered: GPTFunctionRegistered[] = [];

export const GPTFunction =
  (meta?: GPTFunctionMetadata) =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const functionName = meta?.name ?? propertyKey;

    if (!functionName || functionName.length === 0)
      throw new Error("GPT Function requires a name");

    if (typeof descriptor.value !== "function")
      throw new Error(
        `@GPTFunction wraps a Function, received ${typeof descriptor.value}`
      );

    FunctionsRegistered.push({
      target: target.constructor,
      metadata: { ...meta, name: functionName },
      handler: descriptor.value,
    });
  };
