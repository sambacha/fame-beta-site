/* Bisect the OrderFlowBuilder crash: render each suspect subtree standalone. */
import { JSDOM } from "jsdom"

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
})

globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.navigator = dom.window.navigator
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.Element = dom.window.Element
globalThis.Event = dom.window.Event
globalThis.CustomEvent = dom.window.CustomEvent
globalThis.getComputedStyle = dom.window.getComputedStyle
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0)
globalThis.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} })
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const { renderToStaticMarkup } = await import("react-dom/server")
const React = (await import("react")).default

const cases = []

// Case 1: Select tree
{
  const { Select } = await import("@base-ui-components/react/select")
  cases.push({
    name: "Select tree",
    el: React.createElement(
      Select.Root,
      { items: [{ value: "a", label: "Alpha" }], value: null },
      React.createElement(
        Select.Trigger,
        null,
        React.createElement(Select.Value, null, React.createElement("span", null, "pick")),
        React.createElement(Select.Icon, null, "v"),
      ),
      React.createElement(
        Select.Portal,
        null,
        React.createElement(
          Select.Positioner,
          { sideOffset: 6 },
          React.createElement(
            Select.Popup,
            null,
            React.createElement(
              Select.Item,
              { value: "a" },
              React.createElement(Select.ItemText, null, "Alpha"),
              React.createElement(Select.ItemIndicator, null, "OK"),
            ),
          ),
        ),
      ),
    ),
  })
}

// Case 2: Radio tree
{
  const { Radio } = await import("@base-ui-components/react/radio")
  const { RadioGroup } = await import("@base-ui-components/react/radio-group")
  cases.push({
    name: "Radio tree",
    el: React.createElement(
      RadioGroup.Root,
      { value: null },
      React.createElement(
        Radio.Root,
        { value: "a" },
        React.createElement(Radio.Indicator, {
          render: (props, state) =>
            React.createElement("span", props, state.checked ? "dot" : null),
        }),
        React.createElement("span", null, "Leg A"),
      ),
    ),
  })
}

// Case 3: Dialog tree
{
  const { Dialog } = await import("@base-ui-components/react/dialog")
  cases.push({
    name: "Dialog tree",
    el: React.createElement(
      Dialog.Root,
      { open: false },
      React.createElement(Dialog.Trigger, null, "Confirm"),
      React.createElement(
        Dialog.Portal,
        null,
        React.createElement(Dialog.Backdrop, null),
        React.createElement(
          Dialog.Popup,
          null,
          React.createElement(Dialog.Title, null, "Title"),
          React.createElement(Dialog.Description, null, "Desc"),
          React.createElement(Dialog.Close, null, "Close"),
        ),
      ),
    ),
  })
}

// Case 4: Tremor Metric
{
  const { Metric } = await import("@tremor/react")
  cases.push({
    name: "Tremor Metric",
    el: React.createElement(Metric, null, "14.2%"),
  })
}

for (const testCase of cases) {
  try {
    const html = renderToStaticMarkup(testCase.el)
    console.log(`PASS  ${testCase.name} (${html.length} chars)`)
  } catch (error) {
    console.log(`FAIL  ${testCase.name}: ${error.message.split("\n")[0]}`)
  }
}
