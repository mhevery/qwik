import { qrlImport } from '../import/qrl-import';
import { toQrlOrError } from '../import/qrl';
import { $, implicit$FirstArg, QRL } from '../import/qrl.public';
import type { qrlFactory } from '../props/props-on';
import { getProps } from '../props/props.public';
import { h } from '../render/jsx/factory';
import type { JSXNode } from '../render/jsx/types/jsx-node';
import { newInvokeContext, useInvoke, useWaitOn } from '../use/use-core';
import { useHostElement } from '../use/use-host-element.public';
import { AttributeMarker } from '../util/markers';
import { styleKey } from './qrl-styles';

// <docs markdown="./component.public.md#onUnmount">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * A lazy-loadable reference to a component's destroy hook.
 * 
 * Invoked when the component is destroyed (removed from render tree).
 */
// </docs>
export function onUnmount(unmountFn: QRL<() => void>): void {
  throw new Error('IMPLEMENT: onUnmount' + unmountFn);
}

// <docs markdown="./component.public.md#onUnmount">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * A lazy-loadable reference to a component's destroy hook.
 * 
 * Invoked when the component is destroyed (removed from render tree).
 */
// </docs>
export const onUnmount$ = implicit$FirstArg(onUnmount);

// <docs markdown="./component.public.md#onResume">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * A lazy-loadable reference to a component's on resume hook.
 * 
 * The hook is eagerly invoked when the application resumes on the client. Because it is called
 * eagerly, this allows the component to hydrate even if no user interaction has taken place.
 */
// </docs>
export function onResume(resumeFn: QRL<() => void>): void {
  throw new Error('IMPLEMENT: onRender' + resumeFn);
}

// <docs markdown="./component.public.md#onResume">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * A lazy-loadable reference to a component's on resume hook.
 * 
 * The hook is eagerly invoked when the application resumes on the client. Because it is called
 * eagerly, this allows the component to hydrate even if no user interaction has taken place.
 */
// </docs>
export const onResume$ = implicit$FirstArg(onResume);

// <docs markdown="./component.public.md#onHydrate">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * A lazy-loadable reference to a component's on hydrate hook.
 * 
 * Invoked when the component's state is re-hydrated from serialization. This allows the
 * component to do any work to re-activate itself.
 */
// </docs>
export function onHydrate(hydrateFn: QRL<() => void>): void {
  throw new Error('IMPLEMENT: onHydrate' + hydrateFn);
}

// <docs markdown="./component.public.md#onHydrate">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * A lazy-loadable reference to a component's on hydrate hook.
 * 
 * Invoked when the component's state is re-hydrated from serialization. This allows the
 * component to do any work to re-activate itself.
 */
// </docs>
export const onHydrate$ = implicit$FirstArg(onHydrate);

// <docs markdown="./component.public.md#onDehydrate">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * A lazy-loadable reference to a component's on dehydrate hook.
 * 
 * Invoked when the component's state is being serialized (dehydrated) into the DOM. This allows
 * the component to do last-minute clean-up before its state is serialized.
 * 
 * Typically used with transient state.
 */
// </docs>
export function onDehydrate(dehydrateFn: QRL<() => void>): void {
  throw new Error('IMPLEMENT: onDehydrate' + dehydrateFn);
}

// <docs markdown="./component.public.md#onDehydrate">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * A lazy-loadable reference to a component's on dehydrate hook.
 * 
 * Invoked when the component's state is being serialized (dehydrated) into the DOM. This allows
 * the component to do last-minute clean-up before its state is serialized.
 * 
 * Typically used with transient state.
 */
// </docs>
export const onDehydrate$ = implicit$FirstArg(onDehydrate);

// <docs markdown="./component.public.md#onRender">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * A lazy-loadable reference to a component's render hook.
 * 
 * See: `component`
 * 
 * ### Example
 * 
 * ```typescript
 * const Counter = component$((props: { name: string }) => {
 *   return onRender$(() => <div>{props.name}</div>);
 * });
 * ```
 */
// </docs>
export function onRender(renderFn: QRL<() => JSXNode>): QRL<() => JSXNode> {
  return toQrlOrError(renderFn);
}

