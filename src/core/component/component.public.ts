import { toQrlOrError } from '../import/qrl';
import { $, implicit$FirstArg, QRL, qrlImport } from '../import/qrl.public';
import type { qrlFactory } from '../props/props-on';
import { getProps } from '../props/props.public';
import { h } from '../render/jsx/factory';
import type { JSXNode } from '../render/jsx/types/jsx-node';
import { newInvokeContext, useInvoke, useWaitOn } from '../use/use-core';
import { useHostElement } from '../use/use-host-element.public';
import { AttributeMarker } from '../util/markers';
import { styleKey } from './qrl-styles';

/**
 * @public
 */
export function onUnmount(unmountFn: QRL<() => void>): void {
  throw new Error('IMPLEMENT: onUnmount' + unmountFn);
}

/**
 * @public
 */
export const onUnmount$ = implicit$FirstArg(onUnmount);

/**
 * @public
 */
export function onResume(resumeFn: QRL<() => void>): void {
  throw new Error('IMPLEMENT: onRender' + resumeFn);
}

/**
 * @public
 */
export const onResume$ = implicit$FirstArg(onResume);

/**
 * @public
 */
export function onHalt(haltFn: QRL<() => void>): void {
  throw new Error('IMPLEMENT: onRender' + haltFn);
}

/**
 * @public
 */
export const onHalt$ = implicit$FirstArg(onHalt);

/**
 * @public
 */
export function onHydrate(hydrateFn: QRL<() => void>): void {
  throw new Error('IMPLEMENT: onHydrate' + hydrateFn);
}

/**
 * @public
 */
export const onHydrate$ = implicit$FirstArg(onHydrate);

/**
 * @public
 */
export function onDehydrate(dehydrateFn: QRL<() => void>): void {
  throw new Error('IMPLEMENT: onDehydrate' + dehydrateFn);
}

/**
 * @public
 */
export const onDehydrate$ = implicit$FirstArg(onDehydrate);

/**
 * @public
 */
export function onRender(renderFn: QRL<() => JSXNode>): QRL<() => JSXNode> {
  return toQrlOrError(renderFn);
}

/**
 * @public
 */
export const onRender$ = implicit$FirstArg(onRender);

/**
 * @public
 */
export function on(event: string, eventFn: QRL<() => void>): QRL<() => void> {
  throw new Error('IMPLEMENT: on' + eventFn);
}

/**
 * @public
 */
export function onDocument(event: string, eventFn: QRL<() => void>): QRL<() => void> {
  throw new Error('IMPLEMENT: onDocument' + eventFn);
}

/**
 * @public
 */
export function onWindow(event: string, eventFn: QRL<() => void>): QRL<() => void> {
  throw new Error('IMPLEMENT: onWindow' + eventFn);
}

/**
 * @public
 */
export function withStyles(styles: QRL<string>): void {
  _withStyles(styles, false);
}

/**
 * @public
 */
export const withStyles$ = implicit$FirstArg(withStyles);

/**
 * @public
 */
export function withScopedStyles(styles: QRL<string>): void {
  _withStyles(styles, true);
}

/**
 * @public
 */
export const withScopedStyles$ = implicit$FirstArg(withScopedStyles);

type OnMountFn<PROPS> = (props: PROPS) => ReturnType<typeof onRender>;

/**
 * @public
 */
export type PropsOf<COMP extends (props: any) => JSXNode> = COMP extends (
  props: infer PROPS
) => JSXNode<any>
  ? PROPS
  : never;

/**
 * @public
 */
export function component<PROPS extends {}>(
  tagName: string,
  onMount: QRL<(props: PROPS) => ReturnType<typeof onRender>>
): (props: PROPS) => JSXNode<PROPS>;
/**
 * @public
 */
export function component<PROPS extends {}>(
  onMount: QRL<(props: PROPS) => ReturnType<typeof onRender>>
): (props: PROPS) => JSXNode<PROPS>;
/**
 * @public
 */
export function component<PROPS extends {}>(
  tagNameOrONMount: string | QRL<OnMountFn<PROPS>>,
  onMount?: QRL<OnMountFn<PROPS>>
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

/**
 *
 * @public
 */
export function component$<PROPS>(onMount: OnMountFn<PROPS>): (props: PROPS) => JSXNode<PROPS> {
  return component($(onMount));
}

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
