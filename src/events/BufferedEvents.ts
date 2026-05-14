import Events from "./Events.js";

export class BufferedEvents<EventMap extends Events.EventMap> extends Events<EventMap> {
    private protected: BufferedEvents.Buffer<EventMap> = {};
    protected vBuffering: boolean = true
    protected vAutoFlush: boolean = true;

    public get buffering(): boolean { return this.vBuffering; }
    public set buffering(value: boolean) { this.vBuffering = value; }
    public get autoFlush(): boolean { return this.vAutoFlush; }
    public set autoFlush(value: boolean) { this.vAutoFlush = value; }

    /**
     * Flushes the buffer and emits all events in it.
     * This will emit all events in the buffer and clear it.
     */
    public flush(): void {
        for (const name in this.protected) this.flushEvent(name);
    }
    /**
     * Flushes an event if it exists in the buffer.
     * If the event exists in the buffer, it will be emitted and removed from the buffer.
     * If autoFlush is enabled, this will be called automatically when a listener is added to an event that has buffered events.
     * @param name The name of the event to flush.
     */
    public flushEvent(name: string & keyof EventMap): void {
        if (!this.is(name)) return;
        const buffer = this.protected[name] ?? [];
        delete this.protected[name];
        for (const args of buffer) super.emit(name, ...args);
    }
    public override on<E extends string & keyof EventMap>(name: E, listener: Events.Listener<EventMap[E]>): void {
        super.on(name, listener);
        if (this.vAutoFlush) this.flushEvent(name);
    }
    protected override emit<E extends string & keyof EventMap>(...event: [name: E, ...args: EventMap[E]]): void {
        if (!this.vBuffering) return super.emit(...event);
        const [name, ...args] = event;
        if (this.vBuffering && this.eventCount(name) === 0) {
            this.protected[name] = this.protected[name] ?? [];
            this.protected[name].push(args);
        } else super.emit(...event);
    }
    /**
     * TypeGuard to check if the name is a key of the EventMap.
     * @param name The name to check.
     * @returns Whether the name is a key of the EventMap.
     */
    private is<T extends string>(name: T): name is T & keyof EventMap { return name in this.protected; }
}
export class BufferedEventsEmitter<EventMap extends Events.EventMap> extends BufferedEvents<EventMap> {
    public override emit = super.emit;
    /** Returns the EventManager as a BufferedEvents instance, allowing for the registration of listeners without exposing the emit method. */
    public get listenerOnly(): BufferedEvents<EventMap> { return this; }
}
export namespace BufferedEvents {
    export type Buffer<EventMap> = { [name in keyof EventMap]?: EventMap[name][]; };
}
export default BufferedEvents;