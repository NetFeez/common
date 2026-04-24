/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Provides a comprehensive schema validation and processing system, allowing developers to define complex data structures.
 * @license Apache-2.0
 */
import Flatten from '../Flatten.js';

import _SchemaError from './SchemaError.js';
import _JSONSchema from './JSONSchema.js';
import _Introspection from './Introspection.js';
import _Validator from './Validator.js';

export { SchemaError } from './SchemaError.js';
export { JSONSchema } from './JSONSchema.js';
export { Introspection } from './Introspection.js';
export { Validator } from './Validator.js';

export class Schema<const S extends Schema.Schema> {
    constructor(
        public readonly schema: S
    ) { Schema.Validator.validateStructure(schema); }
    /**
     * Get the inferred type of the schema.
     * 
     * ⚠️ IMPORTANT: This getter returns an EMPTY object. It is designed ONLY for type inference.
     * 
     * Usage: Use with `typeof` to extract the inferred type:
     * ```typescript
     * type infered = typeof schemaInstance.infer;
     * ```
     * 
     * DO NOT use the returned value at runtime - it's always an empty object.
     * This is purely a TypeScript type utility.
     * 
     * @returns An empty object with the inferred type
     */
    public get infer(): Schema.Infer<this['schema']> {
        return {} as Schema.Infer<this['schema']>;
    }
    /**
     * Get the inferred type of the schema for processing (i.e., before applying defaults and handling optional properties).
     * 
     * ⚠️ IMPORTANT: This getter returns an EMPTY object. It is designed ONLY for type inference.
     * 
     * Usage: Use with `typeof` to extract the inferred type for processing:
     * ```typescript
     * type inferedToProcess = typeof schemaInstance.inferToProcess;
     * ```
     * 
     * DO NOT use the returned value at runtime - it's always an empty object.
     * This is purely a TypeScript type utility.
     */
    public get inferToProcess(): Schema.InferToProcess<this['schema']> {
        return {} as Schema.InferToProcess<this['schema']>;
    }
    /**
     * get the json schema as an object
     * @returns the json schema
     */
    public get jsonSchema(): Schema.JSONSchema.schema { return this.toJsonSchema(); }
    /**
     * get the json schema as a JSON string
     * @returns the json schema as a string
     */
    public get jsonSchemaJSON(): string { return JSON.stringify(this.jsonSchema); }
    /**
     * get the list of unique keys
     * @returns the list of unique keys
     */
    public get uniques(): string[] { return this.listUniques(); }
    /**
     * process the provided data
     * @param data the data to process
     * @param partial if the data is partial
     * @returns the processed data
     * @throws schemaError if the data is not valid
     */
    public processData(data: Schema.Infer<this['schema']>, partial?: boolean): Schema.Infer<this['schema']>;
    public processData(data: Schema.InferToProcess<this['schema']>, partial?: boolean): Schema.Infer<this['schema']>;
    public processData(data: any, partial: boolean = false): Schema.Infer<this['schema']> {
        const result: any = {};
        const iterable = partial ? data : this.schema;
        for (const key in iterable) {
            if (!this.isKeyOf(this.schema, key)) throw new Schema.SchemaError(`Unknown property ${String(key)}`);
            const prop = this.schema[key];
            const value = this.isKeyOf(data, key) ? data[key] : undefined;
            result[key] = this.processProperty(value, prop, key, partial);
            if (result[key] === undefined) delete result[key];
        }
        return result;
    }
    /**
     * process the provided data as partial, meaning that it will only validate the provided properties and ignore the rest.
     * this is useful for validating data that is only meant to update a document, where only a subset of the properties are provided.
     * @param data the data to process
     * @returns the processed data
     * @throws schemaError if the data is not valid
     */
    public processPartialData(
        data: Partial<Schema.FlattenToProcess<this['schema']>> & Partial<Schema.InferToProcess<this['schema']>> & Schema.Document,
    ): Partial<Schema.Flatten<this['schema']>> & Partial<Schema.Infer<this['schema']>> & Schema.Document;
    public processPartialData(
        data: Partial<Schema.Flatten<this['schema']>> & Partial<Schema.Infer<this['schema']>> & Schema.Document,
    ): Partial<Schema.Flatten<this['schema']>> & Partial<Schema.Infer<this['schema']>> & Schema.Document;
    public processPartialData(data: any): Partial<Schema.Flatten<this['schema']>> & Partial<Schema.Infer<this['schema']>> & Schema.Document {
        const result: any = {};
        let currentProp: Schema.property | Schema.multiProperty;
        for (const key in data) {
            const value = this.isKeyOf(data, key) ? data[key] : undefined;

            const subKeys = key.split('.');
            const firstKey = subKeys.shift();
            if (!firstKey || !(firstKey in this.schema)) throw new Schema.SchemaError(`Unknown property ${firstKey}`);

            currentProp = this.schema[firstKey];

            let usedKeys: string[] = []

            for (const subKey of subKeys) {
                if ('union' in currentProp) {
                    const fount = currentProp.union.find(p => p.type === 'object' && subKey in p.properties);
                    if (!fount) throw new Schema.SchemaError(`Property ${subKey} not found in any union type at ${key}`);
                    currentProp = fount;
                } else if (currentProp.type === 'object') {
                    if (!(subKey in currentProp.properties)) throw new Schema.SchemaError(`Unknown property ${subKey} at ${key}`);
                    currentProp = currentProp.properties[subKey];
                } else throw new Schema.SchemaError(`Property ${firstKey}.${usedKeys.join('.')} is not an object, cannot access sub-property ${subKey}`);
            }
            result[key] = this.processProperty(value, currentProp, key);
            if (result[key] === undefined) delete result[key];
        }
        return result;
    }
    /**
     * process a property
     * @param data the data to process
     * @param prop the property to process
     * @param key the key of the property
     * @param partial if the data is partial
     * @returns the processed data
     * @throws schemaError if the data is not valid
     */
    protected processProperty(data: any, prop: Schema.property | Schema.multiProperty, key: string, partial: boolean = false): any {
        if (data === undefined || data === null) {
            if ('default' in prop) return prop.default;
            if (prop.nullable) return null;
            if (prop.required) throw new Schema.SchemaError(`Property ${key} is required but not provided`);
            return undefined;
        }

        if ('union' in prop) {
            for (const subProp of prop.union) {
                try { return this.processProperty(data, subProp, key, true); }
                catch { continue; }
            }
            throw new Schema.SchemaError(`Property ${key} does not match any of the allowed types in the union`);
        }

        switch (prop.type) {
            case 'string': Schema.Validator.validateString(data, prop, key); return data;
            case 'number': Schema.Validator.validateNumber(data, prop, key); return data;
            case 'boolean': Schema.Validator.validateBoolean(data, prop, key); return data;
            case 'array': Schema.Validator.validateArray(data, prop, key); return this.processArray(data, prop, key);
            case 'object': Schema.Validator.validateObject(data, prop, key); return this.processObject(data, prop, key, partial);
            default: throw new Schema.SchemaError(`Unknown type in property ${key}`);
        }
    }
    /**
     * validate a array
     * @param value the value to validate
     * @param prop the property to validate
     * @param key the key of the property
     * @returns the data
     * @throws schemaError if the data is not valid
     */
    protected processArray(value: any[], prop: Schema.Property.Array, key: string): any {
        try { return value.map((item, index) =>  this.processProperty(item, prop.items, `${key}[${index}]`)); }
        catch (error) { throw new Schema.SchemaError(`Property ${key} is not valid: ${error}`); }
    }
    /**
     * validate a object
     * @param value the value to validate
     * @param prop the property to validate
     * @param key the key of the property
     * @returns the data
     * @throws schemaError if the data is not valid
     */
    protected processObject(value: any, prop: Schema.Property.Object, key: string, partial: boolean = false): any {
        const handler = new Schema(prop.properties);
        try { return handler.processData(value, partial); }
        catch (error) { throw new Schema.SchemaError(`Property ${key} is not valid: ${error}`); }
    }
    /**
     * validate a array
     * @param value the value to validate
     * @param prop the property to validate
     * @param key the key of the property
     * @throws schemaError if the data is not valid
     */
    protected validateArray(value: any, prop: Schema.Property.Array, key: string) {
        if (value == null && prop.nullable === true) return;
        if (!Array.isArray(value)) throw new Schema.SchemaError(`Property ${key} must be an array`);
        if (prop.minimum !== undefined && value.length < prop.minimum) {
            throw new Schema.SchemaError(`Property ${key} must have at least ${prop.minimum} items`);
        }
        if (prop.maximum !== undefined && value.length > prop.maximum) {
            throw new Schema.SchemaError(`Property ${key} must have at most ${prop.maximum} items`);
        }
    }
    /**
     * generate a list of unique keys
     * @param doc the schema to validate
     * @param parentKey the parent key of the schema
     * @returns a list of unique keys
    */
    protected listUniques(doc?: Schema.Schema, parentKey?: string): string[] {
        const useDoc = doc ?? this.schema;
        return Schema.Introspection.listUniques(useDoc, parentKey);
    }
    /**
     * convert a schema to a JSON schema
     * @param schema the schema to convert
     * @returns the JSON schema
    */
    protected toJsonSchema(schema?: Schema.Schema): Schema.JSONSchema.schema {
        const useSchema = schema ?? this.schema;
        return Schema.Introspection.toJsonSchema(useSchema);
    }
    /**
     * -- TYPE GUARD --
     * verify if the key is in the schema
     * @param doc the object to verify
     * @param key the key to verify
     * @returns true if the key is in the schema
     */
    private isKeyOf<T extends Object>(
        doc: T,
        key: any
    ): key is keyof T { return key in doc; }
}

