/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */

import unimitt, {
  Emitter,
  EventHandlerMap,
  EventType,
  Handler,
  QueueGroupMap,
  WildcardHandler,
} from '../src';

/**
 * Original mitt v3 interface.
 */
interface MittEmitter<Events extends Record<EventType, unknown>> {
  all: EventHandlerMap<Events>;

  on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void;

  on(type: '*', handler: WildcardHandler<Events>): void;

  off<Key extends keyof Events>(
    type: Key,
    handler?: Handler<Events[Key]>
  ): void;

  off(type: '*', handler: WildcardHandler<Events>): void;

  emit<Key extends keyof Events>(type: Key, event: Events[Key]): void;

  emit<Key extends keyof Events>(
    type: undefined extends Events[Key] ? Key : never
  ): void;
}

interface CombinedEmitter<Events extends Record<EventType, unknown>>
  extends MittEmitter<Events> {
  groups: QueueGroupMap<Events>;

  on<Key extends keyof Events>(
    type: Key,
    handler: Handler<Events[Key]>,
    group?: unknown
  ): void;

  on(type: '*', handler: WildcardHandler<Events>, group?: unknown): void;

  off<Key extends keyof Events>(
    type: Key,
    handler?: Handler<Events[Key]>,
    group?: unknown
  ): void;

  off(type: '*', handler: WildcardHandler<Events>, group?: unknown): void;
}

interface SomeEventData {
  name: string;
}

type IEvents = {
  foo: string;
  someEvent: SomeEventData;
  bar?: number;
};

const emitter = unimitt<IEvents>();

const mittEmitter = emitter as MittEmitter<IEvents>;

const combinedEmitter = emitter as CombinedEmitter<IEvents>;

const combinedEmitterToEmitter = combinedEmitter as Emitter<IEvents>;

const combinedEmitterToToEmitterToMittEmitter =
  combinedEmitterToEmitter as MittEmitter<IEvents>;

const barHandler = (x?: number) => {};
const fooHandler = (x: string) => {};
const wildcardHandler = (
  _type: 'foo' | 'bar' | 'someEvent',
  _event: string | SomeEventData | number | undefined
) => {};

/*
 * Check that 'on' args are inferred correctly
 */
{
  // @ts-expect-error
  emitter.on('foo', barHandler);
  emitter.on('foo', fooHandler);

  emitter.on('bar', barHandler);
  // @ts-expect-error
  emitter.on('bar', fooHandler);

  emitter.on('*', wildcardHandler);
  // fooHandler is ok, because ('foo' | 'bar' | 'someEvent') extends string
  emitter.on('*', fooHandler);
  // @ts-expect-error
  emitter.on('*', barHandler);
}

/*
 * Check that 'off' args are inferred correctly
 */
{
  // @ts-expect-error
  emitter.off('foo', barHandler);
  emitter.off('foo', fooHandler);

  emitter.off('bar', barHandler);
  // @ts-expect-error
  emitter.off('bar', fooHandler);

  emitter.off('*', wildcardHandler);
  // fooHandler is ok, because ('foo' | 'bar' | 'someEvent') extends string
  emitter.off('*', fooHandler);
  // @ts-expect-error
  emitter.off('*', barHandler);
}

/*
 * Check that 'emit' args are inferred correctly
 */
{
  // @ts-expect-error
  emitter.emit('someEvent', 'NOT VALID');
  emitter.emit('someEvent', {name: 'jack'});

  // @ts-expect-error
  emitter.emit('foo');
  // @ts-expect-error
  emitter.emit('foo', 1);
  emitter.emit('foo', 'string');

  emitter.emit('bar');
  emitter.emit('bar', 1);
  // @ts-expect-error
  emitter.emit('bar', 'string');
}
