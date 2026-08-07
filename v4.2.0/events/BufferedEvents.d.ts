import Events from "./Events.js";
export declare class BufferedEvents<EventMap extends Events.EventMap> extends Events<EventMap> {
    private protected;
    protected vBuffering: boolean;
    protected vAutoFlush: boolean;
    get buffering(): boolean;
    set buffering(value: boolean);
    get autoFlush(): boolean;
    set autoFlush(value: boolean);
    /**
     * Flushes the buffer and emits all events in it.
     * This will emit all events in the buffer and clear it.
     */
    flush(): void;
    /**
     * Flushes an event if it exists in the buffer.
     * If the event exists in the buffer, it will be emitted and removed from the buffer.
     * If autoFlush is enabled, this will be called automatically when a listener is added to an event that has buffered events.
     * @param name The name of the event to flush.
     */
    flushEvent(name: string & keyof EventMap): void;
    on<E extends string & keyof EventMap>(name: E, listener: Events.Listener<EventMap[E]>): void;
    protected emit<E extends string & keyof EventMap>(...event: [name: E, ...args: EventMap[E]]): void;
    /**
     * TypeGuard to check if the name is a key of the EventMap.
     * @param name The name to check.
     * @returns Whether the name is a key of the EventMap.
     */
    private is;
}
export declare class BufferedEventsEmitter<EventMap extends Events.EventMap> extends BufferedEvents<EventMap> {
    emit: <E extends string & keyof EventMap>(name: E, ...args: EventMap[E]) => void;
    /** Returns the EventManager as a BufferedEvents instance, allowing for the registration of listeners without exposing the emit method. */
    get listenerOnly(): BufferedEvents<EventMap>;
}
export declare namespace BufferedEvents {
    type Buffer<EventMap> = {
        [name in keyof EventMap]?: EventMap[name][];
    };
}
export default BufferedEvents;
