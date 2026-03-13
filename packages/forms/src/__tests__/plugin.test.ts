import { describe, it, expect } from "vitest";
import { createFormPlugin } from "../plugin";

describe("createFormPlugin", () => {
  it("returns a plugin with the provided components", () => {
    const Stub = () => null;
    const plugin = createFormPlugin({
      components: {
        textInput: Stub,
        numberInput: Stub,
        select: Stub,
        checkbox: Stub,
        form: Stub,
        submitButton: Stub,
      },
    });
    expect(plugin.components.textInput).toBe(Stub);
    expect(plugin.components.form).toBe(Stub);
  });
});
