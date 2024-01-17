import { createDocument } from '@builder.io/qwik-dom';
import { Fragment, Fragment as Component, type JSXNode } from '@builder.io/qwik/jsx-runtime';
import { describe, expect, it } from 'vitest';
import { component$ } from '../component/component.public';
import { notifyChange } from '../render/dom/notify-render';
import type { Subscriptions } from '../state/common';
import { ELEMENT_ID, OnRenderProp } from '../util/markers';
import { getDomContainer } from './client/dom-container';
import type { VNode } from './client/types';
import {
  vnode_getFirstChild,
  vnode_getNextSibling,
  vnode_getParent,
  vnode_getProp,
  vnode_getVNodeForChildNode,
  vnode_locate,
  vnode_toString,
} from './client/vnode';
import { ssrCreateContainer } from './ssr/ssr-container';
import { ssrRenderToContainer } from './ssr/ssr-render';
import './vdom-diff.unit';
import { codeToName } from './shared-serialization';
import { renderToString } from '../../server/render';
import { getPlatform, setPlatform } from '../platform/platform';
import { Slot } from '../render/jsx/slot.public';

describe('v2 render', () => {
  it('should render jsx', async () => {
    const { vNode } = await ssrRenderToDom(
      <span>
        <>Hello</> <b>World</b>!
      </span>
    );
    expect(vNode).toMatchVDOM(
      <span>
        <>Hello</> <b>World</b>!
      </span>
    );
  });
  describe('component', () => {
    describe('inline', () => {
      it('should render inline component', async () => {
        const HelloWorld = (props: { name: string }) => {
          return <span>Hello {props.name}!</span>;
        };

        const { vNode } = await ssrRenderToDom(<HelloWorld name="World" />);
        expect(vNode).toMatchVDOM(<span>Hello {'World'}!</span>);
      });
    });
    describe('component$', () => {
      it('should render simple component', async () => {
        const HelloWorld = component$((props: { name: string }) => {
          return <span>Hello {props.name}!</span>;
        });

        const { vNode } = await ssrRenderToDom(<HelloWorld name="World" />);
        expect(vNode).toMatchVDOM(
          <Fragment>
            <span>Hello {'World'}!</span>
          </Fragment>
        );
      });
    });
    it('should render nested components', async () => {
      const Child = component$((props: { name: string }) => {
        return <span>Hello Child: {props.name}</span>;
      });
      const Parent = component$((props: { name: string }) => {
        return <Child name={props.name} />;
      });

      const { vNode } = await ssrRenderToDom(<Parent name="World" />, { debug: false });
      expect(vNode).toMatchVDOM(
        <Fragment>
          <Fragment>
            <span>Hello Child: {'World'}</span>
          </Fragment>
        </Fragment>
      );
    });
    describe('projection', () => {
      it('should render basic projection', async () => {
        const Child = component$(() => {
          return <Slot />;
        });
        const Parent = component$(() => {
          return <Child>parent-content</Child>;
        });
        const { vNode } = await ssrRenderToDom(<Parent>render-content</Parent>, { debug: false });
        expect(vNode).toMatchVDOM(
          <Fragment>
            <Fragment>
              <Fragment>parent-content</Fragment>
            </Fragment>
          </Fragment>
        );
      });
      it('should render unused projection into template', async () => {
        const Child = component$(() => {
          return <span>no-projection</span>;
        });
        const Parent = component$(() => {
          return <Child>parent-content</Child>;
        });
        const { vNode } = await ssrRenderToDom(<Parent>render-content</Parent>, { debug: false });
        expect(vNode).toMatchVDOM(
          <Fragment>
            <Fragment>
              <span>no-projection</span>
            </Fragment>
          </Fragment>
        );
        expect(vnode_getNextSibling(vNode!)).toMatchVDOM(
          <q:template style="display:none">
            <Fragment>parent-content</Fragment>
            <Fragment>render-content</Fragment>
          </q:template>
        );
      });
      it('should render default projection', async () => {
        const Child = component$(() => {
          return <Slot>default-value</Slot>;
        });
        const Parent = component$(() => {
          return <Child />;
        });
        const { vNode } = await ssrRenderToDom(<Parent />, { debug: false });
        expect(vNode).toMatchVDOM(
          <Fragment>
            <Fragment>
              <Fragment>default-value</Fragment>
            </Fragment>
          </Fragment>
        );
      });
      it('should save default value in q:template if not used', async () => {
        const Child = component$(() => {
          return <Slot>default-value</Slot>;
        });
        const Parent = component$(() => {
          return <Child>projection-value</Child>;
        });
        const { vNode } = await ssrRenderToDom(<Parent />, { debug: false });
        expect(vNode).toMatchVDOM(
          <Fragment>
            <Fragment>
              <Fragment>projection-value</Fragment>
            </Fragment>
          </Fragment>
        );
        expect(vnode_getNextSibling(vNode!)).toMatchVDOM(
          <q:template style="display:none">
            <Fragment>default-value</Fragment>
          </q:template>
        );
      });
      it('should render nested projection', async () => {
        const Child = component$(() => {
          return (
            <div>
              <Slot />
            </div>
          );
        });
        const Parent = component$(() => {
          return (
            <Child>
              before
              <Child>inner</Child>
              after
            </Child>
          );
        });
        const { vNode } = await ssrRenderToDom(<Parent>second 3</Parent>, { debug: true });
        expect(vNode).toMatchVDOM(
          <Component>
            <Component>
              <div>
                <Fragment>
                  before
                  <Component>
                    <div>
                      <Fragment>inner</Fragment>
                    </div>
                  </Component>
                  after
                </Fragment>
              </div>
            </Component>
          </Component>
        );
      });
    });
  });
});

