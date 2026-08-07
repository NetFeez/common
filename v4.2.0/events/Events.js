/**
 * @author NetFeez <codefeez.dev@gmail.com>.
 * @description Adds a class that manages events and their listeners, allowing for the registration, deregistration, and emission of events with strong TypeScript typing.
 * @module  @NetFeez/common
 * @license Apache-2.0
 */
export class Events {
    listeners = {};
    onceListeners = {};
    get EventMap() { return {}; }
    /**
     * Adds an event to the EventManager.
     * @param name The name of the event.
     * @param listener The callback that will be executed.
     */
    on(name, listener) {
        const listeners = this.listeners[name] ?? new Set();
        listeners.add(listener);
        this.listeners[name] = listeners;
    }
    /**
     * Adds an once event to the EventManager.
     * @param name The name of the event.     * @param callback The callback that will be executed.
     */
    once(name, listener) {
        const listeners = this.onceListeners[name] ?? new Set();
        listeners.add(listener);
        this.onceListeners[name] = listeners;
    }
    /**
     * Removes an event from the EventManager.
     * @param name The name of the event to remove.
     * @param listener The callback of the event to remove.
     */
    off(name, listener) {
        const list = this.listeners[name];
        if (!list)
            return;
        list.delete(listener);
        if (list.size === 0)
            delete this.listeners[name];
    }
    /**
     * Removes an once event from the EventManager.
     * @param name The name of the event to remove.
     * @param listener The callback of the event to remove.
     */
    offOnce(name, listener) {
        const list = this.onceListeners[name];
        if (!list)
            return;
        list.delete(listener);
        if (list.size === 0)
            delete this.onceListeners[name];
    }
    /**
     * Removes all listeners from an event.
     * @param name The name of the event from which the callbacks will be removed.
     */
    offAll(name) {
        delete this.listeners[name];
    }
    /**
     * Removes all listeners from an once event.
     * @param name The name of the event from which the callbacks will be removed.
     */
    offAllOnce(name) {
        delete this.onceListeners[name];
    }
    /**
     * Executes an event.
     * @param name The name of the event to execute.
     * @param args The arguments that will be passed to the callbacks.
     */
    emit(...event) {
        const [name, ...args] = event;
        const persistent = this.listeners[name]
            ? Array.from(this.listeners[name])
            : undefined;
        const once = this.onceListeners[name];
        if (once)
            delete this.onceListeners[name];
        if (persistent)
            for (const listener of persistent) {
                listener(...args);
            }
        if (once)
            for (const listener of once) {
                listener(...args);
            }
    }
    /**
     * Returns the number of callbacks of an event.
     * @param name The name of the event.
     * @returns The number of callbacks of the event.
     */
    eventCount(name) {
        const listenerCount = this.listeners[name]?.size ?? 0;
        const onceCount = this.onceListeners[name]?.size ?? 0;
        return listenerCount + onceCount;
    }
    static createEmitter() {
        return new EventsEmitter();
    }
}
export class EventsEmitter extends Events {
    emit = super.emit;
    /** Returns the EventManager as an Events instance, allowing for the registration of listeners without exposing the emit method. */
    get listenerOnly() { return this; }
}
(function (Events) {
    Events.Emitter = EventsEmitter;
})(Events || (Events = {}));
export default Events;
//# sourceMappingURL=Events.js.map