// <docs markdown="./component.public.md#onRender">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * A lazy-loadable reference to a component's render hook.
 * 
 * See: `component`
 * 
 * ### Example
 * 
 * ```typescript
 * const Counter = component$((props: { name: string }) => {
 *   return onRender$(() => <div>{props.name}</div>);
 * });
 * ```
 */
// </docs>
export const onRender$ = implicit$FirstArg(onRender);

// <docs markdown="./component.public.md#on">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * Register a listener on the current component's host element.
 * 
 * Used to programmatically add event listeners. Useful from custom `use*` methods, which do not
 * have access to the JSX.
 * 
 * See: `on`, `onWindow`, `onDocument`.
 * 
 * @public
 */
// </docs>
export function on(event: string, eventFn: QRL<() => void>): QRL<() => void> {
  throw new Error('IMPLEMENT: on' + eventFn);
}

// <docs markdown="./component.public.md#onDocument">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * Register a listener on `document`.
 * 
 * Used to programmatically add event listeners. Useful from custom `use*` methods, which do not
 * have access to the JSX.
 * 
 * See: `on`, `onWindow`, `onDocument`.
 * 
 * @public
 */
// </docs>
export function onDocument(event: string, eventFn: QRL<() => void>): QRL<() => void> {
  throw new Error('IMPLEMENT: onDocument' + eventFn);
}

// <docs markdown="./component.public.md#onWindow">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * Register a listener on `window`.
 * 
 * Used to programmatically add event listeners. Useful from custom `use*` methods, which do not
 * have access to the JSX.
 * 
 * See: `on`, `onWindow`, `onDocument`.
 * 
 * @public
 */
// </docs>
export function onWindow(event: string, eventFn: QRL<() => void>): QRL<() => void> {
  throw new Error('IMPLEMENT: onWindow' + eventFn);
}

// <docs markdown="./component.public.md#withStyles">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * @alpha
 */
// </docs>
export function withStyles(styles: QRL<string>): void {
  _withStyles(styles, false);
}

// <docs markdown="./component.public.md#withStyles">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * @alpha
 */
// </docs>
export const withStyles$ = implicit$FirstArg(withStyles);

// <docs markdown="./component.public.md#withScopedStyles">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * @alpha
 */
// </docs>
export function withScopedStyles(styles: QRL<string>): void {
  _withStyles(styles, true);
}

// <docs markdown="./component.public.md#withScopedStyles">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * @alpha
 */
// </docs>
export const withScopedStyles$ = implicit$FirstArg(withScopedStyles);

// <docs markdown="./component.public.md#PropsOf">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * Infers `Props` from component.
 * 
 * ```typescript
 * export const OtherComponent = component$(() => {
 *   return onRender$(() => <Counter value={100} />);
 * });
 * ```
 * 
 * @public
 */
// </docs>
export type PropsOf<COMP extends (props: any) => JSXNode> = COMP extends (
  props: infer PROPS
) => JSXNode<any>
  ? PROPS
  : never;

// <docs markdown="./component.public.md#component">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * Declare a Qwik component that can be used to create UI.
 * 
 * Use `component` (and `component$`) to declare a Qwik component. Qwik component is a special
 * kind of component that allows the Qwik framework to lazy load and executed the component
 * independently of other Qwik components as well as lazy load the component's life-cycle hooks
 * and event handlers.
 * 
 * Side note: You can also declare regular (standard JSX) components that will have standard
 * synchronous behavior.
 * 
 * Qwik component is a facade that describes how the component should be used without forcing the
 * implementation of the component to be eagerly loaded. A minimum Qwik definition consists of:
 * 
 * - Component `onMount` method, which needs to return an
 * - `onRender` closure which constructs the component's JSX.
 * 
 * ### Example:
 * 
 * Example showing how to create a counter component.
 * 
 * ```typescript
 * export const Counter = component$((props: { value?: number; step?: number }) => {
 *   const state = useStore({ count: props.value || 0 });
 *   return onRender$(() => (
 *     <div>
 *       <span>{state.count}</span>
 *       <button on$:click={() => (state.count += props.step || 1)}>+</button>
 *     </div>
 *   ));
 * });
 * ```
 * 
 * - `component$` is how a component gets declared.
 * - `{ value?: number; step?: number }` declares the public (props) interface of the component.
 * - `{ count: number }` declares the private (state) interface of the component.
 * - `onMount` closure: is used to create data store (see: `useStore`);
 * - `onRender$`: is required hook for rendering the component.
 * - `$`: mark which parts of the component will be lazy-loaded. (see `$` for details.)
 * 
 * The above can than be used like so:
 * 
 * ```typescript
 * export const OtherComponent = component$(() => {
 *   return onRender$(() => <Counter value={100} />);
 * });
 * ```
 * 
 * See also: `component`, `onRender`, `onUnmount`, `onHydrate`, `onDehydrate`, `onHalt`,
 * `onResume`, `on`, `onDocument`, `onWindow`, `withStyles`, `withScopedStyles`
 * 
 * @param tagName: Optional element tag-name to be used for the component's host element.
 * @param onMount: Initialization closure used when the component is first created.
 * 
 * @public
 */