export async function ssrRenderToDom(
  jsx: JSXNode,
  opts: {
    /// Print debug information to console.
    debug?: boolean;
    /// Use old SSR rendering ond print out debug state. Useful for comparing difference between serialization.
    oldSSR?: boolean;
  } = {}
) {
  if (opts.oldSSR) {
    const platform = getPlatform();
    try {
      const ssr = await renderToString([
        <head>
          <title>{expect.getState().testPath}</title>
        </head>,
        <body>{jsx}</body>,
      ]);
      // restore platform
      console.log('LEGACY HTML', ssr.html);
    } finally {
      setPlatform(platform);
    }
  }
  const ssrContainer = ssrCreateContainer({ tagName: 'html' });
  await ssrRenderToContainer(ssrContainer, [
    <head>
      <title>{expect.getState().testPath}</title>
    </head>,
    <body>{jsx}</body>,
  ]);
  const html = ssrContainer.writer.toString();
  const document = createDocument(html);
  const container = getDomContainer(document.body.parentElement as HTMLElement);
  if (opts.debug) {
    console.log('HTML:', html);
    console.log(vnode_toString.call(container.rootVNode, Number.MAX_SAFE_INTEGER, '', true));
    console.log('CONTAINER: [');
    const state = container.rawStateData;
    for (let i = 0; i < state.length; i++) {
      console.log(('    ' + i + ':').substr(-4), qwikJsonStringify(state[i]));
    }
    console.log(']');
    if (false as boolean) {
      console.log('CONTAINER PROXY: [');
      const proxyState = container.stateData;
      for (let i = 0; i < state.length; i++) {
        console.log(('    ' + i + ':').substr(-4), proxyState[i]);
      }
      console.log(']');
    }
  }
  const bodyVNode = vnode_getVNodeForChildNode(container.rootVNode, document.body);
  return { container, document, vNode: vnode_getFirstChild(bodyVNode) };
}

export async function rerenderComponent(element: HTMLElement) {
  const container = getDomContainer(element);
  const vElement = vnode_locate(container.rootVNode, element);
  const host = getHostVNode(vElement)!;
  const subAction: Subscriptions = [0, host];
  notifyChange(subAction, container.containerState);
  await container.containerState.$renderPromise$;
}

function getHostVNode(vElement: VNode | null) {
  while (vElement != null) {
    if (typeof vnode_getProp(vElement, OnRenderProp) == 'string') {
      return vElement;
    }
    vElement = vnode_getParent(vElement);
  }
  return vElement;
}

function qwikJsonStringify(value: any): string {
  const RED = '\x1b[31m';
  const RESET = '\x1b[0m';
  let json = JSON.stringify(value);
  json = json.replace(/"\\u00([0-9a-f][0-9a-f])/gm, (_, value) => {
    return '"' + RED + codeToName(parseInt(value, 16)) + ': ' + RESET;
  });
  return json;
}