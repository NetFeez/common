/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Provides utilities for validating the structure of a schema, ensuring that property definitions are consistent and valid according to their types and constraints.
 * This includes validating default values against their property definitions, as well as validating nested objects and arrays within the schema.
 * @module @NetFeez/common
 * @license Apache-2.0
 */
import type { Schema } from './Schema.js';
export declare class Validator {
    /**
     * Validates the structure of a schema, used for validating the structure of a schema and nested objects.
     * @param schema The schema to validate
     * @param parentKey The parent key of the schema, used for error messages
     */
    static validateStructure(properties: Schema.PropertyMap, parentKey?: string): void;
    /**
     * Validates a property definition, used for validating the structure of a schema and nested objects.
     * @param prop The property definition to validate
     * @param key The key of the property, used for error messages
     */
    static validateProperty(prop: Schema.Property | Schema.MultiProperty, key: string): void;
    /**
     * Validates a default value against a property definition, used for validating default values.
     * @param prop The property definition to validate against
     * @param key The key of the property, used for error messages
     */
    static validateDefaultValue(prop: Schema.Property | Schema.MultiProperty, key: string): void;
    /**
     * Validates a string property definition, used for validating nested objects.
     * @param prop The string property definition to validate
     * @param key The key of the property, used for error messages
     */
    static validateStringProperty(prop: Schema.Definition.String, key: string): void;
    /**
     * Validates a number property definition, used for validating nested objects.
     * @param prop The number property definition to validate
     * @param key The key of the property, used for error messages
     */
    static validateNumberProperty(prop: Schema.Definition.Number, key: string): void;
    /**
     * Validates an array property definition, used for validating nested arrays.
     * @param prop The array property definition to validate
     * @param key The key of the property, used for error messages
     */
    static validateArrayProperty(prop: Schema.Definition.Array, key: string): void;
    /**
     * Validates an object property definition, used for validating nested objects.
     * @param prop The object property definition to validate
     * @param key The key of the property, used for error messages
     */
    static validateObjectProperty(prop: Schema.Definition.Object, key: string): void;
    /**
     * Validates a string value against a string property definition, used for validating default values and nested objects.
     * @param value The value to validate
     * @param prop The string property definition to validate against
     * @param key The key of the property, used for error messages
     */
    static validateString(value: string, prop: Schema.Definition.String, key: string): void;
    /**
     * Validates a number value against a number property definition, used for validating default values.
     * @param value The value to validate
     * @param prop The number property definition to validate against
     * @param key The key of the property, used for error messages
     */
    static validateNumber(value: number, prop: Schema.Definition.Number, key: string): void;
    /**
     * Validates a boolean value against a boolean property definition, used for validating default values.
     * @param value The value to validate
     * @param prop The boolean property definition to validate against
     * @param key The key of the property, used for error messages
     */
    static validateBoolean(value: boolean, prop: Schema.Definition.Boolean, key: string): void;
    /**
     * Validates an object value against an object property definition, used for validating default values and nested objects.
     * @param value The value to validate
     * @param prop The object property definition to validate against
     * @param key The key of the property, used for error messages
     */
    static validateObject(value: any, prop: Schema.Definition.Object, key: string): void;
    /**
     * Validates an array value against an array property definition, used for validating default values and array items.
     * @param value The value to validate
     * @param prop The array property definition to validate against
     * @param key The key of the property, used for error messages
     */
    static validateArray(value: any, prop: Schema.Definition.Array, key: string): void;
    /**
     * Validates a value against a property definition, used for validating default values and array items.
     * @param value The value to validate
     * @param prop The property definition to validate against
     * @param key The key of the property, used for error messages
     */
    static validateValue(value: any, prop: Schema.Property | Schema.MultiProperty, key: string): void;
}
export declare namespace Validator { }
export default Validator;
