/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Provides time-related utilities, including timestamp conversion and date formatting.
 * @module @NetFeez/common
 * @license Apache-2.0
 */

import _Date from './Date.js';

export class Time {
    /**
     * Converts a timestamp in milliseconds to seconds.
     * @param timestamp - The timestamp in milliseconds to convert.
     * @returns The equivalent timestamp in seconds.
     */
    public static timestampToSecond(timestamp: number): number {
        return Math.floor(timestamp / 1000);
    }
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
    public static format(format: string, date?: Date | number | string): string {
        const vDate = new _Date(date);
        return vDate.format(format);
    }
}

export namespace Time {
    export import Date = _Date;
}
export default Time;