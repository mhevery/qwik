import { Fragment, type JSXNode } from '@builder.io/qwik/jsx-runtime';
import { describe, expect, it } from 'vitest';
import { isJSXNode } from '../render/jsx/jsx-runtime';
import type { ElementVNode, QDocument, TextVNode, VNode } from './client/types';
import {
  vnode_getElementName,
  vnode_getFirstChild,
  vnode_getNextSibling,
  vnode_getParent,
  vnode_getProp,
  vnode_getPropKeys,
  vnode_getText,
  vnode_insertBefore,
  vnode_isElementVNode,
  vnode_isTextVNode,
  vnode_isVirtualVNode,
  vnode_newText,
  vnode_newUnMaterializedElement,
  vnode_setProp,
} from './client/vnode';
import { isStringifiable, type Stringifiable } from './shared-types';

import { createDocument } from '@builder.io/qwik-dom';
import type { VirtualVNode } from './client/types';

describe('vdom-diff.unit', () => {
  it('empty placeholder test to suppress warning', () => {});
});

interface CustomMatchers<R = unknown> {
  toMatchVDOM(expectedJSX: JSXNode): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
  toMatchVDOM(this: { isNot: boolean }, received: VNode, expected: JSXNode) {
    const { isNot } = this;
    const diffs = diffJsxVNode(received, expected);
    return {
      pass: isNot ? diffs.length !== 0 : diffs.length === 0,
      message: () => diffs.join('\n'),
    };
  },
});

function diffJsxVNode(received: VNode, expected: JSXNode | string, path: string[] = []): string[] {
  const diffs: string[] = [];
  if (typeof expected === 'string') {
    const receivedText = vnode_isTextVNode(received) ? vnode_getText(received as TextVNode) : null;
    if (expected !== receivedText) {
      diffs.push(path.join(' > '));
      diffs.push('EXPECTED', JSON.stringify(expected));
      diffs.push('RECEIVED:', JSON.stringify(receivedText));
    }
  } else {
    path.push(tagToString(expected.type));
    const receivedTag = vnode_isElementVNode(received)
      ? vnode_getElementName(received as ElementVNode)
      : vnode_isVirtualVNode(received)
        ? Fragment
        : undefined;
    const isTagSame = expected.type == receivedTag;
    if (!isTagSame) {
      diffs.push(path.join(' > ') + ' expecting= ' + expected.type + ' received=' + receivedTag);
    }
    const expectedProps = expected.props ? Object.keys(expected.props).sort() : [];
    const receivedProps = vnode_isElementVNode(received) ? vnode_getPropKeys(received).sort() : [];
    const allProps = new Set([...expectedProps, ...receivedProps]);
    allProps.delete('children');
    allProps.forEach((prop) => {
      if (prop.startsWith('on:')) {
        return;
      }
      const expectedValue = expected.props[prop];
      const receivedValue = vnode_getProp(received, prop);
      if (expectedValue !== receivedValue) {
        diffs.push(`${path.join(' > ')}: [${prop}]`);
        diffs.push('  EXPECTED: ' + JSON.stringify(expectedValue));
        diffs.push('  RECEIVED: ' + JSON.stringify(receivedValue));
      }
    });
    const receivedChildren = getVNodeChildren(received);
    const expectedChildren = getJSXChildren(expected);
    if (receivedChildren.length === expectedChildren.length) {
      for (let i = 0; i < receivedChildren.length; i++) {
        const receivedChild = receivedChildren[i];
        const expectedChild = expectedChildren[i];
        diffs.push(...diffJsxVNode(receivedChild, expectedChild, path));
      }
    } else {
      diffs.push(
        `${path.join(' > ')} expecting ${expectedChildren.length} children but was ${
          receivedChildren.length
        }`
      );
      diffs.push('EXPECTED', jsxToHTML(expected, '  '));
      diffs.push('RECEIVED:', vnodeToHTML(received, '  '));
    }
    path.pop();
  }
  return diffs;
}
function getJSXChildren(jsx: JSXNode): JSXNode[] {
  const children = jsx.children;
  if (Array.isArray(children)) {
    return children as any;
  } else if (children != null) {
    return [children] as any;
  }
  return [];
}

