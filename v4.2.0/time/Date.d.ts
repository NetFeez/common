/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Provides a Date class that extends the native JavaScript Date object with additional formatting capabilities, allowing for easy date manipulation and formatting using custom format strings.
 * @module @NetFeez/common
 * @license Apache-2.0
 */
export declare class Date {
    readonly date: globalThis.Date;
    constructor(date?: string | number | globalThis.Date);
    get milliseconds(): string;
    get seconds(): string;
    get minutes(): string;
    get hours(): string;
    get day(): string;
    get month(): string;
    get year(): string;
    /**
     * Formats the date according to the provided format string, replacing placeholders with the corresponding date components.
     * Supported placeholders include:
     * | Placeholder | Description               |
     * |-------------|---------------------------|
     * | {YYYY}      | Full year (e.g., 2024)    |
     * | {MM}        | Month (01-12)             |
     * | {DD}        | Day of the month (01-31)  |
     * | {HH}        | Hours (00-23)             |
     * | {mm}        | Minutes (00-59)           |
     * | {ss}        | Seconds (00-59)           |
     * | {ms}        | Milliseconds (000-999)    |
     * @param format - The format string containing placeholders to be replaced with date components.
     * @returns A formatted date string with the placeholders replaced by their corresponding values.
     */
    format(format: string): string;
    protected static pad(num: number, size?: number): string;
}
export declare namespace Date { }
export default Date;
