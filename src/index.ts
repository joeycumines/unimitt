export type EventType = string | symbol;

// An event handler can take an optional event argument
// and should not return a value
export type Handler<T = unknown> = (event: T) => void;
export type WildcardHandler<T = Record<string, unknown>> = (
  type: keyof T,
  event: T[keyof T]
) => void;

// An array of all currently registered event handlers for a type
export type EventHandlerList<T = unknown> = Array<Handler<T>>;
export type WildCardEventHandlerList<T = Record<string, unknown>> = Array<
  WildcardHandler<T>
>;

// A map of event types and their corresponding event handlers.
export type EventHandlerMap<Events extends Record<EventType, unknown>> = Map<
  keyof Events | '*',
  EventHandlerList<Events[keyof Events]> | WildCardEventHandlerList<Events>
>;

export type QueueGroupMap<Events extends Record<EventType, unknown>> = Map<
  keyof Events | '*',
  Array<{
    group: unknown;
    handlers:
      | EventHandlerList<Events[keyof Events]>
      | WildCardEventHandlerList<Events>;
  }>
>;

export interface Emitter<Events extends Record<EventType, unknown>> {
  all: EventHandlerMap<Events>;

  groups: QueueGroupMap<Events>;

  on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void;

  on<Key extends keyof Events>(
    type: Key,
    handler: Handler<Events[Key]>,
    group?: unknown
  ): void;

  on(type: '*', handler: WildcardHandler<Events>): void;

  on(type: '*', handler: WildcardHandler<Events>, group?: unknown): void;

  off<Key extends keyof Events>(
    type: Key,
    handler?: Handler<Events[Key]>
  ): void;

  off<Key extends keyof Events>(
    type: Key,
    handler?: Handler<Events[Key]>,
    group?: unknown
  ): void;

  off(type: '*', handler: WildcardHandler<Events>): void;

  off(type: '*', handler: WildcardHandler<Events>, group?: unknown): void;

  emit<Key extends keyof Events>(type: Key, event: Events[Key]): void;

  emit<Key extends keyof Events>(
    type: undefined extends Events[Key] ? Key : never
  ): void;
}

/**
 * Unimitt: Tiny (~200b) functional event emitter / pubsub.
 * @name unimitt
 * @returns {Unimitt}
 */
