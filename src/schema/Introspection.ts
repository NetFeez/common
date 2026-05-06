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
    public static listUniques(doc: Schema.Property | Schema.MultiProperty, parentKey?: string): string[] {
        // Permite recibir tanto PropertyMap como Property/MultiProperty
        const uniques: string[] = [];
        // Si es un MultiProperty (union)
        if (doc.type === 'union') {
            for (const subProp of doc.union) {
                uniques.push(...this.listUniques(subProp, parentKey));
            }
            return uniques;
        }
        // Si es un objeto con propiedades
        if (doc.type === 'object' && doc.properties) {
            for (const key in doc.properties) {
                const prop = doc.properties[key];
                const currentPath = parentKey ? `${parentKey}.${key}` : key;
                if (key !== '_id' && prop.unique) uniques.push(currentPath);
                uniques.push(...this.listUniques(prop, currentPath));
            }
        }
        return uniques;
    }
    /**
     * Converts a schema to a JSON Schema, used for validating data against the schema and generating documentation.
     * @param schema The schema to convert to JSON Schema
     * @returns The JSON Schema representation of the input schema
     */
    public static toJsonSchema(doc?: Schema.Property | Schema.MultiProperty): JSONSchema.schema {
        // Si no se pasa nada, devolver un objeto abierto
        if (!doc) {
            return { type: 'object', additionalProperties: true };
        }
        // Si es un MultiProperty (union)
        if (doc.type === 'union') {
            return {
                anyOf: doc.union.map(sub => this.toJsonSchema(sub)),
                ...(doc.nullable ? { anyOf: [...doc.union.map(sub => this.toJsonSchema(sub)), { type: 'null' }] } : {})
            };
        }
        // Si es un objeto
        if (doc.type === 'object') {
            const sch: JSONSchema.schema = { type: doc.nullable ? ['object', 'null'] : 'object', properties: {} };
            if (!sch.properties) sch.properties = {};
            if (doc.properties) {
                for (const key in doc.properties) {
                    const prop = doc.properties[key];
                    sch.properties[key] = this.toJsonSchema(prop);
                    if (prop.required) {
                        if (!sch.required) sch.required = [];
                        sch.required.push(key);
                    }
                }
            }
            if (doc.allowAdditionalProperties === false) {
                sch.additionalProperties = false;
            } else if (doc.allowAdditionalProperties) {
                sch.additionalProperties = doc.allowAdditionalProperties !== true
                    ? this.toJsonSchema(doc.allowAdditionalProperties)
                    : true;
            }
            return sch;
        }
        // Si es un array
        if (doc.type === 'array') {
            const sch: JSONSchema.schema = { type: doc.nullable ? ['array', 'null'] : 'array' };
            if ('items' in doc) sch.items = this.toJsonSchema(doc.items);
            if (doc.minimum !== undefined) sch.minItems = doc.minimum;
            if (doc.maximum !== undefined) sch.maxItems = doc.maximum;
            return sch;
        }
        // Si es un string
        if (doc.type === 'string') {
            const sch: JSONSchema.schema = { type: doc.nullable ? ['string', 'null'] : 'string' };
            if (doc.enum) sch.enum = [...doc.enum];
            if (doc.minLength !== undefined) sch.minLength = doc.minLength;
            if (doc.maxLength !== undefined) sch.maxLength = doc.maxLength;
            if (doc.pattern) sch.pattern = doc.pattern instanceof RegExp ? doc.pattern.source : doc.pattern;
            return sch;
        }
        // Si es un number
        if (doc.type === 'number') {
            const sch: JSONSchema.schema = { type: doc.nullable ? ['number', 'null'] : 'number' };
            if (doc.minimum !== undefined) sch.minimum = doc.minimum;
            if (doc.maximum !== undefined) sch.maximum = doc.maximum;
            return sch;
        }
        // Si es un boolean
        if (doc.type === 'boolean') {
            return { type: doc.nullable ? ['boolean', 'null'] : 'boolean' };
        }
        return {};
    }
}
export namespace Introspection {}
export default Introspection;