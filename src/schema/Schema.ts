/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Provides a comprehensive schema validation and processing system, allowing developers to define complex data structures.
 * @license Apache-2.0
 */
import Flatten from '../Flatten.js';

import Introspection from './Introspection.js';
import SchemaError from './SchemaError.js';
import JSONSchema from './JSONSchema.js';
import Validator from './Validator.js';

export { JSONSchema, Validator, Introspection, Flatten, SchemaError };

export class Schema<
    const ROOT extends Schema.Property | Schema.MultiProperty
> {
    constructor(
        public readonly root: ROOT
    ) { Validator.validateProperty(root, 'root'); }
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
    public get infer(): Schema.Infer<this['root']> { return {} as any; }
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
    public get inferToProcess(): Schema.InferToProcess<this['root']> { return {} as any; }
    /**
     * get the json schema as an object
     * @returns the json schema
     */
    public get jsonSchema(): JSONSchema.schema { return this.toJsonSchema(); }
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
    public processData(data: Schema.Infer<this['root']>, partial?: boolean): Schema.Infer<this['root']>;
    public processData(data: Schema.InferToProcess<this['root']>, partial?: boolean): Schema.Infer<this['root']>;
    public processData(data: any, partial?: boolean): Schema.Infer<this['root']> {
        return this.processProperty(data, this.root, 'root', partial);
    }
    /**
     * process the provided data without type information, treating it as unknown.
     * This is useful for cases where the input data is not already typed (e.g., after parsing JSON) and you want to validate and process it according to the schema.
     * @param data the unknown data to process
     * @param partial if the data is partial
     * @returns the processed data with the correct type according to the schema
     * @throws schemaError if the data is not valid according to the schema
     */
    public processUnknown(data: any, partial?: boolean): Schema.Infer<this['root']> {
        return this.processProperty(data, this.root, 'root', partial);
    }
    /**
     * process the provided data as partial, meaning that it will only validate the provided properties and ignore the rest.
     * this is useful for validating data that is only meant to update a document, where only a subset of the properties are provided.
     * @param data the data to process
     * @returns the processed data
     * @throws schemaError if the data is not valid
     */
    public processPartialData(data: Schema.Utils.PartialFilter<this['root']>): Schema.Utils.PartialFilter<this['root']>;
    public processPartialData(data: any): Schema.Utils.PartialFilter<this['root']> {
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
    protected navigatePath(path: string): Schema.Utils.NavigationResult {
        const subKeys = path.split('.');
        const firstKey = subKeys.shift();

        if (!firstKey) throw new SchemaError(`Invalid path: ${path}`);
        const root = this.root;
        let currentProp: Schema.Property | Schema.MultiProperty;
        if ('union' in root) {
            let found: Schema.Property | Schema.MultiProperty | undefined;
            for (const prop of root.union) {
                if (prop.type !== 'object') continue;
                if (!prop.properties) return { prop, isOpen: true };
                if (firstKey in prop.properties) { 
                    found = prop.properties[firstKey]; 
                    break; 
                }
            } if (!found) throw new SchemaError(`Property "${firstKey}" not found in any union type at root`);
            currentProp = found;
        } else if (root.type === 'object') {
            if (!root.properties) return { prop: root, isOpen: true };
            if (!(firstKey in root.properties)) throw new SchemaError(`Unknown property "${firstKey}" at root`);
            currentProp = root.properties[firstKey];
        } else throw new SchemaError(`Root property is not an object, cannot access sub-property "${firstKey}"`);

        let usedKeys: string[] = [];
        let isOpen = false;

        for (const subKey of subKeys) {
            if ('union' in currentProp) {
                let foundChild: Schema.Property | Schema.MultiProperty | undefined;
                let openObjectFound: Schema.Definition.Object | undefined;

                for (const p of currentProp.union) {
                    if (p.type !== 'object') continue;
                    if (!p.properties) { openObjectFound = p; continue; }
                    if (subKey in p.properties) { foundChild = p.properties[subKey]; break; }
                }

                if (foundChild) currentProp = foundChild;
                else if (openObjectFound) { currentProp = openObjectFound; isOpen = true; break;}
                else throw new SchemaError(`Property ${subKey} not found in any union type at ${path}`);
            } else if (currentProp.type === 'object') {
                if (!currentProp.properties) { isOpen = true; break; }
                if (!(subKey in currentProp.properties)) throw new SchemaError(`Unknown property ${subKey} at ${path}`);
                currentProp = currentProp.properties[subKey];
            } else throw new SchemaError(`Property ${firstKey}${usedKeys.length ? '.' + usedKeys.join('.') : ''} is not an object, cannot access sub-property ${subKey}`);
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
            throw new SchemaError(`Property ${key} does not match any of the allowed types in the union`);
        } else if (prop.type !== 'object' || !prop.properties) {
            if (prop.nullable) return null;
            if (prop.required) throw new SchemaError(`Property ${key} is required but not provided`);
        } else {
            if (!prop.properties) return {};
            const handler = new Schema(prop);
            const result: any = {};
            for (const subKey in prop.properties) {
                const subProp = prop.properties[subKey];
                const value = handler.applyDefaults(subProp, `${key}.${subKey}`);
                if (value !== undefined) result[subKey] = value;
            } return result;
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
            if (data === null) {
                if (prop.nullable) return null;
                else throw new SchemaError(`Property ${key} is not nullable but null was provided`);
            }
            return this.applyDefaults(prop, key);
        }
        if ('union' in prop) {
            for (const subProp of prop.union) {
                try { return this.processProperty(data, subProp, key, true); }
                catch { continue; }
            }
            throw new SchemaError(`Property ${key} does not match any of the allowed types in the union`);
        }

        switch (prop.type) {
            case 'string':  Validator.validateString(data, prop, key); return data;
            case 'number':  Validator.validateNumber(data, prop, key); return data;
            case 'boolean': Validator.validateBoolean(data, prop, key); return data;
            case 'array':   Validator.validateArray(data, prop, key); return this.processArray(data, prop, key);
            case 'object':  Validator.validateObject(data, prop, key); return this.processObject(data, prop, key, partial);
            default: throw new SchemaError(`Unknown type in property ${key}`);
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
    protected processArray(value: any[], prop: Schema.Definition.Array, key: string): any {
        try { return value.map((item, index) =>  this.processProperty(item, prop.items, `${key}[${index}]`)); }
        catch (error) { throw new SchemaError(`Property ${key} is not valid: ${error}`); }
    }
    /**
     * validate a object
     * @param value the value to validate
     * @param prop the property to validate
     * @param key the key of the property
     * @returns the data
     * @throws schemaError if the data is not valid
     */
    protected processObject(value: any, prop: Schema.Definition.Object, key: string, partial: boolean = false): any {
        if (!prop.properties) return value;

        const processed: any = {};
        const properties = prop.properties;

        for (const subKey in properties) {
            const subProp = properties[subKey];
            const subValue = value[subKey];
            
            const result = this.processProperty(subValue, subProp, `${key}.${subKey}`, partial);
            if (result !== undefined) processed[subKey] = result;
        }

        if (prop.allowAdditionalProperties === true) {
            return { ...value, ...processed };
        } else if (prop.allowAdditionalProperties === false) {
            for (const k in value) {
                if (!(k in properties)) {
                    throw new SchemaError(`Unknown property "${k}" at ${key}`);
                }
            }
        } else return processed;
    }
    /**
     * validate a array
     * @param value the value to validate
     * @param prop the property to validate
     * @param key the key of the property
     * @throws schemaError if the data is not valid
     */
    protected validateArray(value: any, prop: Schema.Definition.Array, key: string) {
        if (value == null && prop.nullable === true) return;
        if (!Array.isArray(value)) throw new SchemaError(`Property ${key} must be an array`);
        if (prop.minimum !== undefined && value.length < prop.minimum) {
            throw new SchemaError(`Property ${key} must have at least ${prop.minimum} items`);
        }
        if (prop.maximum !== undefined && value.length > prop.maximum) {
            throw new SchemaError(`Property ${key} must have at most ${prop.maximum} items`);
        }
    }
    /**
     * generate a list of unique keys
     * @param doc the schema to validate
     * @param parentKey the parent key of the schema
     * @returns a list of unique keys
    */
    protected listUniques(schema?: Schema<Schema.Property | Schema.MultiProperty>, parentKey?: string): string[] {
        const use = schema?.root ?? this.root;
        return Introspection.listUniques(use, parentKey);
    }
    /**
     * convert a schema to a JSON schema
     * @param schema the schema to convert
     * @returns the JSON schema
    */
   protected toJsonSchema(schema?: Schema<Schema.Property | Schema.MultiProperty>): JSONSchema.schema {
       const use = schema?.root ?? this.root;
        return Introspection.toJsonSchema(use);
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
    /**
     * create a schema from an object definition
     * @param obj the object definition to create the schema from
     * @param allowAdditionalProperties whether to allow additional properties in objects (default: undefined, which means it will be determined by the presence of the 'properties' field in object definitions)
     * @returns a new Schema instance based on the provided object definition
     */
    public static fromObject<const T extends Schema.PropertyMap>(obj: T): Schema.Utils.FromObject<T, undefined>;
    public static fromObject<const T extends Schema.PropertyMap, const A extends boolean>(obj: T,allowAdditionalProperties: A): Schema.Utils.FromObject<T, A>;
    public static fromObject(obj: Schema.PropertyMap, allowAdditionalProperties?: boolean): Schema<any> {
        return new Schema({ type: 'object', properties: obj, allowAdditionalProperties });
    }
}

const x = Schema.fromObject({
    name: { type: 'string', required: true },
    age: { type: 'number', default: 18 },
}, true);
const y = x.infer;

export namespace Schema {
    export interface Document { [Key: string]: any; }
    
    export interface TypeMap {
        string: string;
        number: number;
        boolean: boolean;
        object: any;
        array: any[];
    }

    //
    // ====== DEFINITIONS ======
    //
    export namespace Definition {
        export interface Base<T extends keyof TypeMap> {
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
            properties?: Map;
            allowAdditionalProperties?: boolean;
        }

        export interface Array extends Base<'array'> {
            items: Property;
            minimum?: number;
            maximum?: number;
        }

        /**
         * Represents a mapping of property keys to their definitions, used for defining the structure of objects within the schema.
         * Each key corresponds to a property name, and its value is either a simple property definition (String, Number, Boolean, Object, Array) or a MultiProperty definition that allows for unions of multiple types.
         * This structure is essential for defining nested objects and complex data structures within the schema.
         */
        export interface Map {
            [Key: string]: Property | MultiProperty;
        }

        /**
         * Represents a simple property definition, which can be one of the basic types (String, Number, Boolean, Object, Array) with additional validation rules and metadata.
         * This type is used to define the properties of objects within the schema, specifying their type, whether they are required, nullable, unique, and any default values or constraints.
         */
        export type Property = String | Number | Boolean | Object | Array;

        /**
         * Represents a multi-property definition, which allows for defining a property that can be one of several types (a union). This is useful for cases where a property can accept multiple types of values.
         * A MultiProperty contains a 'union' field, which is an array of simple property definitions (String, Number, Boolean, Object, Array). It can also include metadata such as whether the property is required, nullable, unique, and any default values.
         * This type is essential for defining flexible schemas that can accommodate different types of data for a single property.
         */
        export interface MultiProperty<T extends Property = Property> {
            union: T[];
            required?: boolean;
            nullable?: boolean;
            unique?: boolean;
            default?: Infer.GetBaseType<T, 'complete'> | null;
        }
    }

    //
    // ====== Shortcuts for definitions ======
    //
    export type Property = Definition.Property;
    export type MultiProperty = Definition.MultiProperty;
    export type PropertyMap = Definition.Map;

    //
    // ====== INFERENCE LOGIC ======
    //
    export namespace Infer {
        export type Mode = 'partial' | 'process' | 'complete';

        /**
         * Get the TypeScript type corresponding to a given property definition, taking into account unions, nullability, and default values.
         * This type recursively resolves the structure of the property, including nested objects and arrays, to produce the final inferred type that represents the shape of the data defined by the schema.
         * @param P - The property definition to infer the type from.
         * @param M - The mode of inference (complete, process, partial) that determines how required and optional properties are treated.
         * @returns - The inferred TypeScript type corresponding to the property definition.
         */
        export type GetPropertyType<P extends Property, M extends Mode = 'complete'> = (
            P extends Definition.String ? (P extends { enum: readonly (infer E extends string)[] } ? E : string)
            : P extends Definition.Number ? number
            : P extends Definition.Boolean ? boolean
            : P extends Definition.Object ? (
                P['properties'] extends PropertyMap 
                    ? (Mapping.Resolve<P['properties'], M> & (P['allowAdditionalProperties'] extends true ? { [key: string]: any } : {}))
                    : Record<string, any>
            )
            : P extends Definition.Array ? GetPropertyType<P['items'], M>[]
            : never
        );

        /**
         * Get the base type of a property, which is the underlying type without considering nullability, optionality, or default values.
         * This is used as a helper type for the main Wrap type to determine the core type of a property before applying additional logic for nullability and defaults.
         * - If the property is a union, it will recursively extract the base types of all members of the union and produce a union of those types. If it's a simple property, it will directly infer its type using GetPropertyType.         * @param P - The property definition to extract the base type from, which can be either a simple property or a multi-property (union).
         * @param M - The mode of inference (complete, process, partial) that determines how required and optional properties are treated.
         * @returns - The base TypeScript type corresponding to the property definition, without considering nullability or default values.
         */
        export type GetBaseType<P extends Property | MultiProperty, M extends Mode = 'complete'> = (
            P extends { union: infer U extends Property[] }
                ? GetPropertyType<U[number], M>
                : P extends Property ? GetPropertyType<P, M>
                : never
        );
        type GetModifier<P extends Property | MultiProperty, M extends Mode> = 
            M extends 'partial' ? undefined :
            M extends 'process' ? 
                (Utils.IsRequired<P> extends true 
                    ? (Utils.HasDefault<P> extends true ? undefined : never) 
                    : undefined) :
            (Utils.IsRequired<P> extends true 
                ? never 
                : (Utils.HasDefault<P> extends true ? never : undefined));
        /**
         * Apply nullability, optionality, and default value logic to a property type based on its definition and the current mode (complete, process, partial).
         * - If the property has a default value, it's considered required (but can be null if the default is null).
         * - If the property is marked as required, it's non-optional (but can be null if nullable).
         * - If the property is not required, it's optional (but can be null if nullable).
         * The 'process' mode treats all properties as if they are being processed (i.e., before defaults are applied), while 'complete' mode reflects the final inferred type after processing. 'partial' mode makes all properties optional regardless of their definition.
         * @param P - The property definition to evaluate
         * @param M - The mode of inference (complete, process, partial)
         * @returns - The resulting type after applying nullability, optionality, and default logic
         */
        export type Wrap<P extends Property | MultiProperty, M extends Mode = 'complete'> = [
            GetBaseType<P, M>
            | (Utils.IsNullable<P> extends true ? null : never)
            | GetModifier<P, M>
        ][0];

        //
        // ====== INTERNAL MAPPING LOGIC ======
        //
        export namespace Mapping {
            type KeysRequired<PMap extends PropertyMap> = {
                [K in keyof PMap]: Utils.IsRequired<PMap[K]> extends true ? K : (Utils.HasDefault<PMap[K]> extends true ? K : never);
            }[keyof PMap];

            type KeysOptional<PMap extends PropertyMap> = Exclude<keyof PMap, KeysRequired<PMap>>;

            type KeysRequiredToProcess<PMap extends PropertyMap> = {
                [K in keyof PMap]: Utils.IsRequired<PMap[K]> extends true ? (Utils.HasDefault<PMap[K]> extends false ? K : never) : never;
            }[keyof PMap];

            export type Resolve<PMap extends PropertyMap, M extends Mode> = 
                M extends 'process' ? Utils.Prettify<{ [K in KeysRequiredToProcess<PMap>]: Wrap<PMap[K], 'process'> } & { [K in Exclude<keyof PMap, KeysRequiredToProcess<PMap>>]?: Wrap<PMap[K], 'process'> }>
                : M extends 'partial' ? Utils.Prettify<{ [K in keyof PMap]?: Wrap<PMap[K], 'partial'> }>
                : Utils.Prettify<{ [K in KeysRequired<PMap>]: Wrap<PMap[K], 'complete'> } & { [K in KeysOptional<PMap>]?: Wrap<PMap[K], 'complete'> }>;
        }
        export type Core<P extends Property | MultiProperty, M extends Mode> = (
            P extends Definition.Object
                ? (
                    P['properties'] extends PropertyMap
                        ? (Mapping.Resolve<P['properties'], M> & (P['allowAdditionalProperties'] extends true ? { [key: string]: any } : {}))
                        : Record<string, any>
                )
                : Wrap<P, M>
        );
        //
        // ====== PUBLIC INFER TYPES ======
        //
        export type Schema<P extends Property | MultiProperty> = Core<P, 'complete'>;
        export type ToProcess<P extends Property | MultiProperty> = Core<P, 'process'>;
        export type test<P extends Property | MultiProperty> = Core<P, 'process'>;
    }

    //
    // ====== UTILS ======
    //
    export namespace Utils {
        export type IsRequired<T> = T extends { required: true } ? true : false;
        export type HasDefault<T> = T extends { default: any } ? true : false;
        export type IsNullable<T> = T extends { nullable: true } ? true : false;
        export type DefaultValue<T> = T extends { default: infer D } ? D : never;
        export type Prettify<T> = { [K in keyof T]: T[K] } & {};
        
        export interface NavigationResult {
            prop: Property | MultiProperty;
            isOpen: boolean;
        }
        export type PartialFilter<P extends Property | MultiProperty, I = Partial<Infer<P>>> = (
            I extends object
                ? ( Prettify<I & Flatten.Object<I, 10>> & Document )
                : I
        );
        export type FromObject<T extends PropertyMap, A extends boolean | undefined> = Schema<{ type: 'object'; properties: T; allowAdditionalProperties: A }>;
    }

    //
    // ====== PUBLIC TYPES ======
    //
    export type Infer<P extends Property | MultiProperty> = Infer.Schema<P>;
    export type InferToProcess<P extends Property | MultiProperty> = Infer.ToProcess<P>;
}
export default Schema;