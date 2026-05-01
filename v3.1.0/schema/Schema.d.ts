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
export declare class Schema<const ROOT extends Schema.Property | Schema.MultiProperty> {
    readonly root: ROOT;
    constructor(root: ROOT);
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
    get infer(): Schema.Infer<this['root']>;
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
    get inferToProcess(): Schema.InferToProcess<this['root']>;
    /**
     * get the json schema as an object
     * @returns the json schema
     */
    get jsonSchema(): JSONSchema.schema;
    /**
     * get the json schema as a JSON string
     * @returns the json schema as a string
     */
    get jsonSchemaJSON(): string;
    /**
     * get the list of unique keys
     * @returns the list of unique keys
     */
    get uniques(): string[];
    /**
     * process the provided data
     * @param data the data to process
     * @param partial if the data is partial
     * @returns the processed data
     * @throws schemaError if the data is not valid
     */
    processData(data: Schema.Infer<this['root']>, partial?: boolean): Schema.Infer<this['root']>;
    processData(data: Schema.InferToProcess<this['root']>, partial?: boolean): Schema.Infer<this['root']>;
    /**
     * process the provided data without type information, treating it as unknown.
     * This is useful for cases where the input data is not already typed (e.g., after parsing JSON) and you want to validate and process it according to the schema.
     * @param data the unknown data to process
     * @param partial if the data is partial
     * @returns the processed data with the correct type according to the schema
     * @throws schemaError if the data is not valid according to the schema
     */
    processUnknown(data: any, partial?: boolean): Schema.Infer<this['root']>;
    /**
     * process the provided data as partial, meaning that it will only validate the provided properties and ignore the rest.
     * this is useful for validating data that is only meant to update a document, where only a subset of the properties are provided.
     * @param data the data to process
     * @returns the processed data
     * @throws schemaError if the data is not valid
     */
    processPartialData(data: Schema.Utils.PartialFilter<this['root']>): Schema.Utils.PartialFilter<this['root']>;
    /**
     * navigate a path in the schema and return the property at the end of the path, along with a boolean indicating if the property is part of an open object (i.e., an object without defined properties, allowing any keys).
     * @param path the path to navigate, using dot notation for nested properties (e.g., "user.address.street")
     * @returns an object containing the property at the end of the path and a boolean indicating if it's part of an open object
     * @throws SchemaError if any part of the path is invalid (e.g., accessing a sub-property of a non-object, or a property that doesn't exist)
     *
     * This method is used internally for processing partial data with dot notation, allowing it to correctly identify properties even when they are nested within unions or open objects.
     */
    protected navigatePath(path: string): Schema.Utils.NavigationResult;
    protected applyDefaults(prop: Schema.Property | Schema.MultiProperty, key: string): any;
    /**
     * process a property
     * @param data the data to process
     * @param prop the property to process
     * @param key the key of the property
     * @param partial if the data is partial
     * @returns the processed data
     * @throws schemaError if the data is not valid
     */
    protected processProperty(data: any, prop: Schema.Property | Schema.MultiProperty, key: string, partial?: boolean): any;
    /**
     * validate a array
     * @param value the value to validate
     * @param prop the property to validate
     * @param key the key of the property
     * @returns the data
     * @throws schemaError if the data is not valid
     */
    protected processArray(value: any[], prop: Schema.Definition.Array, key: string): any;
    /**
     * validate a object
     * @param value the value to validate
     * @param prop the property to validate
     * @param key the key of the property
     * @returns the data
     * @throws schemaError if the data is not valid
     */
    protected processObject(value: any, prop: Schema.Definition.Object, key: string, partial?: boolean): any;
    /**
     * validate a array
     * @param value the value to validate
     * @param prop the property to validate
     * @param key the key of the property
     * @throws schemaError if the data is not valid
     */
    protected validateArray(value: any, prop: Schema.Definition.Array, key: string): void;
    /**
     * generate a list of unique keys
     * @param doc the schema to validate
     * @param parentKey the parent key of the schema
     * @returns a list of unique keys
    */
    protected listUniques(schema?: Schema<Schema.Property | Schema.MultiProperty>, parentKey?: string): string[];
    /**
     * convert a schema to a JSON schema
     * @param schema the schema to convert
     * @returns the JSON schema
    */
    protected toJsonSchema(schema?: Schema<Schema.Property | Schema.MultiProperty>): JSONSchema.schema;
    /**
     * -- TYPE GUARD --
     * verify if the key is in the schema
     * @param doc the object to verify
     * @param key the key to verify
     * @returns true if the key is in the schema
     */
    private isKeyOf;
    /**
     * create a schema from an object definition
     * @param obj the object definition to create the schema from
     * @param allowAdditionalProperties whether to allow additional properties in objects (default: undefined, which means it will be determined by the presence of the 'properties' field in object definitions)
     * @returns a new Schema instance based on the provided object definition
     */
    static fromObject<const T extends Schema.PropertyMap>(obj: T): Schema.Utils.FromObject<T, undefined>;
    static fromObject<const T extends Schema.PropertyMap, const A extends boolean>(obj: T, allowAdditionalProperties: A): Schema.Utils.FromObject<T, A>;
}
export declare namespace Schema {
    interface Document {
        [Key: string]: any;
    }
    interface TypeMap {
        string: string;
        number: number;
        boolean: boolean;
        object: any;
        array: any[];
    }
    namespace Definition {
        interface Base<T extends keyof TypeMap> {
            type: T;
            required?: boolean;
            nullable?: boolean;
            unique?: boolean;
            default?: TypeMap[T] | null;
        }
        interface String extends Base<'string'> {
            enum?: readonly string[];
            pattern?: RegExp;
            minLength?: number;
            maxLength?: number;
        }
        interface Number extends Base<'number'> {
            minimum?: number;
            maximum?: number;
        }
        interface Boolean extends Base<'boolean'> {
        }
        interface Object extends Base<'object'> {
            properties?: Map;
            allowAdditionalProperties?: boolean;
        }
        interface Array extends Base<'array'> {
            items: Property;
            minimum?: number;
            maximum?: number;
        }
        /**
         * Represents a mapping of property keys to their definitions, used for defining the structure of objects within the schema.
         * Each key corresponds to a property name, and its value is either a simple property definition (String, Number, Boolean, Object, Array) or a MultiProperty definition that allows for unions of multiple types.
         * This structure is essential for defining nested objects and complex data structures within the schema.
         */
        interface Map {
            [Key: string]: Property | MultiProperty;
        }
        /**
         * Represents a simple property definition, which can be one of the basic types (String, Number, Boolean, Object, Array) with additional validation rules and metadata.
         * This type is used to define the properties of objects within the schema, specifying their type, whether they are required, nullable, unique, and any default values or constraints.
         */
        type Property = String | Number | Boolean | Object | Array;
        /**
         * Represents a multi-property definition, which allows for defining a property that can be one of several types (a union). This is useful for cases where a property can accept multiple types of values.
         * A MultiProperty contains a 'union' field, which is an array of simple property definitions (String, Number, Boolean, Object, Array). It can also include metadata such as whether the property is required, nullable, unique, and any default values.
         * This type is essential for defining flexible schemas that can accommodate different types of data for a single property.
         */
        interface MultiProperty<T extends Property = Property> {
            union: T[];
            required?: boolean;
            nullable?: boolean;
            unique?: boolean;
            default?: Infer.GetBaseType<T, 'complete'> | null;
        }
    }
    type Property = Definition.Property;
    type MultiProperty = Definition.MultiProperty;
    type PropertyMap = Definition.Map;
    namespace Infer {
        export type Mode = 'partial' | 'process' | 'complete';
        /**
         * Get the TypeScript type corresponding to a given property definition, taking into account unions, nullability, and default values.
         * This type recursively resolves the structure of the property, including nested objects and arrays, to produce the final inferred type that represents the shape of the data defined by the schema.
         * @param P - The property definition to infer the type from.
         * @param M - The mode of inference (complete, process, partial) that determines how required and optional properties are treated.
         * @returns - The inferred TypeScript type corresponding to the property definition.
         */
        export type GetPropertyType<P extends Property, M extends Mode = 'complete'> = (P extends Definition.String ? (P extends {
            enum: readonly (infer E extends string)[];
        } ? E : string) : P extends Definition.Number ? number : P extends Definition.Boolean ? boolean : P extends Definition.Object ? (P['properties'] extends PropertyMap ? (Mapping.Resolve<P['properties'], M> & (P['allowAdditionalProperties'] extends true ? {
            [key: string]: any;
        } : {})) : Record<string, any>) : P extends Definition.Array ? GetPropertyType<P['items'], M>[] : never);
        /**
         * Get the base type of a property, which is the underlying type without considering nullability, optionality, or default values.
         * This is used as a helper type for the main Wrap type to determine the core type of a property before applying additional logic for nullability and defaults.
         * - If the property is a union, it will recursively extract the base types of all members of the union and produce a union of those types. If it's a simple property, it will directly infer its type using GetPropertyType.         * @param P - The property definition to extract the base type from, which can be either a simple property or a multi-property (union).
         * @param M - The mode of inference (complete, process, partial) that determines how required and optional properties are treated.
         * @returns - The base TypeScript type corresponding to the property definition, without considering nullability or default values.
         */
        export type GetBaseType<P extends Property | MultiProperty, M extends Mode = 'complete'> = (P extends {
            union: infer U extends Property[];
        } ? GetPropertyType<U[number], M> : P extends Property ? GetPropertyType<P, M> : never);
        type GetModifier<P extends Property | MultiProperty, M extends Mode> = M extends 'partial' ? undefined : M extends 'process' ? (Utils.IsRequired<P> extends true ? (Utils.HasDefault<P> extends true ? undefined : never) : undefined) : (Utils.IsRequired<P> extends true ? never : (Utils.HasDefault<P> extends true ? never : undefined));
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
            GetBaseType<P, M> | (Utils.IsNullable<P> extends true ? null : never) | GetModifier<P, M>
        ][0];
        export namespace Mapping {
            type KeysRequired<PMap extends PropertyMap> = {
                [K in keyof PMap]: Utils.IsRequired<PMap[K]> extends true ? K : (Utils.HasDefault<PMap[K]> extends true ? K : never);
            }[keyof PMap];
            type KeysOptional<PMap extends PropertyMap> = Exclude<keyof PMap, KeysRequired<PMap>>;
            type KeysRequiredToProcess<PMap extends PropertyMap> = {
                [K in keyof PMap]: Utils.IsRequired<PMap[K]> extends true ? (Utils.HasDefault<PMap[K]> extends false ? K : never) : never;
            }[keyof PMap];
            export type Resolve<PMap extends PropertyMap, M extends Mode> = M extends 'process' ? Utils.Prettify<{
                [K in KeysRequiredToProcess<PMap>]: Wrap<PMap[K], 'process'>;
            } & {
                [K in Exclude<keyof PMap, KeysRequiredToProcess<PMap>>]?: Wrap<PMap[K], 'process'>;
            }> : M extends 'partial' ? Utils.Prettify<{
                [K in keyof PMap]?: Wrap<PMap[K], 'partial'>;
            }> : Utils.Prettify<{
                [K in KeysRequired<PMap>]: Wrap<PMap[K], 'complete'>;
            } & {
                [K in KeysOptional<PMap>]?: Wrap<PMap[K], 'complete'>;
            }>;
            export {};
        }
        export type Core<P extends Property | MultiProperty, M extends Mode> = (P extends Definition.Object ? (P['properties'] extends PropertyMap ? (Mapping.Resolve<P['properties'], M> & (P['allowAdditionalProperties'] extends true ? {
            [key: string]: any;
        } : {})) : Record<string, any>) : Wrap<P, M>);
        export type Schema<P extends Property | MultiProperty> = Core<P, 'complete'>;
        export type ToProcess<P extends Property | MultiProperty> = Core<P, 'process'>;
        export type test<P extends Property | MultiProperty> = Core<P, 'process'>;
        export {};
    }
    namespace Utils {
        type IsRequired<T> = T extends {
            required: true;
        } ? true : false;
        type HasDefault<T> = T extends {
            default: any;
        } ? true : false;
        type IsNullable<T> = T extends {
            nullable: true;
        } ? true : false;
        type DefaultValue<T> = T extends {
            default: infer D;
        } ? D : never;
        type Prettify<T> = {
            [K in keyof T]: T[K];
        } & {};
        interface NavigationResult {
            prop: Property | MultiProperty;
            isOpen: boolean;
        }
        type PartialFilter<P extends Property | MultiProperty, I = Partial<Infer<P>>> = (I extends object ? (Prettify<I & Flatten.Object<I, 10>> & Document) : I);
        type FromObject<T extends PropertyMap, A extends boolean | undefined> = Schema<{
            type: 'object';
            properties: T;
            allowAdditionalProperties: A;
        }>;
    }
    type Infer<P extends Property | MultiProperty> = Infer.Schema<P>;
    type InferToProcess<P extends Property | MultiProperty> = Infer.ToProcess<P>;
}
export default Schema;
