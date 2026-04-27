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

export class Schema<const Prop extends Schema.PropertyMap> {
    constructor(
        public readonly properties: Prop
    ) { Schema.Validator.validateStructure(properties); }
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
    public get infer(): Schema.Infer<this['properties']> {
        return {} as Schema.Infer<this['properties']>;
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
    public get inferToProcess(): Schema.InferToProcess<this['properties']> {
        return {} as Schema.InferToProcess<this['properties']>;
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
    public processData(data: Schema.Infer<this['properties']>, partial?: boolean): Schema.Infer<this['properties']>;
    public processData(data: Schema.InferToProcess<this['properties']>, partial?: boolean): Schema.Infer<this['properties']>;
    public processData(data: any, partial: boolean = false): Schema.Infer<this['properties']> {
        const result: any = {};
        const iterable = partial ? data : this.properties;
        for (const key in iterable) {
            if (!this.isKeyOf(this.properties, key)) throw new Schema.SchemaError(`Unknown property ${String(key)}`);
            const prop = this.properties[key];
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
        data: Partial<Schema.FlattenToProcess<this['properties']>> & Partial<Schema.InferToProcess<this['properties']>> & Schema.Document,
    ): Partial<Schema.Flatten<this['properties']>> & Partial<Schema.Infer<this['properties']>> & Schema.Document;
    public processPartialData(
        data: Partial<Schema.Flatten<this['properties']>> & Partial<Schema.Infer<this['properties']>> & Schema.Document,
    ): Partial<Schema.Flatten<this['properties']>> & Partial<Schema.Infer<this['properties']>> & Schema.Document;
    public processPartialData(data: any): Partial<Schema.Flatten<this['properties']>> & Partial<Schema.Infer<this['properties']>> & Schema.Document {
        const result: any = {};

        for (const key in data) {
            const value = this.isKeyOf(data, key) ? data[key] : undefined;
            const { prop, isOpen } = this.navigatePath(key);
            result[key] = isOpen ? value : this.processProperty(value, prop, key);
            if (result[key] === undefined) delete result[key];
        }

        return result;
    }
    /**
     * navigate a path in the schema and return the property at the end of the path, along with a boolean indicating if the property is part of an open object (i.e., an object without defined properties, allowing any keys).
     * @param path the path to navigate, using dot notation for nested properties (e.g., "user.address.street")
     * @returns an object containing the property at the end of the path and a boolean indicating if it's part of an open object
     * @throws SchemaError if any part of the path is invalid (e.g., accessing a sub-property of a non-object, or a property that doesn't exist)
     * 
     * This method is used internally for processing partial data with dot notation, allowing it to correctly identify properties even when they are nested within unions or open objects.
     */
    protected navigatePath(path: string): Schema.NavigationResult {
        const subKeys = path.split('.');
        const firstKey = subKeys.shift();

        if (!firstKey || !(firstKey in this.properties)) throw new Schema.SchemaError(`Unknown property ${firstKey}`);

        let currentProp: Schema.Property | Schema.MultiProperty = this.properties[firstKey];
        let usedKeys: string[] = [];
        let isOpen = false;

        for (const subKey of subKeys) {
            if ('union' in currentProp) {
                let foundChild: Schema.Property | Schema.MultiProperty | undefined;
                let openObjectFound: Schema.Property.Object | undefined;

                for (const p of currentProp.union) {
                    if (p.type !== 'object') continue;
                    if (!p.properties) { openObjectFound = p; continue; }
                    if (subKey in p.properties) { foundChild = p.properties[subKey]; break; }
                }

                if (foundChild) currentProp = foundChild;
                else if (openObjectFound) { currentProp = openObjectFound; isOpen = true; break;}
                else throw new Schema.SchemaError(`Property ${subKey} not found in any union type at ${path}`);
            } else if (currentProp.type === 'object') {
                if (!currentProp.properties) { isOpen = true; break; }
                if (!(subKey in currentProp.properties)) throw new Schema.SchemaError(`Unknown property ${subKey} at ${path}`);
                currentProp = currentProp.properties[subKey];
            } else throw new Schema.SchemaError(`Property ${firstKey}${usedKeys.length ? '.' + usedKeys.join('.') : ''} is not an object, cannot access sub-property ${subKey}`);
            usedKeys.push(subKey);
        }
        return { prop: currentProp, isOpen };
    }
    protected applyDefaults(prop: Schema.Property | Schema.MultiProperty, key: string): any {
        if ('default' in prop) return prop.default;
        if ('union' in prop) {
            for (const subProp of prop.union) {
                try { return this.applyDefaults(subProp, key); }
                catch { continue; }
            }
            if (prop.nullable) return null;
            throw new Schema.SchemaError(`Property ${key} does not match any of the allowed types in the union`);
        } else if (prop.type !== 'object' || !prop.properties) {
            if (prop.nullable) return null;
            if (prop.required) throw new Schema.SchemaError(`Property ${key} is required but not provided`);
        } else {
            if (!prop.properties) return {};
            const handler = new Schema(prop.properties);
            const result: any = {};
            for (const subKey in prop.properties) {
                const subProp = prop.properties[subKey];
                const value = handler.applyDefaults(subProp, `${key}.${subKey}`);
                if (value !== undefined) result[subKey] = value;
            }
            return result;
        }
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
    protected processProperty(data: any, prop: Schema.Property | Schema.MultiProperty, key: string, partial: boolean = false): any {
        if (data === undefined || data === null) {
            if (data === null && prop.nullable) return null;
            return this.applyDefaults(prop, key);
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
        if (!prop.properties) return value;
        const handler = new Schema(prop.properties);
        let processed = handler.processData(value, partial);
        if (prop.allowAdditionalProperties === true) {
            processed = { ...value, ...processed };
        } else if (prop.allowAdditionalProperties === false) {
            for (const k in value) {
                if (!(k in prop.properties)) {
                    throw new Schema.SchemaError(`Unknown property ${k} at ${key}`);
                }
            }
        }
        return processed;
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
    protected listUniques(doc?: Schema.PropertyMap, parentKey?: string): string[] {
        const useDoc = doc ?? this.properties;
        return Schema.Introspection.listUniques(useDoc, parentKey);
    }
    /**
     * convert a schema to a JSON schema
     * @param schema the schema to convert
     * @returns the JSON schema
    */
    protected toJsonSchema(schema?: Schema.PropertyMap): Schema.JSONSchema.schema {
        const useSchema = schema ?? this.properties;
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

    export type Infer<S extends PropertyMap> = Schema.Infer.schema<S>;
    export type InferToProcess<S extends PropertyMap> = Schema.Infer.schemaToProcess<S>;
    export type Flatten<S extends Schema.PropertyMap> = (
        Flatten.Object<Infer.schema<S>, 10>
    );
    export type FlattenToProcess<S extends Schema.PropertyMap> = (
        Flatten.Object<Infer.schemaToProcess<S>, 10>
    );
    export interface NavigationResult {
        prop: Schema.Property | Schema.MultiProperty,
        isOpen: boolean
    }
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
            properties?: PropertyMap;
            allowAdditionalProperties?: boolean
        }
        export interface Array extends Base<'array'> {
            items: Property;
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
    export type Property = Property.Map[keyof Property.Map];
    export interface MultiProperty<T extends Property = Property> {
        union: T[];
        required?: boolean;
        nullable?: boolean;
        unique?: boolean;
        default?: Infer.propertyType<T, 'complete'> | null;
    }
    export interface PropertyMap {
        [Key: string]: Property | MultiProperty;
    }
    export namespace Infer {
        export type Mode = 'partial' | 'process' | 'complete';

        type ObjectByMode<PMap extends Schema.PropertyMap, M extends Mode> = (
            M extends 'process'
                ? schemaToProcess<PMap>
                : M extends 'partial'
                    ? schemaPartial<PMap>
                    : schema<PMap>
        );

        export type propertyType<P extends Schema.Property, M extends Mode = 'complete'> = (
            P extends Property.String
                ? P extends { enum: readonly (infer E extends string)[] }
                    ? E
                    : string
                :
            P extends Property.Number  ? number  :
            P extends Property.Boolean ? boolean :
            P extends Property.Object
            ? (
                P['properties'] extends Schema.PropertyMap 
                    ? (
                        ObjectByMode<P['properties'], M> & ( P['allowAdditionalProperties'] extends true
                            ? { [key: string]: any }
                            : {}
                        )
                    )
                    : Record<string, any>
            )
            : P extends Property.Array
                ? propertyType<P['items'], M>[]
                :never
        );


        export type BaseType<P extends Schema.Property | Schema.MultiProperty, M extends Mode = 'complete'> = (
            P extends { union: infer U extends Schema.Property[] }
                ? propertyType<U[number], M>
                : P extends Schema.Property
                    ? propertyType<P, M>
                    : never
        );
        export type property<P extends Schema.Property | Schema.MultiProperty, M extends Mode = 'complete'> = (
            Helper.HasDefault<P> extends true
                ? (Helper.DefaultValue<P> extends null ? BaseType<P, M> | null : BaseType<P, M>)
                : Helper.IsRequired<P> extends true
                    ? (Helper.IsNullable<P> extends true ? BaseType<P, M> | null : BaseType<P, M>)
                    : (Helper.IsNullable<P> extends true ? BaseType<P, M> | null : BaseType<P, M> | undefined)
        );

        type MapProperty<P extends Schema.Property | Schema.MultiProperty, M extends Mode> = property<P, M>;





        type RequiredKeys<PMap extends PropertyMap> = {
            [K in keyof PMap]: Helper.IsRequired<PMap[K]> extends true
                ? K
                : Helper.HasDefault<PMap[K]> extends true
                    ? K
                    : never;
        }[keyof PMap];

        type OptionalKeys<PMap extends PropertyMap> = Exclude<keyof PMap, RequiredKeys<PMap>>;

        type RequiredToProcessKeys<PMap extends PropertyMap> = {
            [K in keyof PMap]: Helper.IsRequired<PMap[K]> extends true
                ? Helper.HasDefault<PMap[K]> extends false ? K : never
                : never;
        }[keyof PMap];

        type OptionalToProcessKeys<PMap extends PropertyMap> = Exclude<keyof PMap, RequiredToProcessKeys<PMap>>;

        export type schema<PMap extends PropertyMap> = Helper.Prettify<{
            [K in RequiredKeys<PMap>]: MapProperty<PMap[K], 'complete'>;
        } & {
            [K in OptionalKeys<PMap>]?: MapProperty<PMap[K], 'complete'>;
        }>;
        export type schemaToProcess<PMap extends PropertyMap> = Helper.Prettify<{
            [K in RequiredToProcessKeys<PMap>]: MapProperty<PMap[K], 'process'>;
        } & {
            [K in OptionalToProcessKeys<PMap>]?: MapProperty<PMap[K], 'process'>;
        }>;
        export type schemaPartial<PMap extends PropertyMap> = Helper.Prettify<{
            [K in keyof PMap]?: MapProperty<PMap[K], 'partial'>;
        }>;
        export type schemaBase<PMap extends PropertyMap> = {
            [K in keyof PMap]: MapProperty<PMap[K], 'complete'>;
        };
    }
}
export default Schema;
