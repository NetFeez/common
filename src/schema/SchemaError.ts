/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Defines a custom error class for handling schema-related errors in the schema validation and processing system.
 * This class extends the built-in Error class and provides a specific name for schema errors, allowing for more precise error handling in applications that utilize the schema system.
 * @module @NetFeez/common
 * @license Apache-2.0
 */

export class SchemaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'schemaError';
    }
}
export namespace SchemaError {}
export default SchemaError;