function getVNodeChildren(vNode: VNode): VNode[] {
  const children: VNode[] = [];
  let child = vnode_getFirstChild(vNode);
  while (child) {
    if (!shouldSkip(child)) {
      children.push(child);
    }
    child = vnode_getNextSibling(child);
  }
  return children;
}
export function jsxToHTML(jsx: JSXNode, pad: string = ''): string {
  const html: string[] = [];
  if (jsx.type) {
    html.push(pad, '<', tagToString(jsx.type), '>\n');
    getJSXChildren(jsx).forEach((jsx) => {
      html.push(jsxToHTML(jsx, pad + '  '));
    });
    html.push(pad, '</', tagToString(jsx.type), '>\n');
  } else {
    html.push(pad, JSON.stringify(jsx), '\n');
  }
  return html.join('');
}

export function vnodeToHTML(vNode: VNode | null, pad: string = ''): string {
  const html: string[] = [];
  while (vNode) {
    html.push(
      pad +
        vNode
          .toString()
          .split('\n')
          .join('\n' + pad)
    );
    while (shouldSkip((vNode = vnode_getNextSibling(vNode!)))) {
      // skip
    }
  }
  return html.join('');
}

function tagToString(tag: any): string {
  if (tag === Fragment) {
    return 'Fragment';
  }
  return String(tag);
}

function shouldSkip(vNode: VNode | null) {
  if (vNode && vnode_isElementVNode(vNode)) {
    const tag = vnode_getElementName(vNode);
    if (
      tag === 'script' &&
      (vnode_getProp(vNode, 'type') === 'qwik/vnode' ||
        vnode_getProp(vNode, 'type') === 'qwik/state')
    ) {
      return true;
    }
  }
  return false;
}

export function walkJSX(
  jsx: JSXNode,
  apply: {
    enter: (jsx: JSXNode) => void;
    leave: (jsx: JSXNode) => void;
    text: (text: Stringifiable) => void;
  }
) {
  apply.enter(jsx);
  if (Array.isArray(jsx.children)) {
    for (const child of jsx.children) {
      processChild(child);
    }
  } else if (jsx.children) {
    processChild(jsx.children);
  }
  apply.leave(jsx);

  function processChild(child: any) {
    if (isStringifiable(child)) {
      apply.text(child);
    } else if (isJSXNode(child)) {
      walkJSX(child, apply);
    } else {
      throw new Error('Unknown type: ' + child);
    }
  }
}

export function vnode_fromJSX(jsx: JSXNode) {
  const doc = createDocument() as QDocument;
  doc.qVNodeData = new WeakMap();
  const vBody = vnode_newUnMaterializedElement(null, doc.body);
  let vParent: ElementVNode | VirtualVNode = vBody;
  walkJSX(jsx, {
    enter: (jsx) => {
      const type = jsx.type;
      if (typeof type === 'string') {
        const child = vnode_newUnMaterializedElement(vParent, doc.createElement(type));
        vnode_insertBefore(vParent, null, child);

        const props = jsx.props;
        for (const key in props) {
          if (Object.prototype.hasOwnProperty.call(props, key)) {
            vnode_setProp(child, key, String(props[key]));
          }
        }
        vParent = child;
      } else {
        throw new Error('Unknown type:' + type);
      }
    },
    leave: (jsx) => {
      vParent = vnode_getParent(vParent) as any;
    },
    text: (value) => {
      vnode_insertBefore(
        vParent,
        null,
        vnode_newText(vParent, doc.createTextNode(String(value)), String(value))
      );
    },
  });
  return { vParent, vNode: vnode_getFirstChild(vParent) };
}
