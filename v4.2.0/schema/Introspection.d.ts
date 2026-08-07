/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Provides utilities for schema introspection, including listing unique properties and converting custom schemas to JSON Schema format.
 * @module @NetFeez/common
 * @license Apache-2.0
 */
import type { JSONSchema } from './JSONSchema.js';
import type { Schema } from './Schema.js';
export declare class Introspection {
    /**
     * Lists all unique properties in a schema, including nested unique properties, and returns their full paths.
     * @param doc The schema to list unique properties from
     * @param parentKey The parent key of the current schema, used for building full paths of nested properties
     * @returns An array of full paths to unique properties in the schema
     */
    static listUniques(doc: Schema.Property | Schema.MultiProperty, parentKey?: string): string[];
    /**
     * Converts a schema to a JSON Schema, used for validating data against the schema and generating documentation.
     * @param schema The schema to convert to JSON Schema
     * @returns The JSON Schema representation of the input schema
     */
    static toJsonSchema(doc?: Schema.Property | Schema.MultiProperty): JSONSchema.schema;
}
export declare namespace Introspection { }
export default Introspection;
