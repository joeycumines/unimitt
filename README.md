<p align="center">
  <!--<img src="https://i.imgur.com/BqsX9NT.png" width="300" height="300" alt="unimitt">-->
  <br>
  <a href="https://www.npmjs.org/package/unimitt"><img src="https://img.shields.io/npm/v/unimitt.svg" alt="npm"></a>
  <img src="https://github.com/developit/unimitt/workflows/CI/badge.svg" alt="build status">
  <a href="https://unpkg.com/unimitt/dist/unimitt.js"><img src="https://img.badgesize.io/https://unpkg.com/unimitt/dist/unimitt.js?compression=gzip" alt="gzip size"></a>
</p>

# Unimitt

> Tiny 200b functional event emitter / pubsub.

**This fork extends [mitt](https://github.com/developit/mitt) to add support for randomized one-to-one pub-sub.**

*   **Microscopic:** weighs less than 200 bytes gzipped
*   **Useful:** a wildcard `"*"` event type listens to all events
*   **Familiar:** same names & ideas as [Node's EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter)
*   **Functional:** methods don't rely on `this`
*   **Great Name:** somehow [unimitt](https://npm.im/unimitt) wasn't taken

Unimitt was made for the browser, but works in any JavaScript runtime. It has no dependencies and supports IE9+.

## Table of Contents

*   [Install](#install)
*   [Usage](#usage)
*   [Examples & Demos](#examples--demos)
*   [API](#api)
*   [Contribute](#contribute)
*   [License](#license)

## Install

This project uses [node](http://nodejs.org) and [npm](https://npmjs.com). Go check them out if you don't have them locally installed.

```sh
$ npm install --save unimitt
```

Then with a module bundler like [rollup](http://rollupjs.org/) or [webpack](https://webpack.js.org/), use as you would anything else:

```javascript
// using ES6 modules
import unimitt from 'unimitt'

// using CommonJS modules
var unimitt = require('unimitt')
```

The [UMD](https://github.com/umdjs/umd) build is also available on [unpkg](https://unpkg.com):

```html
<script src="https://unpkg.com/unimitt/dist/unimitt.umd.js"></script>
```

You can find the library on `window.unimitt`.

## Usage

```js
import unimitt from 'unimitt'

const emitter = unimitt()

// listen to an event
emitter.on('foo', e => console.log('foo', e) )

// listen to all events
emitter.on('*', (type, e) => console.log(type, e) )

// fire an event
emitter.emit('foo', { a: 'b' })

// clearing all events
emitter.all.clear()

// working with handler references:
function onFoo() {}
emitter.on('foo', onFoo)   // listen
emitter.off('foo', onFoo)  // unlisten
```

### Typescript

Set `"strict": true` in your tsconfig.json to get improved type inference for `unimitt` instance methods.

```ts
import unimitt from 'unimitt';

type Events = {
  foo: string;
  bar?: number;
};

const emitter = unimitt<Events>(); // inferred as Emitter<Events>

emitter.on('foo', (e) => {}); // 'e' has inferred type 'string'

emitter.emit('foo', 42); // Error: Argument of type 'number' is not assignable to parameter of type 'string'. (2345)
```

Alternatively, you can use the provided `Emitter` type:

```ts
import unimitt, { Emitter } from 'unimitt';

type Events = {
  foo: string;
  bar?: number;
};

const emitter: Emitter<Events> = unimitt<Events>();
```

***

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

*   [unimitt](#unimitt)
*   [all](#all)
*   [groups](#groups)
*   [on](#on)
    *   [Parameters](#parameters)
*   [off](#off)
    *   [Parameters](#parameters-1)
*   [emit](#emit)
    *   [Parameters](#parameters-2)

### unimitt

Unimitt: Tiny (~200b) functional event emitter / pubsub.

Returns **Unimitt**&#x20;

### all

A Map of event names to registered handler functions.

### groups

A map of event names, to queue groups, to registered handler functions.

### on

Register an event handler for the given type.

#### Parameters

*   `type` **([string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | [symbol](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Symbol))** Type of event to listen for, or `'*'` for all events
*   `handler` **[Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)** Function to call in response to given event
*   `group` **any?**&#x20;

### off

Remove an event handler for the given type.
If `handler` is omitted, all handlers of the given type are removed, including groups, unless a group is
specified, in which case all handlers for that group are removed (but not other groups, or non-group handlers).

#### Parameters

*   `type` **([string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | [symbol](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Symbol))** Type of event to unregister `handler` from (`'*'` to remove a wildcard handler)
*   `handler` **[Function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function)?** Handler function to remove
*   `group` **any?**&#x20;

### emit

Invoke all handlers for the given type.
If present, `'*'` handlers are invoked after type-matched handlers.

Note: Manually firing '\*' handlers is not supported.

#### Parameters

*   `type` **([string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) | [symbol](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Symbol))** The event type to invoke
*   `evt` **Any?** Any value (object is recommended and powerful), passed to each handler

## Contribute

First off, thanks for taking the time to contribute!
Now, take a moment to be sure your contributions make sense to everyone else.

### Reporting Issues

Found a problem? Want a new feature? First of all see if your issue or idea has [already been reported](../../issues).
If don't, just open a [new clear and descriptive issue](../../issues/new).

### Submitting pull requests

Pull requests are the greatest contributions, so be sure they are focused in scope, and do avoid unrelated commits.

*   Fork it!
*   Clone your fork: `git clone https://github.com/<your-username>/unimitt`
*   Navigate to the newly cloned directory: `cd unimitt`
*   Create a new branch for the new feature: `git checkout -b my-new-feature`
*   Install the tools necessary for development: `npm install`
*   Make your changes.
*   Commit your changes: `git commit -am 'Add some feature'`
*   Push to the branch: `git push origin my-new-feature`
*   Submit a pull request with full remarks documenting your changes.

## License

[MIT License](https://opensource.org/licenses/MIT) © [Jason Miller](https://jasonformat.com/)
