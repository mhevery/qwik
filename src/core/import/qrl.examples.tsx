import { onDocument, QRL, $, qrl, qrlImport, useStore, implicit$FirstArg } from '@builder.io/qwik';
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */

// <docs anchor="qrl-usage-$">
onDocument(
  'mousemove',
  $(() => console.log('mousemove'))
);
// </docs>

// <docs anchor="qrl-usage-$-optimized">
// FILE: <current file>
onDocument('mousemove', qrl('./chunk-abc.js', 'onMousemove'));

// FILE: chunk-abc.js
export const onMousemove = () => console.log('mousemove');
// </docs>

// <docs anchor="qrl-usage-type">
// Example of declaring a custom functions which takes callback as QRL.
export function useMyFunction(callback: QRL<() => void>) {
  doExtraStuff();
  // The callback passed to `onDocument` requires `QRL`.
  onDocument('mousemove', callback);
}
// </docs>

function doExtraStuff() {
  throw new Error('Function not implemented.');
}

(async function () {
  const element: Element = null!;
  // <docs anchor="qrl-usage-import">
  // Assume you have QRL reference to a greet function
  const lazyGreet: QRL<() => void> = $(() => console.log('Hello World!'));

  // Use `qrlImport` to load / resolve the reference.
  const greet: () => void = await qrlImport(element, lazyGreet);

  //  Invoke it
  greet();
  // </docs>
})();

export function importedFn() {}

// <docs anchor="qrl-capturing-rules">
import { importedFn } from './qrl.examples';

export const greet = () => console.log('greet');
function topLevelFn() {}

function myCode() {
  const store = useStore({});
  function localFn() {}
  // Valid Examples
  $(greet); // greet is importable
  $(importedFn); // importedFn is importable
  $(() => greet()); // greet is importable;
  $(() => importedFn()); // importedFn is importable
  $(() => console.log(store)); // store is serializable.

  // Compile time errors
  $(topLevelFn); // ERROR: `topLevelFn` not importable
  $(() => topLevelFn()); // ERROR: `topLevelFn` not importable

  // Runtime errors
  $(localFn); // ERROR: `localFn` fails serialization
  $(() => localFn()); // ERROR: `localFn` fails serialization
}

// </docs>

console.log(myCode);

// <docs anchor="implicit$FirstArg">
export function myApi(callback: QRL<() => void>): void {
  // ...
}

export const myApi$ = implicit$FirstArg(myApi);
// type of myApi$: (callback: () => void): void

// can be used as:
myApi$(() => console.log('callback'));

// will be transpiled to:
// FILE: <current file>
myApi(qrl('./chunk-abc.js', 'callback'));

// FILE: chunk-abc.js
export const callback = () => console.log('callback');
// </docs>