export default function unimitt<Events extends Record<EventType, unknown>>(
  all?: EventHandlerMap<Events>,
  groups?: QueueGroupMap<Events>
): Emitter<Events> {
  type GenericEventHandler =
    | Handler<Events[keyof Events]>
    | WildcardHandler<Events>;
  type GenericGroupHandler = {
    group: unknown;
    handlers: Array<GenericEventHandler>;
  };
  type GenericGroupHandlerList = Array<GenericGroupHandler>;
  all = all || new Map();
  groups = groups || new Map();
  return {
    /**
     * A Map of event names to registered handler functions.
     */
    all,

    /**
     * A map of event names, to queue groups, to registered handler functions.
     */
    groups,

    /**
     * Register an event handler for the given type.
     * @param {string|symbol} type Type of event to listen for, or `'*'` for all events
     * @param {Function} handler Function to call in response to given event
     * @param group
     * @memberOf unimitt
     */
    on<Key extends keyof Events>(
      type: Key,
      handler: GenericEventHandler,
      group?: unknown
    ) {
      switch (arguments.length) {
        case 2: {
          const handlers: Array<GenericEventHandler> | undefined =
            all!.get(type);
          if (handlers) {
            handlers.push(handler);
          } else {
            all!.set(type, [handler] as EventHandlerList<Events[keyof Events]>);
          }
          break;
        }

        case 3: {
          const groupHandlers: GenericGroupHandlerList | undefined =
            groups!.get(type);
          if (groupHandlers) {
            const index = indexOfGroupHandler(groupHandlers, group);
            if (index >= 0) {
              groupHandlers[index].handlers.push(handler);
            } else {
              groupHandlers.push({
                group,
                handlers: [handler],
              });
            }
          } else {
            groups!.set(type, [
              {
                group,
                handlers: [handler] as EventHandlerList<Events[keyof Events]>,
              },
            ]);
          }
          break;
        }

        default:
          throw new Error(`invalid number of arguments: ${arguments.length}`);
      }
    },

    /**
     * Remove an event handler for the given type.
     * If `handler` is omitted, all handlers of the given type are removed, including groups, unless a group is
     * specified, in which case all handlers for that group are removed (but not other groups, or non-group handlers).
     * @param {string|symbol} type Type of event to unregister `handler` from (`'*'` to remove a wildcard handler)
     * @param {Function} [handler] Handler function to remove
     * @param group
     * @memberOf unimitt
     */
    off<Key extends keyof Events>(
      type: Key,
      handler?: GenericEventHandler,
      group?: unknown
    ) {
      switch (arguments.length) {
        case 1:
        case 2:
          if (handler) {
            const handlers: Array<GenericEventHandler> | undefined =
              all!.get(type);
            if (handlers) {
              handlers.splice(handlers.indexOf(handler) >>> 0, 1);
            }
          } else {
            const handlers: Array<GenericEventHandler> | undefined =
              all!.get(type);
            if (handlers) {
              all!.set(type, []);
            }
            const groupHandlers: GenericGroupHandlerList | undefined =
              groups!.get(type);
            if (groupHandlers) {
              groups!.set(type, []);
            }
          }
          break;

        case 3: {
          const groupHandlers: GenericGroupHandlerList | undefined =
            groups!.get(type);
          if (groupHandlers) {
            const index = indexOfGroupHandler(groupHandlers, group);
            if (index >= 0) {
              if (handler) {
                groupHandlers[index].handlers.splice(
                  groupHandlers[index].handlers.indexOf(handler) >>> 0,
                  1
                );
                if (groupHandlers[index].handlers.length === 0) {
                  groupHandlers.splice(index, 1);
                }
              } else {
                groupHandlers.splice(index, 1);
              }
            }
          }
          break;
        }

        default:
          throw new Error(`invalid number of arguments: ${arguments.length}`);
      }
    },

    /**
     * Invoke all handlers for the given type.
     * If present, `'*'` handlers are invoked after type-matched handlers.
     *
     * Note: Manually firing '*' handlers is not supported.
     *
     * @param {string|symbol} type The event type to invoke
     * @param {Any} [evt] Any value (object is recommended and powerful), passed to each handler
     * @memberOf unimitt
     */
    emit<Key extends keyof Events>(type: Key, evt?: Events[Key]) {
      let handlers = all!.get(type);
      if (handlers) {
        (handlers as EventHandlerList<Events[keyof Events]>)
          .slice()
          .map(handler => {
            handler(evt!);
          });
      }

      let groupHandlers = groups!.get(type);
      if (groupHandlers) {
        (
          groupHandlers as Array<{
            group: unknown;
            handlers: EventHandlerList<Events[keyof Events]>;
          }>
        )
          .slice()
          .map(g => {
            if (g.handlers.length > 0) {
              getRandomElement(g.handlers)(evt!);
            }
          });
      }

      handlers = all!.get('*');
      if (handlers) {
        (handlers as WildCardEventHandlerList<Events>).slice().map(handler => {
          handler(type, evt!);
        });
      }

      groupHandlers = groups!.get('*');
      if (groupHandlers) {
        (
          groupHandlers as Array<{
            group: unknown;
            handlers: WildCardEventHandlerList<Events>;
          }>
        )
          .slice()
          .map(g => {
            if (g.handlers.length > 0) {
              getRandomElement(g.handlers)(type, evt!);
            }
          });
      }
    },
  };
}

function indexOfGroupHandler(
  groupHandlers: Array<{group: unknown}>,
  group: unknown
): number {
  for (let i = 0; i < groupHandlers.length; i++) {
    if (groupHandlers[i].group === group) {
      return i;
    }
  }
  return -1;
}

function getRandomElement<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}
