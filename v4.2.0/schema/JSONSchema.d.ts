/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Provides type definitions for JSON Schema, a powerful tool for validating and describing the structure of JSON data.
 * This module defines the various types and interfaces that represent the structure of a JSON Schema, allowing for strong TypeScript typing when working with JSON Schemas in your applications.
 * @license Apache-2.0
 */
export declare namespace JSONSchema {
    type schemeArray = schemeTypes[];
    type schemaObject = {
        [key: string]: schemeTypes;
    };
    interface SchemaTypeMap {
        string: string;
        number: number;
        boolean: boolean;
        object: schemaObject;
        array: schemeArray;
        null: null;
    }
    type schemaNames = keyof SchemaTypeMap;
    type schemeTypes = SchemaTypeMap[schemaNames];
    type schemaVersion = string;
    type schema = {
        title?: string;
        description?: string;
        multipleOf?: number;
        maximum?: number;
        exclusiveMaximum?: boolean;
        minimum?: number;
        exclusiveMinimum?: boolean;
        maxLength?: number;
        minLength?: number;
        pattern?: string;
        additionalItems?: schema;
        items?: schema | schema[];
        maxItems?: number;
        minItems?: number;
        uniqueItems?: boolean;
        maxProperties?: number;
        minProperties?: number;
        required?: string[];
        properties?: {
            [key: string]: schema;
        };
        additionalProperties?: boolean | schema;
        patternProperties?: {
            [key: string]: schema;
        };
        dependencies?: {
            [key: string]: string[] | schema;
        };
        enum?: schemeTypes[];
        type?: schemaNames | schemaNames[];
        allOf?: schema[];
        anyOf?: schema[];
        oneOf?: schema[];
        not?: schema;
        extends?: string | string[];
    };
}
/**
 * provide the type definition of a json schema
 * @param schema the json schema to validate
 */
export declare function schema(schema: JSONSchema.schema): JSONSchema.schema;
export declare const JSONSchema: {
    schema: typeof schema;
};
export default JSONSchema;
