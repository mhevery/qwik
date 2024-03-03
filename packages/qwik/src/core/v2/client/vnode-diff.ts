import { isDev } from '@builder.io/qwik/build';
import { type OnRenderFn } from '../../component/component.public';
import { SERIALIZABLE_STATE } from '../../container/serializers';
import { assertDefined, assertFalse, assertTrue } from '../../error/assert';
import type { QRLInternal } from '../../qrl/qrl-class';
import { Fragment, JSXNodeImpl, isJSXNode } from '../../render/jsx/jsx-runtime';
import { Slot } from '../../render/jsx/slot.public';
import type { JSXNode, JSXOutput } from '../../render/jsx/types/jsx-node';
import type { JSXChildren } from '../../render/jsx/types/jsx-qwik-attributes';
import { SubscriptionType } from '../../state/common';
import { isSignal } from '../../state/signal';
import { trackSignal } from '../../use/use-core';
import { EMPTY_ARRAY, EMPTY_OBJ } from '../../util/flyweight';
import { throwErrorAndStop } from '../../util/log';
import { ELEMENT_KEY, ELEMENT_PROPS, OnRenderProp, QSlot, QSlotParent } from '../../util/markers';
import { isPromise } from '../../util/promises';
import type { ValueOrPromise } from '../../util/types';
import { executeComponent2 } from '../shared/component-execution';
import {
  getEventNameFromJsxProp,
  getEventNameScopeFromJsxProp,
  isHtmlAttributeAnEventName,
  isJsxPropertyAnEventName,
} from '../shared/event-names';
import type { QElement2, fixMeAny } from '../shared/types';
import { DEBUG_TYPE, VirtualType } from '../shared/types';
import type { SsrAttrs } from '../ssr/types';
import type { DomContainer } from './dom-container';
import {
  ElementVNodeProps,
  VNodeProps,
  type ClientContainer,
  type ElementVNode,
  type TextVNode,
  type VNode,
  type VirtualVNode,
} from './types';
import {
  mapApp_findIndx,
  mapArray_set,
  vnode_ensureElementInflated,
  vnode_getElementName,
  vnode_getFirstChild,
  vnode_getNextSibling,
  vnode_getNode,
  vnode_getParent,
  vnode_getProjectionParentComponent,
  vnode_getProp,
  vnode_getText,
  vnode_getType,
  vnode_insertBefore,
  vnode_isElementVNode,
  vnode_isTextVNode,
  vnode_isVirtualVNode,
  vnode_newElement,
  vnode_newText,
  vnode_newVirtual,
  vnode_remove,
  vnode_setAttr,
  vnode_setProp,
  vnode_setText,
  vnode_truncate,
} from './vnode';

export type VNodeJournalEntry = VNodeJournalOpCode | VNode | null | string;

export const enum VNodeJournalOpCode {
  ////////// Generic

  /// ENCODING
  Insert,
  Truncate,
  Remove,
  Move,
  ////////// TEXT
  TextSet,
  ////////// Element
  ElementInsert,
  Attributes,
  Props,
  ////////// Fragment
  FragmentInsert,
}

export type ComponentQueue = Array<VNode>;

