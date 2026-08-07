/**
 * @author NetFeez <codefeez.dev@gmail.com>.
 * @description Adds a class that manages events and their listeners, allowing for the registration, deregistration, and emission of events with strong TypeScript typing.
 * @module  @NetFeez/common
 * @license Apache-2.0
 */
export declare class Events<EventMap extends Events.EventMap = Events.EventMap> {
    private listeners;
    private onceListeners;
    get EventMap(): EventMap;
    /**
     * Adds an event to the EventManager.
     * @param name The name of the event.
     * @param listener The callback that will be executed.
     */
    on<E extends string & keyof EventMap>(name: E, listener: Events.Listener<EventMap[E]>): void;
    /**
     * Adds an once event to the EventManager.
     * @param name The name of the event.     * @param callback The callback that will be executed.
     */
    once<E extends string & keyof EventMap>(name: E, listener: Events.Listener<EventMap[E]>): void;
    /**
     * Removes an event from the EventManager.
     * @param name The name of the event to remove.
     * @param listener The callback of the event to remove.
     */
    off<E extends string & keyof EventMap>(name: E, listener: Events.Listener<EventMap[E]>): void;
    /**
     * Removes an once event from the EventManager.
     * @param name The name of the event to remove.
     * @param listener The callback of the event to remove.
     */
    offOnce<E extends string & keyof EventMap>(name: E, listener: Events.Listener<EventMap[E]>): void;
    /**
     * Removes all listeners from an event.
     * @param name The name of the event from which the callbacks will be removed.
     */
    offAll<E extends string & keyof EventMap>(name: E): void;
    /**
     * Removes all listeners from an once event.
     * @param name The name of the event from which the callbacks will be removed.
     */
    offAllOnce<E extends string & keyof EventMap>(name: E): void;
    /**
     * Executes an event.
     * @param name The name of the event to execute.
     * @param args The arguments that will be passed to the callbacks.
     */
    protected emit<E extends string & keyof EventMap>(...event: [name: E, ...args: EventMap[E]]): void;
    /**
     * Returns the number of callbacks of an event.
     * @param name The name of the event.
     * @returns The number of callbacks of the event.
     */
    eventCount<E extends string & keyof EventMap>(name: E): number;
    static createEmitter<EventMap extends Events.EventMap = Events.EventMap>(): EventsEmitter<EventMap>;
}
export declare class EventsEmitter<EventMap extends Events.EventMap = Events.EventMap> extends Events<EventMap> {
    emit: <E extends string & keyof EventMap>(name: E, ...args: EventMap[E]) => void;
    /** Returns the EventManager as an Events instance, allowing for the registration of listeners without exposing the emit method. */
    get listenerOnly(): Events<EventMap>;
}
export declare namespace EventsEmitter { }
export declare namespace Events {
    export import Emitter = EventsEmitter;
    type Listener<T extends any[]> = (...args: T) => void;
    type ListenerList<eventMap extends EventMap> = {
        [name in keyof eventMap]?: Set<Listener<eventMap[name]>>;
    };
    interface EventMap {
        [name: string]: [...args: any[]];
    }
}
export default Events;
