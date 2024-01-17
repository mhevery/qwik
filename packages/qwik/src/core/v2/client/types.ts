/** @file Public types for the client deserialization */

import type { ContainerState } from '../../container/container';

export interface ClientContainer {
  document: QDocument;
  containerState: ContainerState;
  element: ContainerElement;
  qContainer: string;
  qVersion: string;
  qBase: string;
  qLocale: string;
  qManifestHash: string;
  rootVNode: ElementVNode;
  readonly getObjectById: (id: number | string) => any;
}

export interface ContainerElement extends HTMLElement {
  qContainer?: ClientContainer;
  /**
   * Map of element ID to Element. If VNodeData has a reference to an element, then it is added to
   * this map for later retrieval.
   *
   * Once retrieved the element is replaced with its VNode.
   *
   * NOTE: This map leaks memory! Once the application is resumed we don't know which element IDs
   * are still in the deserialized state. we will probably need a GC cycle. Some process running in
   * the idle time which processes few elements at a time to see if they are still referenced and
   * removes them from the map if they are not.
   */
  qVNodeRefs: Map<number, Element | ElementVNode>;
}

export interface QDocument extends Document {
  /*
   * Map of Element to VNodeData.
   *
   * This map is used to rebuild virtual nodes from the HTML. Missing extra text nodes, and Fragments.
   */
  qVNodeData: WeakMap<Element, string>;
}

export interface QNode extends Node {
  qVNode?: VNode;
}

/**
 * Flags for VNode.
 *
 * # Materialize vs Inflation
 *
 * - Materialized: The node has all of its children. Specifically `firstChild`/`lastChild` are NOT
 *   `undefined`. Materialization creates lazy instantiation of the children. NOTE: Only
 *   ElementVNode and need to be materialized.
 * - Inflation:
 *
 *   - If Text: It means that it is safe to write to the node. When Text nodes are first Deserialized
 *       multiple text nodes can share the same DOM node. On write the sibling text nodes need to be
 *       converted into separate text nodes.
 *   - If Element: It means that the element tag attributes have not yet been read from the DOM.
 *
 * Inflation and materialization are not the same, they are two independent things.
 */
export const enum VNodeFlags {
  Element /* ****************** */ = 0b0001,
  Virtual /* ****************** */ = 0b0010,
  ELEMENT_OR_VIRTUAL_MASK /* ** */ = 0b0011,
  ELEMENT_OR_TEXT_MASK /* ***** */ = 0b0101,
  TYPE_MASK /* **************** */ = 0b0111,
  Text /* ********************* */ = 0b0100,
  /// Extra flag which marks if a node needs to be inflated.
  Inflated /* ***************** */ = 0b1000,
}

export const enum VNodeProps {
  flags = 0,
  parent = 1,
  previousSibling = 2,
  nextSibling = 3,
}

export const enum ElementVNodeProps {
  firstChild = 4,
  lastChild = 5,
  element = 6,
  elementName = 7,
  PROPS_OFFSET = 8,
}

export type ElementVNode = [
  /// COMMON: VNodeProps
  VNodeFlags.Element, ////////////// 0 - Flags
  VNode | null, /////////////// 1 - Parent
  VNode | null, /////////////// 2 - Previous sibling
  VNode | null, /////////////// 3 - Next sibling
  /// SPECIFIC: ElementVNodeProps
  VNode | null | undefined, /// 4 - First child - undefined if children need to be materialize
  VNode | null | undefined, /// 5 - Last child - undefined if children need to be materialize
  Element, //////////////////// 6 - Element
  string | undefined, ///////// 7 - tag
  /// Props
  ...(string | null)[], /////// 8 - attrs
] & { __brand__: 'ElementVNode' };

export const enum TextVNodeProps {
  node = 4,
  text = 5,
}

export type TextVNode = [
  /// COMMON: VNodeProps
  VNodeFlags.Text | VNodeFlags.Inflated, // 0 - Flags
  VNode | null, ///////////////// 1 - Parent
  VNode | null, ///////////////// 2 - Previous sibling
  VNode | null, ///////////////// 3 - Next sibling
  /// SPECIFIC: TextVNodeProps
  Text | null | undefined, ////// 4 - TextNode or SharedTextNode if Flags.SharedText
  string, /////////////////////// 5 - text content
] & { __brand__: 'TextVNode' };

export const enum VirtualVNodeProps {
  firstChild = ElementVNodeProps.firstChild,
  lastChild = ElementVNodeProps.lastChild,
  PROPS_OFFSET = 6,
}

export type VirtualVNode = [
  /// COMMON: VNodeProps
  VNodeFlags.Virtual, ///////////// 0 - Flags
  VNode | null, /////////////// 1 - Parent
  VNode | null, /////////////// 2 - Previous sibling
  VNode | null, /////////////// 3 - Next sibling
  /// SPECIFIC: VirtualVNodeProps
  VNode | null, /////////////// 4 - First child
  VNode | null, /////////////// 5 - Last child
  /// Props
  ...(string | null)[], /////// 6 - attrs
] & { __brand__: 'FragmentNode' };

export type VNode = ElementVNode | TextVNode | VirtualVNode;
