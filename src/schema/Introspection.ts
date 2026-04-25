/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Provides utilities for schema introspection, including listing unique properties and converting custom schemas to JSON Schema format.
 * @module @NetFeez/common
 * @license Apache-2.0
 */

import type { JSONSchema } from './JSONSchema.js';
import type { Schema } from './Schema.js';

export class Introspection {
    /**
     * Lists all unique properties in a schema, including nested unique properties, and returns their full paths.
     * @param doc The schema to list unique properties from
     * @param parentKey The parent key of the current schema, used for building full paths of nested properties
     * @returns An array of full paths to unique properties in the schema
     */
    public static listUniques(doc: Schema.Schema, parentKey?: string): string[] {
        const uniques: string[] = [];
        for (const key in doc) {
            const prop = doc[key];
            const currentPath = parentKey ? `${parentKey}.${key}` : key;
            
            if (key !== '_id' && prop.unique) uniques.push(parentKey ? `${parentKey}.${key}` : key);

            if ('union' in prop) {
                for (const subProp of prop.union) {
                    if (subProp.type === 'object') {
                        if (!subProp.properties) continue;
                        uniques.push(...this.listUniques(subProp.properties, currentPath));
                    }
                }
            } else if (prop.type === 'object') {
                if (!prop.properties) continue;
                uniques.push(...this.listUniques(prop.properties, parentKey ? `${parentKey}.${key}` : key));
            }
        }
        return uniques;
    }
    /**
     * Converts a schema to a JSON Schema, used for validating data against the schema and generating documentation.
     * @param schema The schema to convert to JSON Schema
     * @returns The JSON Schema representation of the input schema
     */
    public static toJsonSchema(schema?: Schema.Schema): JSONSchema.schema {

        const sch: JSONSchema.schema = {};
        sch.type = 'object';
        sch.properties = {};

        if (!schema) {
            sch.additionalProperties = true;
            return sch;
        }

        for (const key in schema) {
            const prop = schema[key];

            if ('required' in prop && prop.required) {
                if (!sch.required) sch.required = [];
                sch.required.push(key);
            }
            sch.properties[key] = this.propertyToJsonSchema(prop);
        }
        return sch;
    }
    /**
     * Helper method to convert a single property (which can be a simple property or a union of properties) to its JSON Schema representation.
     * @param prop The property to convert to JSON Schema
     * @returns The JSON Schema representation of the input property
     */
    protected static propertyToJsonSchema(prop: Schema.property | Schema.multiProperty): JSONSchema.schema {
        let subSch: JSONSchema.schema = {};
        if ('union' in prop) {
            subSch.anyOf = prop.union.map(sub => this.propertyToJsonSchema(sub));
            if (prop.nullable) subSch.anyOf.push({ type: 'null' });
            return subSch;
        }

        const type = prop.type;
        subSch.type = prop.nullable ? [type, 'null'] : type;

        switch (type) {
            case 'string':
                if (prop.enum) subSch.enum = [...prop.enum];
                if (prop.minLength !== undefined) subSch.minLength = prop.minLength;
                if (prop.maxLength !== undefined) subSch.maxLength = prop.maxLength;
                if (prop.pattern) subSch.pattern = prop.pattern.source;
                break;

            case 'number':
                if (prop.minimum !== undefined) subSch.minimum = prop.minimum;
                if (prop.maximum !== undefined) subSch.maximum = prop.maximum;
                break;

            case 'array':
                if (prop.minimum !== undefined) subSch.minItems = prop.minimum;
                if (prop.maximum !== undefined) subSch.maxItems = prop.maximum;
                subSch.items = this.propertyToJsonSchema(prop.items);
                break;

            case 'object':
                const objectSchema = this.toJsonSchema(prop.properties);
                subSch = { ...objectSchema }; 
                subSch.type = prop.nullable ? ['object', 'null'] : 'object';
                break;
        }

        return subSch;
    }
}
export namespace Introspection {}
export default Introspection;