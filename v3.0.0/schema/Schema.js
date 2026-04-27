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
export class Schema {
    root;
    constructor(root) {
        this.root = root;
        Validator.validateProperty(root, 'root');
    }
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
    get infer() { return {}; }
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
    get inferToProcess() { return {}; }
    /**
     * get the json schema as an object
     * @returns the json schema
     */
    get jsonSchema() { return this.toJsonSchema(); }
    /**
     * get the json schema as a JSON string
     * @returns the json schema as a string
     */
    get jsonSchemaJSON() { return JSON.stringify(this.jsonSchema); }
    /**
     * get the list of unique keys
     * @returns the list of unique keys
     */
    get uniques() { return this.listUniques(); }
    processData(data, partial) {
        return this.processProperty(data, this.root, 'root', partial);
    }
    processPartialData(data) {
        const result = {};
        for (const key in data) {
            const value = this.isKeyOf(data, key) ? data[key] : undefined;
            const { prop, isOpen } = this.navigatePath(key);
            result[key] = isOpen ? value : this.processProperty(value, prop, key);
            if (result[key] === undefined)
                delete result[key];
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
    navigatePath(path) {
        const subKeys = path.split('.');
        const firstKey = subKeys.shift();
        if (!firstKey)
            throw new SchemaError(`Invalid path: ${path}`);
        const root = this.root;
        let currentProp;
        if ('union' in root) {
            let found;
            for (const prop of root.union) {
                if (prop.type !== 'object')
                    continue;
                if (!prop.properties)
                    return { prop, isOpen: true };
                if (firstKey in prop.properties) {
                    found = prop.properties[firstKey];
                    break;
                }
            }
            if (!found)
                throw new SchemaError(`Property "${firstKey}" not found in any union type at root`);
            currentProp = found;
        }
        else if (root.type === 'object') {
            if (!root.properties)
                return { prop: root, isOpen: true };
            if (!(firstKey in root.properties))
                throw new SchemaError(`Unknown property "${firstKey}" at root`);
            currentProp = root.properties[firstKey];
        }
        else
            throw new SchemaError(`Root property is not an object, cannot access sub-property "${firstKey}"`);
        let usedKeys = [];
        let isOpen = false;
        for (const subKey of subKeys) {
            if ('union' in currentProp) {
                let foundChild;
                let openObjectFound;
                for (const p of currentProp.union) {
                    if (p.type !== 'object')
                        continue;
                    if (!p.properties) {
                        openObjectFound = p;
                        continue;
                    }
                    if (subKey in p.properties) {
                        foundChild = p.properties[subKey];
                        break;
                    }
                }
                if (foundChild)
                    currentProp = foundChild;
                else if (openObjectFound) {
                    currentProp = openObjectFound;
                    isOpen = true;
                    break;
                }
                else
                    throw new SchemaError(`Property ${subKey} not found in any union type at ${path}`);
            }
            else if (currentProp.type === 'object') {
                if (!currentProp.properties) {
                    isOpen = true;
                    break;
                }
                if (!(subKey in currentProp.properties))
                    throw new SchemaError(`Unknown property ${subKey} at ${path}`);
                currentProp = currentProp.properties[subKey];
            }
            else
                throw new SchemaError(`Property ${firstKey}${usedKeys.length ? '.' + usedKeys.join('.') : ''} is not an object, cannot access sub-property ${subKey}`);
            usedKeys.push(subKey);
        }
        return { prop: currentProp, isOpen };
    }
    applyDefaults(prop, key) {
        if ('default' in prop)
            return prop.default;
        if ('union' in prop) {
            for (const subProp of prop.union) {
                try {
                    return this.applyDefaults(subProp, key);
                }
                catch {
                    continue;
                }
            }
            if (prop.nullable)
                return null;
            throw new SchemaError(`Property ${key} does not match any of the allowed types in the union`);
        }
        else if (prop.type !== 'object' || !prop.properties) {
            if (prop.nullable)
                return null;
            if (prop.required)
                throw new SchemaError(`Property ${key} is required but not provided`);
        }
        else {
            if (!prop.properties)
                return {};
            const handler = new Schema(prop);
            const result = {};
            for (const subKey in prop.properties) {
                const subProp = prop.properties[subKey];
                const value = handler.applyDefaults(subProp, `${key}.${subKey}`);
                if (value !== undefined)
                    result[subKey] = value;
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
    processProperty(data, prop, key, partial = false) {
        if (data === undefined || data === null) {
            if (data === null) {
                if (prop.nullable)
                    return null;
                else
                    throw new SchemaError(`Property ${key} is not nullable but null was provided`);
            }
            return this.applyDefaults(prop, key);
        }
        if ('union' in prop) {
            for (const subProp of prop.union) {
                try {
                    return this.processProperty(data, subProp, key, true);
                }
                catch {
                    continue;
                }
            }
            throw new SchemaError(`Property ${key} does not match any of the allowed types in the union`);
        }
        switch (prop.type) {
            case 'string':
                Validator.validateString(data, prop, key);
                return data;
            case 'number':
                Validator.validateNumber(data, prop, key);
                return data;
            case 'boolean':
                Validator.validateBoolean(data, prop, key);
                return data;
            case 'array':
                Validator.validateArray(data, prop, key);
                return this.processArray(data, prop, key);
            case 'object':
                Validator.validateObject(data, prop, key);
                return this.processObject(data, prop, key, partial);
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
    processArray(value, prop, key) {
        try {
            return value.map((item, index) => this.processProperty(item, prop.items, `${key}[${index}]`));
        }
        catch (error) {
            throw new SchemaError(`Property ${key} is not valid: ${error}`);
        }
    }
    /**
     * validate a object
     * @param value the value to validate
     * @param prop the property to validate
     * @param key the key of the property
     * @returns the data
     * @throws schemaError if the data is not valid
     */
    processObject(value, prop, key, partial = false) {
        if (!prop.properties)
            return value;
        const processed = {};
        const properties = prop.properties;
        for (const subKey in properties) {
            const subProp = properties[subKey];
            const subValue = value[subKey];
            const result = this.processProperty(subValue, subProp, `${key}.${subKey}`, partial);
            if (result !== undefined)
                processed[subKey] = result;
        }
        if (prop.allowAdditionalProperties === true) {
            return { ...value, ...processed };
        }
        else if (prop.allowAdditionalProperties === false) {
            for (const k in value) {
                if (!(k in properties)) {
                    throw new SchemaError(`Unknown property "${k}" at ${key}`);
                }
            }
        }
        else
            return processed;
    }
    /**
     * validate a array
     * @param value the value to validate
     * @param prop the property to validate
     * @param key the key of the property
     * @throws schemaError if the data is not valid
     */
    validateArray(value, prop, key) {
        if (value == null && prop.nullable === true)
            return;
        if (!Array.isArray(value))
            throw new SchemaError(`Property ${key} must be an array`);
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
    listUniques(schema, parentKey) {
        const use = schema?.root ?? this.root;
        return Introspection.listUniques(use, parentKey);
    }
    /**
     * convert a schema to a JSON schema
     * @param schema the schema to convert
     * @returns the JSON schema
    */
    toJsonSchema(schema) {
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
    isKeyOf(doc, key) { return key in doc; }
    static fromObject(obj, allowAdditionalProperties) {
        return new Schema({ type: 'object', properties: obj, allowAdditionalProperties });
    }
}
const x = Schema.fromObject({
    name: { type: 'string', required: true },
    age: { type: 'number', default: 18 },
}, true);
const y = x.infer;
export default Schema;
//# sourceMappingURL=Schema.js.map