export namespace Schema {
    export import SchemaError = _SchemaError;
    export import JSONSchema = _JSONSchema;
    export import Introspection = _Introspection;
    export import Validator = _Validator;

    export type Infer<S extends Schema> = Schema.Infer.schema<S>;
    export type InferToProcess<S extends Schema> = Schema.Infer.schemaToProcess<S>;
    export type Flatten<S extends Schema.Schema> = (
        Flatten.Object<Infer.schema<S>, 10>
    );
    export type FlattenToProcess<S extends Schema.Schema> = (
        Flatten.Object<Infer.schemaToProcess<S>, 10>
    );
    export interface Document {
        [Key: string]: any;
    }
    export interface TypeMap {
        string: string;
        number: number;
        boolean: boolean;
        object: any;
        array: any[];
    }
    export namespace Helper {
        type IsItemRequired<T> = T extends { required: true } ? true : false;
        type IsItemDefault<T> =  T extends { default: any }   ? true : false;
        type IsItemNullable<T> = T extends { nullable: true } ? true : false;

        export type IsRequired<T> =   T extends { required: true } ? true : false;
        export type HasDefault<T> =   T extends { default: any } ? true : false;
        export type IsNullable<T> =   T extends { nullable: true } ? true : false;
        export type DefaultValue<T> = T extends { default: infer D } ? D : never;

