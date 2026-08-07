/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Provides utilities for deep object comparison and manipulation, such as checking for deep equality between objects.
 * This is useful for comparing complex data structures in a way that goes beyond simple reference checks.
 * @module @NetFeez/common
 * @license Apache-2.0
 */
export declare class Object {
    /**
     * Compares two objects recursively for deep equality.
     * @param obj1 - The first object to compare.
     * @param obj2 - The second object to compare.
     * @returns true if the objects are deeply equal, false otherwise.
     */
    static deepEqual(obj1: any, obj2: any): boolean;
}
export declare namespace Object { }
export default Object;