// </docs>
export function component<PROPS extends {}>(
  tagName: string,
  onMount: QRL<(props: PROPS) => ReturnType<typeof onRender>>
): (props: PROPS) => JSXNode<PROPS>;
// <docs markdown="./component.public.md#component">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * Declare a Qwik component that can be used to create UI.
 * 
 * Use `component` (and `component$`) to declare a Qwik component. Qwik component is a special
 * kind of component that allows the Qwik framework to lazy load and executed the component
 * independently of other Qwik components as well as lazy load the component's life-cycle hooks
 * and event handlers.
 * 
 * Side note: You can also declare regular (standard JSX) components that will have standard
 * synchronous behavior.
 * 
 * Qwik component is a facade that describes how the component should be used without forcing the
 * implementation of the component to be eagerly loaded. A minimum Qwik definition consists of:
 * 
 * - Component `onMount` method, which needs to return an
 * - `onRender` closure which constructs the component's JSX.
 * 
 * ### Example:
 * 
 * Example showing how to create a counter component.
 * 
 * ```typescript
 * export const Counter = component$((props: { value?: number; step?: number }) => {
 *   const state = useStore({ count: props.value || 0 });
 *   return onRender$(() => (
 *     <div>
 *       <span>{state.count}</span>
 *       <button on$:click={() => (state.count += props.step || 1)}>+</button>
 *     </div>
 *   ));
 * });
 * ```
 * 
 * - `component$` is how a component gets declared.
 * - `{ value?: number; step?: number }` declares the public (props) interface of the component.
 * - `{ count: number }` declares the private (state) interface of the component.
 * - `onMount` closure: is used to create data store (see: `useStore`);
 * - `onRender$`: is required hook for rendering the component.
 * - `$`: mark which parts of the component will be lazy-loaded. (see `$` for details.)
 * 
 * The above can than be used like so:
 * 
 * ```typescript
 * export const OtherComponent = component$(() => {
 *   return onRender$(() => <Counter value={100} />);
 * });
 * ```
 * 
 * See also: `component`, `onRender`, `onUnmount`, `onHydrate`, `onDehydrate`, `onHalt`,
 * `onResume`, `on`, `onDocument`, `onWindow`, `withStyles`, `withScopedStyles`
 * 
 * @param tagName: Optional element tag-name to be used for the component's host element.
 * @param onMount: Initialization closure used when the component is first created.
 * 
 * @public
 */
// </docs>
export function component<PROPS extends {}>(
  onMount: QRL<(props: PROPS) => ReturnType<typeof onRender>>
): (props: PROPS) => JSXNode<PROPS>;
/**
 * @public
 */
export function component<PROPS extends {}>(
  tagNameOrONMount: string | QRL<(props: PROPS) => ReturnType<typeof onRender>>,
  onMount?: QRL<(props: PROPS) => ReturnType<typeof onRender>>
): (props: PROPS) => JSXNode<PROPS> {
  // Sort of the argument position based on type / overload
  const hasTagName = typeof tagNameOrONMount == 'string';
  const tagName = hasTagName ? tagNameOrONMount : 'div';
  const onMount_ = hasTagName ? onMount! : tagNameOrONMount;

  // Return a QComponent Factory function.
  return function QComponent(props: PROPS): JSXNode<PROPS> {
    const onRenderFactory: qrlFactory = async (
      hostElement: Element
    ): Promise<ReturnType<typeof onRender>> => {
      // Turn function into QRL
      const onMountQrl = toQrlOrError(onMount_);
      const onMount = await resolveQrl(hostElement, onMountQrl);
      const componentProps = Object.assign(getProps(hostElement), props);
      const invokeCtx = newInvokeContext(hostElement);
      return useInvoke(invokeCtx, onMount, componentProps);
    };
    return h(tagName, { 'on:qRender': onRenderFactory, ...props }) as any;
  };
}

