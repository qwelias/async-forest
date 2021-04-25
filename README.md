# async-forest

Sometimes it could be useful to get an overview of instanced async resources.

The module uses [`async_hooks`](https://nodejs.org/api/async_hooks.html) to get a record of things that happen asynchronously.
Could be used as a diagnostic tool.

## Usage
```js
import { enable, disable, show } from 'async-forest'
import fetch from 'node-fetch'

enable()
fetch('https://google.com').then(() => {
    fancyLogger.info({ asyncForest: show() })
})
disable()
```

## Notes
- read on the `async_hooks` API -- it's not very obvious, at least not for me :)
- instanced `!==` active:
  - sometimes async resources destroyed earlier than their children, e.g.:
    - if you run an async function on a timeout and do something else asynchronous inside then the resource for timeout would most likely be destroyed earlier than the function ends
  - sometimes async resources stay instanced even after they're used, e.g.:
    - in the Usage example you'd most likely see resources for various handshakes and whatnot
- Promises do have async ids, but they do not change execution async id (at least for node14-16) read the docs on that
- the module doesn't do any magic -- just makes a better representation of what's happening, take a look at the source/docs if you have questions
