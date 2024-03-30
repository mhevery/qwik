/* eslint-disable @typescript-eslint/no-restricted-imports */
/**
 * @file
 *
 *   Importing directly from `qwik` is not allowed because the SSR package would end up with two
 *   copies of the code. Instead, the SSR package should import from `@builder.io/qwik`.
 *
 *   The exception to this rule is importing types, because those get elided by TypeScript. To make
 *   ensuring that this rule is followed, this file is the only place where relative `../` imports
 *   of types only are allowed.
 *
 *   Sum code we are OK by importing and making a copy because it will have no adverse affect. This
 *   file lists code which we are OK to have duplicated.
 */

export {
  ELEMENT_ID,
  ELEMENT_KEY,
  ELEMENT_PROPS,
  ELEMENT_SEQ,
  OnRenderProp,
  QCtxAttr,
  QScopedStyle,
  QSlot,
  QSlotParent,
  QSlotRef,
  QStyle,
} from '../core/util/markers';
export { mapApp_remove, mapArray_get, mapArray_set } from '../core/v2/client/vnode';
export { maybeThen } from '../core/util/promises';
export { DEBUG_TYPE, VirtualType } from '../core/v2/shared/types';
export {
  convertStyleIdsToString,
  getScopedStyleIdsAsPrefix,
  isClassAttr,
} from '../core/v2/shared/scoped-styles';
export { SubscriptionType } from '../core/state/common';
export { serializeClass, stringifyStyle } from '../core/render/execute-component';
export { VNodeDataChar } from '../core/v2/shared/vnode-data-types';