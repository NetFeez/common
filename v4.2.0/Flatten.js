/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Provides flatten/unflatten helpers with strong TypeScript typing.
 * @module @NetFeez/common
 * @license Apache-2.0
 */
export class Flatten {
    /**
     * Flattens a nested plain-object into dot-notation keys.
     * Non-plain objects (Date, RegExp, Map, Set, etc.) are treated as leaf values.
     * @param object - The object to flatten.
     * @param depth - The maximum depth to flatten (default is 10).
     * @returns A new object with flattened keys.
     */
    static object(object, depth = 10) {
        return this.flattenCore(object, depth);
    }
    /**
     * Unflattens a flattened object back into its original nested structure.
     * @param obj - The flattened object to unflatten.
     * @returns A new object with the original nested structure.
     */
    static unObject(obj) {
        const result = {};
        for (const key in obj) {
            const value = obj[key];
            const [first, ...rest] = key.split('.');
            if (rest.length === 0)
                result[first] = value;
            else {
                const last = rest.pop();
                const subObj = result[first] ?? {};
                let current = subObj;
                rest.forEach((k) => {
                    current = current[k] ?? (current[k] = {});
                });
                current[last] = value;
                result[first] = subObj;
            }
        }
        return result;
    }
    /**
     * Core recursive function to flatten an object. It handles the actual flattening logic, while the public `object` method provides type safety and a cleaner interface.
     * @param object - The object to flatten.
     * @param depth - The remaining depth to flatten.
     * @param prefix - The current key prefix for nested keys.
     * @returns A flattened object with dot-notation keys.
     */
    static flattenCore(object, depth = 10, prefix = '') {
        const result = {};
        for (const key in object) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            const value = object[key];
            if (depth > 0 && this.isPlainObject(value)) {
                Object.assign(result, this.flattenCore(value, depth - 1, newKey));
            }
            else {
                result[newKey] = value;
            }
        }
        return result;
    }
    /**
     * Checks if a value is a plain object (i.e., an object created by the Object constructor or with a null prototype). This is used to determine whether to flatten a value or treat it as a leaf.
     * @param value - The value to check.
     * @returns True if the value is a plain object, false otherwise.
     */
    static isPlainObject(value) {
        if (value == null || typeof value !== 'object' || Array.isArray(value))
            return false;
        const proto = Object.getPrototypeOf(value);
        return proto === Object.prototype || proto === null;
    }
}
(function (Flatten) {
    ;
})(Flatten || (Flatten = {}));
export default Flatten;
//# sourceMappingURL=Flatten.js.map