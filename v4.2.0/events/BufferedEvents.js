import Events from "./Events.js";
export class BufferedEvents extends Events {
    protected = {};
    vBuffering = true;
    vAutoFlush = false;
    get buffering() { return this.vBuffering; }
    set buffering(value) { this.vBuffering = value; }
    get autoFlush() { return this.vAutoFlush; }
    set autoFlush(value) { this.vAutoFlush = value; }
    /**
     * Flushes the buffer and emits all events in it.
     * This will emit all events in the buffer and clear it.
     */
    flush() {
        for (const name in this.protected)
            this.flushEvent(name);
    }
    /**
     * Flushes an event if it exists in the buffer.
     * If the event exists in the buffer, it will be emitted and removed from the buffer.
     * If autoFlush is enabled, this will be called automatically when a listener is added to an event that has buffered events.
     * @param name The name of the event to flush.
     */
    flushEvent(name) {
        if (!this.is(name))
            return;
        const buffer = this.protected[name] ?? [];
        delete this.protected[name];
        for (const args of buffer)
            super.emit(name, ...args);
    }
    on(name, listener) {
        super.on(name, listener);
        if (this.vAutoFlush)
            this.flushEvent(name);
    }
    emit(...event) {
        if (!this.vBuffering)
            return super.emit(...event);
        const [name, ...args] = event;
        if (this.vBuffering && this.eventCount(name) === 0) {
            this.protected[name] = this.protected[name] ?? [];
            this.protected[name].push(args);
        }
        else
            super.emit(...event);
    }
    /**
     * TypeGuard to check if the name is a key of the EventMap.
     * @param name The name to check.
     * @returns Whether the name is a key of the EventMap.
     */
    is(name) { return name in this.protected; }
}
export class BufferedEventsEmitter extends BufferedEvents {
    emit = super.emit;
    /** Returns the EventManager as a BufferedEvents instance, allowing for the registration of listeners without exposing the emit method. */
    get listenerOnly() { return this; }
}
export default BufferedEvents;
//# sourceMappingURL=BufferedEvents.js.map