        export type Prettify<T> = { [K in keyof T]: T[K] } & {};
    }
    export namespace Property {
        interface Base<T extends keyof TypeMap> {
            type: T;
            required?: boolean;
            nullable?: boolean;
            unique?: boolean;
            default?: TypeMap[T] | null;
        }
        export interface String extends Base<'string'> {
            enum?: readonly string[];
            pattern?: RegExp;
            minLength?: number;
            maxLength?: number;
        }
        export interface Number extends Base<'number'> {
            minimum?: number;
            maximum?: number;
        }
        export interface Boolean extends Base<'boolean'> {}
        export interface Object extends Base<'object'> {
            properties: Schema;
        }
        export interface Array extends Base<'array'> {
            items: property;
            minimum?: number;
            maximum?: number;
        }
        export interface Map {
            string: String;
            number: Number;
            boolean: Boolean;
            object: Object;
            array: Array;
        }
    }
    export type property = Property.Map[keyof Property.Map];
    export interface multiProperty<T extends property = property> {
        union: T[];
        required?: boolean;
        nullable?: boolean;
        unique?: boolean;
        default?: Infer.propertyType<T, 'complete'> | null;
    }
    export interface Schema {
        [Key: string]: property | multiProperty<any>;
    }
    export namespace Infer {
        export type Mode = 'partial' | 'process' | 'complete';

