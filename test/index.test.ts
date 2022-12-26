import {mockRandomForEach} from './jest-mock-random';
import unimitt, {Emitter, EventHandlerMap, QueueGroupMap} from '../src';

describe('unimitt', () => {
  it('should default export be a function', () => {
    expect(typeof unimitt).toStrictEqual('function');
  });

  it('should accept an optional event handler map', () => {
    expect(() => unimitt(new Map())).not.toThrow();
    const map = new Map();
    const a = jest.fn();
    const b = jest.fn();
    map.set('foo', [a, b]);
    const events = unimitt<{foo: undefined}>(map);
    events.emit('foo');
    expect(a).toBeCalledTimes(1);
    expect(b).toBeCalledTimes(1);
  });
});

describe('unimitt#', () => {
  const eventType = Symbol('eventType');
  type Events = {
    foo: unknown;
    constructor: unknown;
    FOO: unknown;
    bar: unknown;
    Bar: unknown;
    'baz:bat!': unknown;
    'baz:baT!': unknown;
    Foo: unknown;
    [eventType]: unknown;
  };
  let inst: Emitter<Events>;
  let events: EventHandlerMap<Events>;
  let groups: QueueGroupMap<Events>;

  beforeEach(() => {
    events = new Map();
    groups = new Map();
    inst = unimitt(events, groups);
  });

  describe('properties', () => {
    it('should expose the event handler map', () => {
      expect(inst).toHaveProperty('all');
      expect(inst.all).toBeInstanceOf(Map);
    });

    it('should expose the group handler map', () => {
      expect(inst).toHaveProperty('groups');
      expect(inst.groups).toBeInstanceOf(Map);
    });
  });

  describe('on()', () => {
    it('should be a function', () => {
      expect(inst).toHaveProperty('on');
      expect(typeof inst.on).toStrictEqual('function');
    });

    it('should register handler for new type', () => {
      const foo = () => {};
      inst.on('foo', foo);

      expect(events.get('foo')).toStrictEqual([foo]);
    });

    it('should register handlers for any type strings', () => {
      const foo = () => {};
      inst.on('constructor', foo);

      expect(events.get('constructor')).toStrictEqual([foo]);
    });

    it('should append handler for existing type', () => {
      const foo = () => {};
      const bar = () => {};
      inst.on('foo', foo);
      inst.on('foo', bar);

      expect(events.get('foo')).toStrictEqual([foo, bar]);
    });

    it('should NOT normalize case', () => {
      const foo = () => {};
      inst.on('FOO', foo);
      inst.on('Bar', foo);
      inst.on('baz:baT!', foo);

      expect(events.get('FOO')).toStrictEqual([foo]);
      expect(events.has('foo')).toBe(false);
      expect(events.get('Bar')).toStrictEqual([foo]);
      expect(events.has('bar')).toBe(false);
      expect(events.get('baz:baT!')).toStrictEqual([foo]);
    });

    it('can take symbols for event types', () => {
      const foo = () => {};
      inst.on(eventType, foo);
      expect(events.get(eventType)).toStrictEqual([foo]);
    });

    // Adding the same listener multiple times should register it multiple times.
    // See https://nodejs.org/api/events.html#events_emitter_on_eventname_listener
    it('should add duplicate listeners', () => {
      const foo = () => {};
      inst.on('foo', foo);
      inst.on('foo', foo);
      expect(events.get('foo')).toStrictEqual([foo, foo]);
    });

    it('should throw if one argument is provided', () => {
      // @ts-expect-error invalid arguments
      expect(() => inst.on('foo')).toThrow('invalid number of arguments: 1');
    });

    it('should throw if four arguments are provided', () => {
      expect(() =>
        // @ts-expect-error invalid arguments
        inst.on('foo', () => undefined, undefined, undefined)
      ).toThrow('invalid number of arguments: 4');
    });

    it('should register handlers for groups', () => {
      const foo = () => {};
      const bar = () => {};

      inst.on('foo', foo, 1);
      expect(groups.get('foo')).toStrictEqual([
        {
          group: 1,
          handlers: [foo],
        },
      ]);

      inst.on('foo', foo, 1);
      expect(groups.get('foo')).toStrictEqual([
        {
          group: 1,
          handlers: [foo, foo],
        },
      ]);

      inst.on('foo', foo, 2);
      expect(groups.get('foo')).toStrictEqual([
        {
          group: 1,
          handlers: [foo, foo],
        },
        {
          group: 2,
          handlers: [foo],
        },
      ]);

      inst.on('foo', bar, 1);
      expect(groups.get('foo')).toStrictEqual([
        {
          group: 1,
          handlers: [foo, foo, bar],
        },
        {
          group: 2,
          handlers: [foo],
        },
      ]);

      inst.on('bar', foo, 1);
      inst.on('*', bar, 1);
      expect(
        Array.from(groups.keys()).reduce(
          (obj: Record<string, unknown>, key) => {
            obj[key as unknown as string] = groups.get(key);
            return obj;
          },
          {}
        )
      ).toStrictEqual({
        foo: [
          {
            group: 1,
            handlers: [foo, foo, bar],
          },
          {
            group: 2,
            handlers: [foo],
          },
        ],
        bar: [
          {
            group: 1,
            handlers: [foo],
          },
        ],
        '*': [
          {
            group: 1,
            handlers: [bar],
          },
        ],
      });

      expect(events.size).toStrictEqual(0);
    });
  });

  describe('off()', () => {
    it('should be a function', () => {
      expect(inst).toHaveProperty('off');
      expect(typeof inst.off).toStrictEqual('function');
    });

    it('should remove handler for type', () => {
      const foo = () => {};
      inst.on('foo', foo);
      inst.off('foo', foo);

      expect(events.get('foo')).toHaveLength(0);
    });

    it('should NOT normalize case', () => {
      const foo = () => {};
      inst.on('FOO', foo);
      inst.on('Bar', foo);
      inst.on('baz:bat!', foo);

      inst.off('FOO', foo);
      inst.off('Bar', foo);
      inst.off('baz:baT!', foo);

      expect(events.get('FOO')).toHaveLength(0);
      expect(events.has('foo')).toBe(false);
      expect(events.get('Bar')).toHaveLength(0);
      expect(events.has('bar')).toBe(false);
      expect(events.get('baz:bat!')).toHaveLength(1);
    });

    it('should remove only the first matching listener', () => {
      const foo = () => {};
      inst.on('foo', foo);
      inst.on('foo', foo);
      inst.off('foo', foo);
      expect(events.get('foo')).toStrictEqual([foo]);
      inst.off('foo', foo);
      expect(events.get('foo')).toStrictEqual([]);
    });

    it('off("type") should remove all handlers of the given type', () => {
      inst.on('foo', () => {});
      inst.on('foo', () => {});
      inst.on('bar', () => {});
      inst.off('foo');
      expect(events.get('foo')).toStrictEqual([]);
      expect(events.get('bar')).toHaveLength(1);
      inst.off('bar');
      expect(events.get('bar')).toStrictEqual([]);
    });

    it('should throw if four arguments are provided', () => {
      expect(() =>
        // @ts-expect-error invalid arguments
        inst.off('foo', () => undefined, undefined, undefined)
      ).toThrow('invalid number of arguments: 4');
    });

    it('should remove handler for group', () => {
      const inst = unimitt<{[key: string]: unknown}>();
      const groups = inst.groups;
      const foo = () => {};
      const bar = () => {};
      for (const [k, v] of Object.entries({
        foo: [
          {
            group: 1,
            handlers: [foo, foo, bar],
          },
          {
            group: 2,
            handlers: [foo],
          },
        ],
        bar: [
          {
            group: 1,
            handlers: [foo],
          },
        ],
        '*': [
          {
            group: 1,
            handlers: [bar],
          },
        ],
      })) {
        groups.set(k, v);
      }

      inst.off('foo', bar, 2);
      expect(groups.get('foo')).toStrictEqual([
        {
          group: 1,
          handlers: [foo, foo, bar],
        },
        {
          group: 2,
          handlers: [foo],
        },
      ]);

      inst.off('foo', foo, 2);
      expect(groups.get('foo')).toStrictEqual([
        {
          group: 1,
          handlers: [foo, foo, bar],
        },
      ]);

      inst.off('foo', foo, 1);
      expect(groups.get('foo')).toStrictEqual([
        {
          group: 1,
          handlers: [foo, bar],
        },
      ]);

      inst.off('foo', foo, 1);
      expect(groups.get('foo')).toStrictEqual([
        {
          group: 1,
          handlers: [bar],
        },
      ]);

      inst.off('foo', foo, 1);
      expect(groups.get('foo')).toStrictEqual([
        {
          group: 1,
          handlers: [bar],
        },
      ]);

      inst.off('foo', bar, 1);
      expect(groups.get('foo')).toStrictEqual([]);

      inst.off('foo', bar, 1);
      expect(groups.get('foo')).toStrictEqual([]);
    });

    it('should be able to remove ALL handlers for a group', () => {
      const inst = unimitt<{[key: string]: unknown}>();
      const groups = inst.groups;
      const foo = () => {};
      const bar = () => {};
      for (const [k, v] of Object.entries({
        foo: [
          {
            group: 1,
            handlers: [foo, foo, bar],
          },
          {
            group: 2,
            handlers: [foo],
          },
        ],
      })) {
        groups.set(k, v);
      }

      inst.off('foo', undefined, 1);
      expect(groups.get('foo')).toStrictEqual([
        {
          group: 2,
          handlers: [foo],
        },
      ]);

      inst.off('foo', undefined, 1);
      expect(groups.get('foo')).toStrictEqual([
        {
          group: 2,
          handlers: [foo],
        },
      ]);
    });

    it('should remove ALL handlers (including groups) for a type', () => {
      const inst = unimitt<{[key: string]: unknown}>();
      const groups = inst.groups;
      const foo = () => {};
      const bar = () => {};
      for (const [k, v] of Object.entries({
        foo: [
          {
            group: 1,
            handlers: [foo, foo, bar],
          },
          {
            group: 2,
            handlers: [foo],
          },
        ],
        bar: [
          {
            group: 1,
            handlers: [foo],
          },
        ],
        '*': [
          {
            group: 1,
            handlers: [bar],
          },
        ],
      })) {
        groups.set(k, v);
      }

      inst.off('wat', undefined);
      inst.off('foo', undefined);
      expect(
        Array.from(groups.keys()).reduce(
          (obj: Record<string, unknown>, key) => {
            obj[key as unknown as string] = groups.get(key);
            return obj;
          },
          {}
        )
      ).toStrictEqual({
        foo: [],
        bar: [
          {
            group: 1,
            handlers: [foo],
          },
        ],
        '*': [
          {
            group: 1,
            handlers: [bar],
          },
        ],
      });
    });
  });

  describe('emit()', () => {
    it('should be a function', () => {
      expect(inst).toHaveProperty('emit');
      expect(typeof inst.emit).toStrictEqual('function');
    });

    it('should invoke handler for type', () => {
      const event = {a: 'b'};

      inst.on('foo', (one, two?: unknown) => {
        expect(one).toBe(event);
        expect(two).toBe(undefined);
      });

      inst.emit('foo', event);
    });

    it('should NOT ignore case', () => {
      const onFoo = jest.fn(),
        onFOO = jest.fn();
      events.set('Foo', [onFoo]);
      events.set('FOO', [onFOO]);

      inst.emit('Foo', 'Foo arg');
      inst.emit('FOO', 'FOO arg');

      expect(onFoo).toBeCalledTimes(1);
      expect(onFoo).toBeCalledWith('Foo arg');

      expect(onFOO).toBeCalledTimes(1);
      expect(onFOO).toBeCalledWith('FOO arg');
    });

    it('should invoke * handlers', () => {
      const star = jest.fn(),
        ea = {a: 'a'},
        eb = {b: 'b'};

      events.set('*', [star]);

      inst.emit('foo', ea);
      expect(star).toHaveBeenCalledTimes(1);
      expect(star).toHaveBeenCalledWith('foo', ea);
      star.mockReset();
      expect(star).not.toHaveBeenCalled();

      inst.emit('bar', eb);
      expect(star).toHaveBeenCalledTimes(1);
      expect(star).toHaveBeenCalledWith('bar', eb);
    });

    describe('mocking Math.random', () => {
      // a=[]; for (let i = 0; i < 100; i++) { a.push(Math.random()); }; a;
      mockRandomForEach([
        0.03952127724036103, 0.0020652874245339348, 0.7245151642139185,
        0.7538348999906113, 0.2773258981695299, 0.2120221481942577,
        0.5684729671311894, 0.8822989790322702, 0.6951090999277401,
        0.2670339441111558, 0.49880034202924484, 0.2759223567844782,
        0.9917216025984528, 0.3840107736422549, 0.34707960833755513,
        0.3240784892739277, 0.6952111403618713, 0.5154805634982493,
        0.17854250954994666, 0.5389110034816127, 0.2692746970235027,
        0.8457923036121657, 0.5502911883911266, 0.5059732002508046,
        0.22036745641265587, 0.40808603986348113, 0.19483451635977,
        0.6245805949371299, 0.3845742700924428, 0.7557188555970435,
        0.9835079129602695, 0.7564729429319523, 0.07751645600201629,
        0.4354850934099792, 0.4187029709934029, 0.27025285428071233,
        0.4277218893993022, 0.34668450828781383, 0.316437291325971,
        0.08560789942608604, 0.158797672161614, 0.7348672754247707,
        0.1977375327116062, 0.6623141948139541, 0.8826808309614926,
        0.6288646350282321, 0.4752836491207686, 0.7892762512767262,
        0.6532873011305866, 0.9419451486623096, 0.10139850523396432,
        0.8064327419925057, 0.5460342598665704, 0.4179851034345341,
        0.07496427929686056, 0.3398121813299608, 0.42542626389634886,
        0.7883558216360667, 0.27120934442195366, 0.23358425099329594,
        0.7148642286788087, 0.7643086087855846, 0.42738343484568975,
        0.2005143899369053, 0.15007130378773992, 0.6580468952646643,
        0.043278279268395003, 0.8725114447246556, 0.944988387465924,
        0.9266230778322773, 0.6707532067878001, 0.07712308561739545,
        0.3133575805409383, 0.06535808147789646, 0.3119192194911673,
        0.05745402809384159, 0.9776081718302512, 0.3714714850820169,
        0.15901953629797205, 0.12316947064655359, 0.6430607529513526,
        0.13850147667677515, 0.44299733197011903, 0.634984128444388,
        0.7712798223745236, 0.4187796175426548, 0.16156715485632844,
        0.015551836030273991, 0.5687426008485919, 0.7106546347769627,
        0.5651284106283487, 0.8296039035227398, 0.5025723895016463,
        0.25943554501652955, 0.4203073574970624, 0.50839455976743,
        0.14263043423943156, 0.6812248270759618, 0.8876057164121107,
        0.10924939376311449,
      ]);
      it('should invoke group handlers', () => {
        const output: unknown[] = [];

        inst.on('foo', e => output.push(['foo-g1-1', e]), 1);
        inst.on('foo', e => output.push(['foo-g1-2', e]), 1);
        inst.on('foo', e => output.push(['foo-g1-3', e]), 1);
        inst.on('foo', e => output.push(['foo-g1-4', e]), 1);
        inst.on('foo', e => output.push(['foo-g1-5', e]), 1);
        inst.on('foo', e => output.push(['foo-g2-1', e]), 2);
        inst.on('foo', e => output.push(['foo-g2-2', e]), 2);

        inst.on('*', (t, e) => output.push(['*-g1-1', t, e]), 1);
        inst.on('*', (t, e) => output.push(['*-g1-2', t, e]), 1);

        inst.on('foo', e => output.push(['foo-1', e]));
        inst.on('foo', e => output.push(['foo-2', e]));
        inst.on('bar', e => output.push(['bar-1', e]));
        inst.on('*', (t, e) => output.push(['*-1', t, e]));
        inst.on('*', (t, e) => output.push(['*-2', t, e]));

        inst.on('bar', e => output.push(['foo-g1-1', e]), 1);
        inst.emit('foo', 1);
        inst.emit('foo', 2);
        inst.emit('foo', 3);
        inst.emit('baz:baT!', true);
        inst.emit('bar', 4);
        inst.emit('foo', 5);
        inst.emit('bar', 6);

        expect(output).toStrictEqual([
          ['foo-1', 1],
          ['foo-2', 1],
          ['foo-g1-1', 1],
          ['foo-g2-1', 1],
          ['*-1', 'foo', 1],
          ['*-2', 'foo', 1],
          ['*-g1-2', 'foo', 1],
          ['foo-1', 2],
          ['foo-2', 2],
          ['foo-g1-4', 2],
          ['foo-g2-1', 2],
          ['*-1', 'foo', 2],
          ['*-2', 'foo', 2],
          ['*-g1-1', 'foo', 2],
          ['foo-1', 3],
          ['foo-2', 3],
          ['foo-g1-3', 3],
          ['foo-g2-2', 3],
          ['*-1', 'foo', 3],
          ['*-2', 'foo', 3],
          ['*-g1-2', 'foo', 3],
          ['*-1', 'baz:baT!', true],
          ['*-2', 'baz:baT!', true],
          ['*-g1-1', 'baz:baT!', true],
          ['bar-1', 4],
          ['foo-g1-1', 4],
          ['*-1', 'bar', 4],
          ['*-2', 'bar', 4],
          ['*-g1-1', 'bar', 4],
          ['foo-1', 5],
          ['foo-2', 5],
          ['foo-g1-5', 5],
          ['foo-g2-1', 5],
          ['*-1', 'foo', 5],
          ['*-2', 'foo', 5],
          ['*-g1-1', 'foo', 5],
          ['bar-1', 6],
          ['foo-g1-1', 6],
          ['*-1', 'bar', 6],
          ['*-2', 'bar', 6],
          ['*-g1-2', 'bar', 6],
        ]);
      });
    });
  });
});
