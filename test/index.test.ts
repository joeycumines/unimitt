import unimitt, { Emitter, EventHandlerMap } from '../src';

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
		const events = unimitt<{ foo: undefined }>(map);
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
	let events: EventHandlerMap<Events>, inst: Emitter<Events>;

	beforeEach(() => {
		events = new Map();
		inst = unimitt(events);
	});

	describe('properties', () => {
		it('should expose the event handler map', () => {
			expect(inst).toHaveProperty('all');
			expect(inst.all).toBeInstanceOf(Map);
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
	});

	describe('emit()', () => {
		it('should be a function', () => {
			expect(inst).toHaveProperty('emit');
			expect(typeof inst.emit).toStrictEqual('function');
		});

		it('should invoke handler for type', () => {
			const event = { a: 'b' };

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
				ea = { a: 'a' },
				eb = { b: 'b' };

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
	});
});