        type ObjectByMode<S extends Schema.Schema, M extends Mode> = (
            M extends 'process'
                ? schemaToProcess<S>
                : M extends 'partial'
                    ? schemaPartial<S>
                    : schema<S>
        );

        export type propertyType<P extends Schema.property, M extends Mode = 'complete'> = (
            P extends Property.String
                ? P extends { enum: readonly (infer E extends string)[] }
                    ? E
                    : string
                :
            P extends Property.Number  ? number  :
            P extends Property.Boolean ? boolean :
            P extends Property.Object
            ? ( ObjectByMode<P['properties'], M> )
            : P extends Property.Array
                ? propertyType<P['items'], M>[]
                :never
        );


        export type BaseType<P extends Schema.property | Schema.multiProperty, M extends Mode = 'complete'> = (
            P extends { union: infer U extends Schema.property[] }
                ? propertyType<U[number], M>
                : P extends Schema.property
                    ? propertyType<P, M>
                    : never
        );
        export type property<P extends Schema.property | Schema.multiProperty, M extends Mode = 'complete'> = (
            Helper.HasDefault<P> extends true
                ? (Helper.DefaultValue<P> extends null ? BaseType<P, M> | null : BaseType<P, M>)
                : Helper.IsRequired<P> extends true
                    ? (Helper.IsNullable<P> extends true ? BaseType<P, M> | null : BaseType<P, M>)
                    : (Helper.IsNullable<P> extends true ? BaseType<P, M> | null : BaseType<P, M> | undefined)
        );

        type MapProperty<P extends Schema.property | Schema.multiProperty, M extends Mode> = property<P, M>;





        type RequiredKeys<S extends Schema> = {
            [K in keyof S]: Helper.IsRequired<S[K]> extends true
                ? K
                : Helper.HasDefault<S[K]> extends true
                    ? K
                    : never;
        }[keyof S];

        type OptionalKeys<S extends Schema> = Exclude<keyof S, RequiredKeys<S>>;

        type RequiredToProcessKeys<S extends Schema> = {
            [K in keyof S]: Helper.IsRequired<S[K]> extends true
                ? Helper.HasDefault<S[K]> extends false ? K : never
                : never;
        }[keyof S];

        type OptionalToProcessKeys<S extends Schema> = Exclude<keyof S, RequiredToProcessKeys<S>>;

        export type schema<S extends Schema> = Helper.Prettify<{
            [K in RequiredKeys<S>]: MapProperty<S[K], 'complete'>;
        } & {
            [K in OptionalKeys<S>]?: MapProperty<S[K], 'complete'>;
        }>;
        export type schemaToProcess<S extends Schema> = Helper.Prettify<{
            [K in RequiredToProcessKeys<S>]: MapProperty<S[K], 'process'>;
        } & {
            [K in OptionalToProcessKeys<S>]?: MapProperty<S[K], 'process'>;
        }>;
        export type schemaPartial<S extends Schema> = Helper.Prettify<{
            [K in keyof S]?: MapProperty<S[K], 'partial'>;
        }>;
        export type schemaBase<S extends Schema> = {
            [K in keyof S]: MapProperty<S[K], 'complete'>;
        };
    }
    const x = {
        numberAndString: {
            union: [
                { type: 'number' },
                { type: 'string' }
            ], nullable: true
        },
        a: { type: 'string', default: 'world' }
    } satisfies Schema.Schema;
    type xType = Infer.schema<typeof x>;
    //   ^?
    type xTPType = Infer.schemaToProcess<typeof x>;
    //   ^?
}
export default Schema;