export const vnode_diff = (container: ClientContainer, jsxNode: JSXOutput, vStartNode: VNode) => {
  const journal = (container as DomContainer).$journal$;

  /**
   * Stack is used to keep track of the state of the traversal.
   *
   * We push current state into the stack before descending into the child, and we pop the state
   * when we are done with the child.
   */
  const stack: any[] = [];

  const asyncQueue: Array<VNode | ValueOrPromise<JSXOutput>> = [];

  ////////////////////////////////
  //// Traverse state variables
  ////////////////////////////////
  let vParent: VNode = null!;
  /// Current node we compare against. (Think of it as a cursor.)
  /// (Node can be null, if we are at the end of the list.)
  let vCurrent: VNode | null = null;
  /// When we insert new node we start it here so that we can descend into it.
  /// NOTE: it can't be stored in `vCurrent` because `vNewCurrent` is in journal
  /// and is not connected to the tree.
  let vNewNode: VNode | null = null;
  /// When elements have keys they can be consumed out of order and therefore we can't use nextSibling.
  /// In such a case this array will contain the elements after the current location.
  /// The array even indices will contains keys and odd indices the vNode.
  let vSiblings: Array<string | null | VNode> | null = null;
  let vSiblingsIdx = -1;
  /// Current set of JSX children.
  let jsxChildren: any[] = null!;
  // Current JSX child.
  let jsxValue: any = null;
  let jsxIdx = 0;
  let jsxCount = 0;
  // When we descend into children, we need to skip advance() because we just descended.
  let shouldAdvance = true;
  ////////////////////////////////

  diff(jsxNode, vStartNode);
  return drainAsyncQueue();

  //////////////////////////////////////////////
  //////////////////////////////////////////////
  //////////////////////////////////////////////

  function diff(jsxNode: JSXOutput, vStartNode: VNode) {
    vParent = vStartNode;
    vNewNode = null;
    vCurrent = vnode_getFirstChild(vStartNode);
    stackPush(jsxNode, true);
    while (stack.length) {
      while (jsxIdx < jsxCount) {
        assertFalse(vParent === vCurrent, "Parent and current can't be the same");
        if (typeof jsxValue === 'string') {
          expectText(jsxValue);
        } else if (typeof jsxValue === 'number') {
          expectText(String(jsxValue));
        } else if (typeof jsxValue === 'object') {
          if (Array.isArray(jsxValue)) {
            descend(jsxValue, false);
          } else if (isSignal(jsxValue)) {
            expectVirtual(VirtualType.DerivedSignal);
            descend(
              trackSignal(jsxValue, [
                SubscriptionType.TEXT_MUTABLE,
                vCurrent || (vNewNode as fixMeAny), // This should be host, but not sure why
                jsxValue,
                vCurrent || (vNewNode as fixMeAny),
              ]),
              true
            );
          } else if (isPromise(jsxValue)) {
            expectVirtual(VirtualType.Awaited);
            asyncQueue.push(jsxValue, vNewNode || vCurrent);
          } else if (isJSXNode(jsxValue)) {
            const type = jsxValue.type;
            if (typeof type === 'string') {
              expectNoMoreTextNodes();
              expectElement(jsxValue, type);
              descend(jsxValue.children, true);
            } else if (typeof type === 'function') {
              if (type === Fragment) {
                expectNoMoreTextNodes();
                expectVirtual(VirtualType.Fragment);
                descend(jsxValue.children, true);
              } else if (type === Slot) {
                expectNoMoreTextNodes();
                if (!expectSlot()) {
                  // nothing to project, so try to render the Slot default content.
                  descend(jsxValue.children, true);
                }
              } else if (type === Projection) {
                expectProjection();
                descend(jsxValue.children, true);
              } else {
                // Must be a component
                expectNoMoreTextNodes();
                expectVirtual(VirtualType.Component);
                expectComponent(type);
              }
            } else {
              throwErrorAndStop(`Unsupported type: ${type}`);
            }
          } else {
            throwErrorAndStop(`Unsupported value: ${jsxValue}`);
          }
        } else {
          expectText('');
        }
        advance();
      }
      expectNoMore();
      ascend();
    }
  }

  function advance() {
    if (!shouldAdvance) {
      shouldAdvance = true;
      return;
    }
    jsxIdx++;
    if (jsxIdx < jsxCount) {
      jsxValue = jsxChildren[jsxIdx];
    } else if (stack[stack.length - 1] === false) {
      // this was special `descendVNode === false` so pop and try again
      return ascend();
    }
    if (vNewNode !== null) {
      // We have a new Node.
      // This means that the `vCurrent` was deemed not useful and we inserted in front of it.
      // This means that the next node we should look at is the `vCurrent` so just clear the
      // vNewNode  and try again.
      vNewNode = null;
    } else if (vSiblings !== null) {
      // We came across a key, and we moved nodes around. This means we can no longer use
      // `vnode_getNextSibling` to look at next node and instead we have to go by `vSiblings`.
      vSiblingsIdx += 2; // advance;
      vCurrent = vSiblingsIdx < vSiblings.length ? (vSiblings[vSiblingsIdx + 1] as any) : null;
    } else {
      // If we don't have a `vNewNode`, than that means we just reconciled the current node.
      // So advance it.
      vCurrent = vCurrent ? vnode_getNextSibling(vCurrent) : null;
    }
  }

  /**
   * @param children
   * @param descendVNode - If true we are descending into vNode; This is set to false if we come
   *   across an array in jsx, and we need to descend into the array without actually descending
   *   into the vNode.
   *
   *   Example:
   *
   *   ```
   *   <>
   *   before
   *   {[1,2].map((i) => <span>{i}</span>)}
   *   after
   *   </>
   * ```
   *
   *   In the above example all nodes are on same level so we don't `descendVNode` even thought there
   *   is an array produced by the `map` function.
   */
  function descend(children: any, descendVNode: boolean) {
    if (children == null) {
      expectNoChildren();
      return;
    }
    stackPush(children, descendVNode);
    if (descendVNode) {
      assertDefined(vCurrent || vNewNode, 'Expecting vCurrent to be defined.');
      vSiblings = null;
      vSiblingsIdx = -1;
      vParent = vNewNode || vCurrent!;
      vCurrent = vnode_getFirstChild(vParent);
      vNewNode = null;
    }
    shouldAdvance = false;
  }

  function ascend() {
    const descendVNode = stack.pop(); // boolean: descendVNode
    if (descendVNode) {
      vSiblingsIdx = stack.pop();
      vSiblings = stack.pop();
      vNewNode = stack.pop();
      vCurrent = stack.pop();
      vParent = stack.pop();
    }
    jsxValue = stack.pop();
    jsxCount = stack.pop();
    jsxIdx = stack.pop();
    jsxChildren = stack.pop();
    advance();
  }

  function stackPush(children: any, descendVNode: boolean) {
    stack.push(jsxChildren, jsxIdx, jsxCount, jsxValue);
    if (descendVNode) {
      stack.push(vParent, vCurrent, vNewNode, vSiblings, vSiblingsIdx);
    }
    stack.push(descendVNode);
    if (Array.isArray(children)) {
      jsxIdx = 0;
      jsxCount = children.length;
      jsxChildren = children;
      jsxValue = jsxCount > 0 ? children[0] : null;
    } else if (children === undefined) {
      // no children
      jsxIdx = 0;
      jsxValue = null;
      jsxChildren = null!;
      jsxCount = 0;
    } else {
      jsxIdx = 0;
      jsxValue = children;
      jsxChildren = null!;
      jsxCount = 1;
    }
  }

  function getInsertBefore() {
    if (vNewNode) {
      return vCurrent;
    } else if (vSiblings !== null) {
      const nextIdx = vSiblingsIdx + 3; // 2 plus 1 for node offset
      return nextIdx < vSiblings.length ? vSiblings[nextIdx] : null;
    } else {
      return vCurrent && vnode_getNextSibling(vCurrent);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  function descendProjection(children: JSXChildren) {
    if (children) {
      if (!Array.isArray(children)) {
        children = [children];
      }
      if (children.length) {
        const projection: Array<string | JSXNode> = [];
        /// STEP 1: Bucketize the children based on the projection name.
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const slotName = String((isJSXNode(child) && child.props[QSlot]) || '');
          const idx = mapApp_findIndx(projection, slotName, 0);
          let jsxBucket: JSXNodeImpl<typeof Projection>;
          if (idx >= 0) {
            jsxBucket = projection[idx + 1] as any;
          } else {
            projection.splice(
              ~idx,
              0,
              slotName,
              (jsxBucket = new JSXNodeImpl(Projection, EMPTY_OBJ, null, [], 0, slotName))
            );
          }
          (jsxBucket.children as JSXChildren[]).push(child);
        }
        /// STEP 2: remove the names
        for (let i = projection.length - 2; i >= 0; i = i - 2) {
          projection.splice(i, 1);
        }
        descend(projection, true);
        return true;
      }
    }
    return false;
  }

  function expectProjection() {
    const slotName = jsxValue.key as string;
    // console.log('expectProjection', JSON.stringify(slotName));
    vCurrent = vnode_getProp<VirtualVNode | null>(
      vParent, // The parent is the component and it should have our portal.
      slotName,
      container.$getObjectById$
    );
    if (vCurrent == null) {
      vNewNode = vnode_newVirtual(vParent);
      vnode_setProp(vNewNode as VirtualVNode, QSlot, slotName);
      vnode_setProp(vNewNode as VirtualVNode, QSlotParent, vParent);
      vnode_setProp(vParent as VirtualVNode, slotName, vNewNode);
    }
  }

  function expectSlot() {
    const slotNameKey: string = jsxValue.props.name || '';
    // console.log('expectSlot', JSON.stringify(slotNameKey));
    const vHost = vnode_getProjectionParentComponent(vParent, container.$getObjectById$);
    const vProjectedNode = vnode_getProp<VirtualVNode | null>(
      vHost,
      slotNameKey,
      container.$getObjectById$
    );
    // console.log('   ', String(vHost), String(vProjectedNode));
    if (vProjectedNode == null) {
      // Nothing to project, so render content of the slot.
      journal.push(
        VNodeJournalOpCode.Insert,
        vParent,
        (vNewNode = vnode_newVirtual(vParent)),
        vCurrent && getInsertBefore()
      );
      return false;
    } else if (vProjectedNode === vCurrent) {
      // All is good.
      // console.log('  NOOP', String(vCurrent));
    } else {
      /// We have to ensure that the projected node is correctly linked into the tree.
      /// We need this because we need to be able to walk the context even before the
      /// journal is processed.
      vProjectedNode[VNodeProps.parent] = vParent;
      journal.push(
        VNodeJournalOpCode.Insert,
        vParent,
        (vNewNode = vProjectedNode),
        vCurrent && getInsertBefore()
      );
    }
    return true;
  }

  function drainAsyncQueue(): ValueOrPromise<void> {
    while (asyncQueue.length) {
      const jsxNode = asyncQueue.shift() as ValueOrPromise<JSXNode>;
      const vHostNode = asyncQueue.shift() as VNode;
      if (isPromise(jsxNode)) {
        return jsxNode.then((jsxNode) => {
          diff(jsxNode, vHostNode);
          return drainAsyncQueue();
        });
      } else {
        diff(jsxNode, vHostNode);
      }
    }
  }

  function expectNoChildren() {
    let vChild = vCurrent && vnode_getFirstChild(vCurrent);
    if (vChild !== null) {
      journal.push(VNodeJournalOpCode.Truncate, vCurrent, vChild);
      while (vChild) {
        container.$scheduler$.$drainCleanup$(vChild as fixMeAny);
        vChild = vnode_getNextSibling(vChild);
      }
    }
  }

  function expectNoMore() {
    assertFalse(vParent === vCurrent, "Parent and current can't be the same");
    if (vCurrent !== null) {
      journal.push(VNodeJournalOpCode.Truncate, vParent, vCurrent);
      let vChild: VNode | null = vCurrent;
      while (vChild) {
        container.$scheduler$.$drainCleanup$(vChild as fixMeAny);
        vChild = vnode_getNextSibling(vChild);
      }
    }
  }

  function expectNoMoreTextNodes() {
    while (vCurrent !== null && vnode_getType(vCurrent) === 3 /* Text */) {
      journal.push(VNodeJournalOpCode.Remove, vParent, vCurrent);
      vCurrent = vnode_getNextSibling(vCurrent);
      container.$scheduler$.$drainCleanup$(vCurrent as fixMeAny);
    }
  }

  function expectElement(jsx: JSXNode<any>, tag: string) {
    const isSameTagName =
      vCurrent && vnode_isElementVNode(vCurrent) && tag === vnode_getElementName(vCurrent);
    let jsxKey: any = null;
    if (
      isSameTagName &&
      (jsxKey = jsx.key) == vnode_getProp(vCurrent as ElementVNode, ELEMENT_KEY, null)
    ) {
      // All is good.
    } else if (jsxKey !== null) {
      // So we have a key and it does not match the current node.
      // We need to do a forward search to find it.
      // The complication is that once we start taking nodes out of order we can't use `vnode_getNextSibling`
      vNewNode = retrieveChildWithKey(jsxKey);
      if (vNewNode === null) {
        // No existing node with key exists, just create a new one.
        journal.push(
          VNodeJournalOpCode.Insert,
          vParent,
          (vNewNode = vnode_newElement(vParent, container.document.createElement(tag), tag)),
          vCurrent
        );
      } else {
        // Existing keyed node
        journal.push(VNodeJournalOpCode.Move, vParent, vNewNode, vCurrent);
      }
    } else {
      journal.push(
        VNodeJournalOpCode.Insert,
        vParent,
        (vNewNode = vnode_newElement(vParent, container.document.createElement(tag), tag)),
        vCurrent
      );
    }
    // reconcile attributes
    let jsxAttrs = (jsx as any as { attrs: SsrAttrs }).attrs;
    if (jsxAttrs === EMPTY_ARRAY) {
      const props = (jsx as JSXNode).props;
      for (const key in props) {
        if (jsxAttrs === EMPTY_ARRAY) {
          jsxAttrs = (jsx as any as { attrs: SsrAttrs }).attrs = [];
        }
        mapArray_set(jsxAttrs, key, props[key], 0);
      }
      const jsxKey = jsx.key;
      if (jsxKey !== null) {
        if (jsxAttrs === EMPTY_ARRAY) {
          jsxAttrs = (jsx as any as { attrs: SsrAttrs }).attrs = [ELEMENT_KEY, jsxKey];
        } else {
          mapArray_set(jsxAttrs, ELEMENT_KEY, jsxKey, 0);
        }
      }
    }
    setBulkProps((vNewNode || vCurrent) as ElementVNode, jsxAttrs);
  }

  function setBulkProps(vnode: ElementVNode, srcAttrs: SsrAttrs) {
    vnode_ensureElementInflated(vnode);
    const dstAttrs = vnode as SsrAttrs;
    let hasDiffs = false;
    let srcIdx = 0;
    const srcLength = srcAttrs.length;
    let dstIdx = ElementVNodeProps.PROPS_OFFSET;
    const dstLength = dstAttrs.length;
    let srcKey: string | null = srcIdx < srcLength ? srcAttrs[srcIdx++] : null;
    let dstKey: string | null = dstIdx < dstLength ? dstAttrs[dstIdx++] : null;
    let patchEventDispatch = false;
    const record = (key: string, value: any) => {
      if (!hasDiffs) {
        journal.push(VNodeJournalOpCode.Attributes, vnode);
        hasDiffs = true;
      }
      journal.push(key, value);
    };
    while (srcKey !== null || dstKey !== null) {
      if (srcKey == null) {
        // Source has more keys, so we need to remove them from destination
        if (dstKey && isHtmlAttributeAnEventName(dstKey)) {
          patchEventDispatch = true;
        } else {
          record(dstKey!, null);
        }
        dstIdx++; // skip the destination value, we don't care about it.
        dstKey = dstIdx < dstLength ? dstAttrs[dstIdx++] : null;
      } else if (dstKey == null) {
        // Destination has more keys, so we need to insert them from source.
        const isEvent = isJsxPropertyAnEventName(srcKey);
        if (isEvent) {
          // Special handling for events
          patchEventDispatch = true;
          const eventName = getEventNameFromJsxProp(srcKey);
          const scope = getEventNameScopeFromJsxProp(srcKey);
          record(':' + scope + ':' + eventName, srcAttrs[srcIdx]);
        } else {
          record(srcKey!, srcAttrs[srcIdx]);
        }
        srcIdx++;
        srcKey = srcIdx < srcLength ? srcAttrs[srcIdx++] : null;
      } else if (srcKey == dstKey) {
        const srcValue = srcAttrs[srcIdx++];
        const dstValue = dstAttrs[dstIdx++];
        if (srcValue !== dstValue) {
          record(dstKey, srcValue);
        }
        srcKey = srcIdx < srcLength ? srcAttrs[srcIdx++] : null;
        dstKey = dstIdx < dstLength ? dstAttrs[dstIdx++] : null;
      } else if (srcKey < dstKey) {
        // Destination is missing the key, so we need to insert it.
        if (isJsxPropertyAnEventName(srcKey)) {
          // Special handling for events
          patchEventDispatch = true;
          const eventName = getEventNameFromJsxProp(srcKey);
          const scope = getEventNameScopeFromJsxProp(srcKey);
          record(':' + scope + ':' + eventName, srcAttrs[srcIdx]);
        } else {
          record(srcKey, srcAttrs[srcIdx]);
        }
        srcIdx++;
        // advance srcValue
        srcKey = srcIdx < srcLength ? srcAttrs[srcIdx++] : null;
      } else {
        // Source is missing the key, so we need to remove it from destination.
        if (isHtmlAttributeAnEventName(dstKey)) {
          patchEventDispatch = true;
        } else {
          record(dstKey!, null);
        }
        dstIdx++; // skip the destination value, we don't care about it.
        dstKey = dstIdx < dstLength ? dstAttrs[dstIdx++] : null;
      }
    }
    if (patchEventDispatch) {
      const element = vnode_getNode(vnode) as QElement2;
      if (!element.qDispatchEvent) {
        element.qDispatchEvent = (event: Event) => {
          let eventName = event.type;
          let scope = '';
          if (eventName.startsWith(':')) {
            // :document:event or :window:event
            const colonIndex = eventName.substring(1).indexOf(':');
            scope = eventName.substring(1, colonIndex + 1);
            eventName = eventName.substring(colonIndex + 2);
          }

          const eventProp = ':' + scope + ':' + eventName;
          const qrls = vnode_getProp(vnode, eventProp, null);
          let returnValue = false;
          qrls &&
            (Array.isArray(qrls) ? qrls : [qrls]).forEach((qrl) => {
              const value = qrl(event);
              returnValue = returnValue || value === true;
            });
          return returnValue;
        };
      }
    }
  }

  function retrieveChildWithKey(key: string): ElementVNode | VirtualVNode | null {
    let vNodeWithKey: ElementVNode | VirtualVNode | null = null;
    if (vSiblingsIdx === -1) {
      // it is not materialized; so materialize it.
      vSiblings = [];
      vSiblingsIdx = 0;
      let vNode = vCurrent;
      while (vNode) {
        const vKey = vnode_getProp<string>(vNode, ELEMENT_KEY, null);
        if (vNodeWithKey === null && vKey == key) {
          vNodeWithKey = vNode as ElementVNode | VirtualVNode;
        } else {
          // we only add the elements which we did not find yet.
          vSiblings.push(vKey, vNode);
        }
        vNode = vnode_getNextSibling(vNode);
      }
    } else {
      for (let idx = vSiblingsIdx; idx < vSiblings!.length; idx += 2) {
        const vKey = vSiblings![idx];
        if (vKey == key) {
          vNodeWithKey = vSiblings![idx + 1] as any;
          // remove the node from the siblings array
          vSiblings?.splice(idx, 2);
          break;
        }
      }
    }
    return vNodeWithKey;
  }

  function expectVirtual(type: VirtualType) {
    if (vCurrent && vnode_isVirtualVNode(vCurrent)) {
      // All is good.
    } else {
      journal.push(
        VNodeJournalOpCode.Insert,
        vParent,
        (vNewNode = vnode_newVirtual(vParent)),
        vCurrent && getInsertBefore()
      );
    }
    isDev && vnode_setProp((vNewNode || vCurrent) as VirtualVNode, DEBUG_TYPE, type);
  }

  function expectComponent(component: Function) {
    const componentMeta = (component as any)[SERIALIZABLE_STATE] as [QRLInternal<OnRenderFn<any>>];
    const host = (vNewNode || vCurrent) as VirtualVNode;
    const vNodeQrl = vnode_getProp<QRLInternal>(host, OnRenderProp, container.$getObjectById$);
    const jsxProps = jsxValue.props;
    if (componentMeta) {
      let shouldRender = false;
      // Component
      const [componentQRL] = componentMeta;
      if (componentQRL.$hash$ !== vNodeQrl?.$hash$) {
        vnode_setProp(host, OnRenderProp, componentQRL);
        shouldRender = true;
      }
      const vNodeProps = vnode_getProp<any>(host, ELEMENT_PROPS, container.$getObjectById$);
      shouldRender = shouldRender || !shallowEqual(jsxProps, vNodeProps);
      if (shouldRender) {
        const jsx = container.$scheduler$
          .$scheduleComponent$(host, componentQRL, jsxProps)
          .$drainComponent$(host);
        asyncQueue.push(jsx, host);
      }
      descendProjection(jsxValue.children);
    } else {
      // Inline Component
      isDev &&
        vnode_setProp(
          (vNewNode || vCurrent) as VirtualVNode,
          DEBUG_TYPE,
          VirtualType.InlineComponent
        );
      let component$Host: VNode = host;
      // Find the closest component host which has `OnRender` prop.
      while (
        component$Host && vnode_isVirtualVNode(component$Host)
          ? vnode_getProp(component$Host, OnRenderProp, null) === null
          : true
      ) {
        component$Host = vnode_getParent(component$Host)!;
      }
      const jsxOutput = executeComponent2(
        container,
        host,
        component$Host as fixMeAny,
        component as OnRenderFn<any>,
        jsxProps
      );
      asyncQueue.push(jsxOutput, host);
    }
  }

  function expectText(text: string) {
    if (vCurrent !== null) {
      const type = vnode_getType(vCurrent);
      if (type === 3 /* Text */) {
        if (text !== vnode_getText(vCurrent as TextVNode)) {
          journal.push(VNodeJournalOpCode.TextSet, vCurrent, text);
          return;
        }
        return;
      }
    }
    journal.push(
      VNodeJournalOpCode.Insert,
      vParent,
      (vNewNode = vnode_newText(vParent, container.document.createTextNode(text), text)),
      vCurrent
    );
  }
};

export const vnode_applyJournal = (journal: VNodeJournalEntry[]) => {
  let idx = 0;
  while (idx < journal.length) {
    const opCode = journal[idx++] as number;
    assertTrue(typeof opCode === 'number', 'Expecting opCode to be a number.');
    switch (opCode) {
      case VNodeJournalOpCode.TextSet:
        vnode_setText(journal[idx++] as TextVNode, journal[idx++] as string);
        break;
      case VNodeJournalOpCode.Insert:
        vnode_insertBefore(
          journal[idx++] as ElementVNode | VirtualVNode,
          journal[idx++] as VNode,
          journal[idx++] as VNode
        );
        break;
      case VNodeJournalOpCode.Truncate:
        vnode_truncate(journal[idx++] as ElementVNode | VirtualVNode, journal[idx++] as VNode);
        break;
      case VNodeJournalOpCode.Remove:
        vnode_remove(journal[idx++] as ElementVNode | VirtualVNode, journal[idx++] as VNode, true);
        break;
      case VNodeJournalOpCode.Move:
        const vParent = journal[idx++] as ElementVNode | VirtualVNode;
        const vNodeToMove = journal[idx++] as VNode;
        const vNodeMoveInFrontOf = journal[idx++] as VNode | null;
        vnode_remove(vParent, vNodeToMove, false);
        vnode_insertBefore(vParent, vNodeToMove, vNodeMoveInFrontOf);
        break;
      case VNodeJournalOpCode.Attributes:
        const vnode = journal[idx++] as ElementVNode;
        let key: string | null = null;
        while (typeof (key = journal[idx] as string | null) === 'string') {
          idx++;
          const value = journal[idx++] as string | null;
          if (key.startsWith(':')) {
            vnode_setProp(vnode, key, value);
          } else {
            vnode_setAttr(vnode, key, value);
          }
        }
        break;
      case VNodeJournalOpCode.Props:
        const vElementOrText = journal[idx++] as VNode;
        const prop = journal[idx++] as string;
        const value = journal[idx++] as any;
        if (vnode_isTextVNode(vElementOrText)) {
          vnode_setText(vElementOrText, value);
        } else {
          vnode_setAttr(vElementOrText as ElementVNode, prop, value);
        }
        break;
      default:
        throwErrorAndStop(`Unsupported opCode: ${opCode}`);
    }
  }
  journal.length = 0;
};

/**
 * Marker class for JSX projection.
 *
 * Assume you have component like so
 *
 * ```
 * <SomeComponent>
 *   some-text
 *   <span q:slot="name">some more text</span>
 *   more-text
 * </SomeComponent>
 * ```
 *
 * Before the `<SomeCompetent/>` is processed its children are transformed into:
 *
 * ```
 *   <Projection q:slot="">
 *     some-text
 *     more-text
 *   </Projection>
 *   <Projection q:slot="name">
 *     <span q:slot="name">some more text</span>
 *   </Projection>
 * ```
 */
function Projection() {}

function shallowEqual(src: Record<string, any>, dst: Record<string, any>): boolean {
  if (!src || !dst) {
    return false;
  }
  let srcKeys = Object.keys(src);
  let dstKeys = Object.keys(dst);
  if (srcKeys.length !== dstKeys.length) {
    return false;
  }
  srcKeys = srcKeys.sort();
  dstKeys = dstKeys.sort();
  for (let idx = 0; idx < srcKeys.length; idx++) {
    const srcKey = srcKeys[idx];
    const dstKey = dstKeys[idx];
    if (srcKey !== dstKey || src[srcKey] !== dst[dstKey]) {
      return false;
    }
  }
  return true;
}
