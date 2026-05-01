/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Provides flatten/unflatten helpers with strong TypeScript typing.
 * @module @NetFeez/common
 * @license Apache-2.0
 */
export declare class Flatten {
    /**
     * Flattens a nested plain-object into dot-notation keys.
     * Non-plain objects (Date, RegExp, Map, Set, etc.) are treated as leaf values.
     * @param object - The object to flatten.
     * @param depth - The maximum depth to flatten (default is 10).
     * @returns A new object with flattened keys.
     */
    static object<T extends Flatten.Document, D extends number = 10>(object: T, depth?: D): Flatten.Object<T, D>;
    /**
     * Unflattens a flattened object back into its original nested structure.
     * @param obj - The flattened object to unflatten.
     * @returns A new object with the original nested structure.
     */
    static unObject<Result extends any = any>(obj: Flatten.Document): Result;
    /**
     * Core recursive function to flatten an object. It handles the actual flattening logic, while the public `object` method provides type safety and a cleaner interface.
     * @param object - The object to flatten.
     * @param depth - The remaining depth to flatten.
     * @param prefix - The current key prefix for nested keys.
     * @returns A flattened object with dot-notation keys.
     */
    private static flattenCore;
    /**
     * Checks if a value is a plain object (i.e., an object created by the Object constructor or with a null prototype). This is used to determine whether to flatten a value or treat it as a leaf.
     * @param value - The value to check.
     * @returns True if the value is a plain object, false otherwise.
     */
    private static isPlainObject;
}
export declare namespace Flatten {
    export type Document = {
        [key: string]: any;
    };
    type Prettify<T> = {
        [K in keyof T]: T[K];
    } & {};
    type Primitive = string | number | boolean | bigint | symbol | null | undefined;
    type Builtin = Primitive | Date | RegExp | Function | Error | Promise<any> | Map<any, any> | Set<any> | WeakMap<any, any> | WeakSet<any>;
    type IsLeaf<T> = T extends Builtin ? true : T extends readonly any[] ? true : string extends keyof T ? true : false;
    type UndefinedToPartial<T extends object> = {
        [K in keyof T as undefined extends T[K] ? never : K]: T[K];
    } & {
        [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
    };
    type UnionToIntersection<U extends object> = ((U extends any ? (arg: U) => void : never) extends (arg: infer I) => void ? I extends object ? {
        [K in keyof I]: I[K] extends object ? UnionToIntersection<I[K]> : I[K];
    } : I : never);
    type DepthTuple<Depth extends number, Current extends 1[] = []> = (number extends Depth ? [1, 1, 1, 1, 1] : Current['length'] extends Depth ? Current : DepthTuple<Depth, [1, ...Current]>);
    type NextDepth<D extends 1[]> = D extends [1, ...infer R extends 1[]] ? R : [];
    type Join<Prefix extends string, Key extends string> = Prefix extends '' ? Key : `${Prefix}.${Key}`;
    type ResourceKeys<T extends Document, D extends 1[] = DepthTuple<5>, Prefix extends string = ''> = {
        [K in Extract<keyof T, string>]-?: (Exclude<T[K], undefined> extends infer U ? IsLeaf<U> extends true ? Join<Prefix, K> : U extends Document ? D extends [] ? Join<Prefix, K> : ResourceKeys<U, NextDepth<D>, Join<Prefix, K>> : Join<Prefix, K> : never);
    }[Extract<keyof T, string>];
    type RecurseObject<T extends Document, Keys extends string> = (Keys extends `${infer K}.${infer Rest}` ? K extends keyof T ? Extract<Exclude<T[K], undefined>, Document> extends infer Nested ? [Nested] extends [never] ? never : (RecurseObject<Nested & Document, Rest> | (undefined extends T[K] ? undefined : never) | (null extends T[K] ? undefined : never)) : never : never : undefined extends T ? Keys extends keyof Exclude<T, undefined> ? Exclude<T, undefined>[Keys] | undefined : never : Keys extends keyof T ? T[Keys] : never);
    export type Object<T extends Document, depth extends number = 5> = Prettify<UndefinedToPartial<{
        [P in ResourceKeys<T, DepthTuple<depth>>]: RecurseObject<T, P>;
    }>>;
    type Split<S extends string, Delimiter extends string> = (S extends `${infer T}${Delimiter}${infer U}` ? [T, ...Split<U, Delimiter>] : [S]);
    type BuildNestedObject<Path extends string[], Value> = (Path extends [infer Head extends string, ...infer Tail extends string[]] ? UndefinedToPartial<{
        [K in Head]: BuildNestedObject<Tail, Value>;
    }> : Value);
    export type UnObject<T extends Document> = Prettify<UnionToIntersection<UndefinedToPartial<({
        [K in keyof T]-?: BuildNestedObject<Split<Extract<K, string>, '.'>, T[K]>;
    }[keyof T])>>>;
    export {};
}
export default Flatten;
