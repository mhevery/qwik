import { describe, expect, it } from 'vitest';
import { component$ } from '../component/component.public';
import { inlinedQrl } from '../qrl/qrl';
import {
  Fragment as Awaited,
  Fragment as Component,
  Fragment,
  Fragment as InlineComponent,
} from '../render/jsx/jsx-runtime';
import { Resource, useResourceQrl } from '../use/use-resource';
import { domRender, ssrRenderToDom } from './rendering.unit-util';
import './vdom-diff.unit-util';
import { useSignal } from '../use/use-signal';
import { useLexicalScope } from '../use/use-lexical-scope.public';
import { delay } from '../util/promises';
import type { Signal } from '../state/signal';
import { trigger } from '../../testing/element-fixture';

const debug = false; //true;
Error.stackTraceLimit = 100;

[
  ssrRenderToDom, //
  domRender, //
].forEach((render) => {
  describe(render.name + ': useResource', () => {
    it('should execute resource task', async () => {
      const TestCmp = component$(() => {
        const rsrc = useResourceQrl(inlinedQrl(() => 'RESOURCE_VALUE', 's_resource'));
        return (
          <div>
            <Resource value={rsrc} onResolved={(v) => <span>{v}</span>} />
          </div>
        );
      });

      const { vNode } = await render(<TestCmp />, { debug });
      const result = <span>RESOURCE_VALUE</span>;
      expect(vNode).toMatchVDOM(
        <Component>
          <div>
            <InlineComponent>
              <Fragment>
                <Awaited>{result}</Awaited>
              </Fragment>
            </InlineComponent>
          </div>
        </Component>
      );
    });
    it('should update resource task', async () => {
      const TestCmp = component$(() => {
        const count = useSignal(0);
        const rsrc = useResourceQrl(
          inlinedQrl(
            async ({ track }) => {
              const [count] = useLexicalScope<[Signal<number>]>();
              const value = track(() => count.value);
              await delay(5);
              return value;
            },
            's_resource',
            [count]
          )
        );
        return (
          <button onClick$={inlinedQrl(() => useLexicalScope()[0].value++, 's_click', [count])}>
            <Resource value={rsrc} onResolved={(v) => <span>{v}</span>} />
          </button>
        );
      });

      const { vNode, container } = await render(<TestCmp />, { debug });
      expect(vNode).toMatchVDOM(
        <Component>
          <button>
            <InlineComponent>
              <Fragment>
                <Awaited>
                  <span>0</span>
                </Awaited>
              </Fragment>
            </InlineComponent>
          </button>
        </Component>
      );
      await trigger(container.element, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <Component>
          <button>
            <InlineComponent>
              <span>1</span>
            </InlineComponent>
          </button>
        </Component>
      );
    });
  });
});

// function Cmp() {
//   console.log('render', Cmp.toString());
//   const count = useSignal(0);
//   const rsrc = useResourceQrl(
//     /*#__PURE__*/ inlinedQrlDEV(
//       Cmp_component_rsrc_useResource_Rxy93YhMmbg,
//       'Cmp_component_rsrc_useResource_Rxy93YhMmbg',
//       {},
//       [count]
//     )
//   );
//   return /*#__PURE__*/ _jsxQ(
//     'button',
//     null,
//     {
//       onClick$: /*#__PURE__*/ _noopQrl(
//         'Cmp_component_button_onClick_4DloTE5PTmc',
//         [count]
//       ),
//     },
//     /*#__PURE__*/ _jsxC(
//       Resource,
//       {
//         onResolved: (v) =>
//           /*#__PURE__*/ _jsxQ('span', null, null, v, 1, 'H1_0', {}),
//         value: rsrc,
//         [_IMMUTABLE]: { onResolved: _IMMUTABLE, value: _IMMUTABLE, },
//       },
//       3,
//       'H1_1',
//       {}
//     ),
//     1,
//     'H1_2',
//     {}
//   );
// }