// <docs markdown="./component.public.md#component">
// !!DO NOT EDIT THIS COMMENT DIRECTLY!!! (edit ./component.public.md instead)
/**
 * Declare a Qwik component that can be used to create UI.
 * 
 * Use `component` (and `component$`) to declare a Qwik component. Qwik component is a special
 * kind of component that allows the Qwik framework to lazy load and executed the component
 * independently of other Qwik components as well as lazy load the component's life-cycle hooks
 * and event handlers.
 * 
 * Side note: You can also declare regular (standard JSX) components that will have standard
 * synchronous behavior.
 * 
 * Qwik component is a facade that describes how the component should be used without forcing the
 * implementation of the component to be eagerly loaded. A minimum Qwik definition consists of:
 * 
 * - Component `onMount` method, which needs to return an
 * - `onRender` closure which constructs the component's JSX.
 * 
 * ### Example:
 * 
 * Example showing how to create a counter component.
 * 
 * ```typescript
 * export const Counter = component$((props: { value?: number; step?: number }) => {
 *   const state = useStore({ count: props.value || 0 });
 *   return onRender$(() => (
 *     <div>
 *       <span>{state.count}</span>
 *       <button on$:click={() => (state.count += props.step || 1)}>+</button>
 *     </div>
 *   ));
 * });
 * ```
 * 
 * - `component$` is how a component gets declared.
 * - `{ value?: number; step?: number }` declares the public (props) interface of the component.
 * - `{ count: number }` declares the private (state) interface of the component.
 * - `onMount` closure: is used to create data store (see: `useStore`);
 * - `onRender$`: is required hook for rendering the component.
 * - `$`: mark which parts of the component will be lazy-loaded. (see `$` for details.)
 * 
 * The above can than be used like so:
 * 
 * ```typescript
 * export const OtherComponent = component$(() => {
 *   return onRender$(() => <Counter value={100} />);
 * });
 * ```
 * 
 * See also: `component`, `onRender`, `onUnmount`, `onHydrate`, `onDehydrate`, `onHalt`,
 * `onResume`, `on`, `onDocument`, `onWindow`, `withStyles`, `withScopedStyles`
 * 
 * @param tagName: Optional element tag-name to be used for the component's host element.
 * @param onMount: Initialization closure used when the component is first created.
 * 
 * @public
 */
// </docs>
export function component$<PROPS>(
  onMount: (props: PROPS) => ReturnType<typeof onRender>
): (props: PROPS) => JSXNode<PROPS> {
  return component($(onMount));
}

type OnMountFn<PROPS> = (props: PROPS) => ReturnType<typeof onRender>;

function resolveQrl<PROPS extends {}>(
  hostElement: Element,
  onMountQrl: QRL<OnMountFn<PROPS>>
): Promise<OnMountFn<PROPS>> {
  return onMountQrl.symbolRef
    ? Promise.resolve(onMountQrl.symbolRef!)
    : Promise.resolve(null).then(() => {
        return qrlImport<OnMountFn<PROPS>>(hostElement, onMountQrl);
      });
}

function _withStyles(styles: QRL<string>, scoped: boolean) {
  const styleQrl = toQrlOrError(styles);
  const styleId = styleKey(styleQrl);
  const hostElement = useHostElement();
  if (scoped) {
    hostElement.setAttribute(AttributeMarker.ComponentScopedStyles, styleId);
  }

  useWaitOn(
    qrlImport(hostElement, styleQrl).then((styleText) => {
      const document = hostElement.ownerDocument;
      const head = document.querySelector('head');
      if (head && !head.querySelector(`style[q\\:style="${styleId}"]`)) {
        const style = document.createElement('style');
        style.setAttribute('q:style', styleId);
        style.textContent = scoped ? styleText.replace(/�/g, styleId) : styleText;
        head.appendChild(style);
      }
    })
  );
}
