/**
 * @author NetFeez <netfeez.dev@gmail.com>
 * @description Provides a Date class that extends the native JavaScript Date object with additional formatting capabilities, allowing for easy date manipulation and formatting using custom format strings.
 * @module @NetFeez/common
 * @license Apache-2.0
 */
export class Date {
    date;
    constructor(date) {
        this.date = date ? new globalThis.Date(date) : new globalThis.Date();
    }
    get milliseconds() { return Date.pad(this.date.getMilliseconds(), 3); }
    get seconds() { return Date.pad(this.date.getSeconds()); }
    get minutes() { return Date.pad(this.date.getMinutes()); }
    get hours() { return Date.pad(this.date.getHours()); }
    get day() { return Date.pad(this.date.getDate()); }
    get month() { return Date.pad(this.date.getMonth() + 1); }
    get year() { return this.date.getFullYear().toString(); }
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
    format(format) {
        return format
            .replace(/{YYYY}/g, this.year)
            .replace(/{MM}/g, this.month)
            .replace(/{DD}/g, this.day)
            .replace(/{HH}/g, this.hours)
            .replace(/{mm}/g, this.minutes)
            .replace(/{ss}/g, this.seconds)
            .replace(/{ms}/g, this.milliseconds);
    }
    static pad(num, size = 2) {
        return num.toString().padStart(size, '0');
    }
}
export default Date;
//# sourceMappingURL=Date.js.map