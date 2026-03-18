import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";

// Track what Form receives
let lastFormProps: Record<string, unknown> = {};
let lastFormChildren: unknown[] = [];

vi.mock("react-router", () => ({
  Form: (props: Record<string, unknown>) => {
    const { children, ...rest } = props;
    lastFormProps = rest;
    lastFormChildren = Array.isArray(children) ? children.flat() : [children];
    // Return a plain object representing the rendered tree for inspection
    return createElement("form", rest, children);
  },
}));

const { ActionForm } = await import("../client/action-form.js");

describe("ActionForm", () => {
  it("injects hidden fields for all non-null action entries", () => {
    const action = {
      _action: "deletePost",
      postId: "abc-123",
      title: "My Post",
    };

    const tree = ActionForm({
      action,
      method: "post",
      children: createElement("button", { type: "submit" }, "Delete"),
    });

    // ActionForm returns a Form element with hidden inputs + children
    // The props of the Form element
    expect(tree.props.method).toBe("post");

    // Children: hidden inputs + the button
    const children = Array.isArray(tree.props.children)
      ? tree.props.children.flat()
      : [tree.props.children];

    const hiddenInputs = children.filter(
      (child: any) => child?.type === "input" && child?.props?.type === "hidden",
    );

    expect(hiddenInputs).toHaveLength(3);

    const fieldMap = new Map(
      hiddenInputs.map((input: any) => [input.props.name, input.props.value]),
    );

    expect(fieldMap.get("_action")).toBe("deletePost");
    expect(fieldMap.get("postId")).toBe("abc-123");
    expect(fieldMap.get("title")).toBe("My Post");
  });

  it("skips null and undefined values", () => {
    const action = {
      _action: "update",
      title: "Hello",
      subtitle: null,
      content: undefined,
    };

    const tree = ActionForm({
      action,
      method: "post",
      children: createElement("button", null, "Go"),
    });

    const children = Array.isArray(tree.props.children)
      ? tree.props.children.flat()
      : [tree.props.children];

    const hiddenInputs = children.filter(
      (child: any) => child?.type === "input" && child?.props?.type === "hidden",
    );

    expect(hiddenInputs).toHaveLength(2);
    const names = hiddenInputs.map((input: any) => input.props.name);
    expect(names).toContain("_action");
    expect(names).toContain("title");
    expect(names).not.toContain("subtitle");
    expect(names).not.toContain("content");
  });

  it("converts non-string values to strings", () => {
    const action = {
      _action: "test",
      count: 42,
      active: true,
    };

    const tree = ActionForm({
      action,
      method: "post",
      children: null,
    });

    const children = Array.isArray(tree.props.children)
      ? tree.props.children.flat()
      : [tree.props.children];

    const hiddenInputs = children.filter(
      (child: any) => child?.type === "input" && child?.props?.type === "hidden",
    );

    const fieldMap = new Map(
      hiddenInputs.map((input: any) => [input.props.name, input.props.value]),
    );

    expect(fieldMap.get("count")).toBe("42");
    expect(fieldMap.get("active")).toBe("true");
  });

  it("passes through form props", () => {
    const tree = ActionForm({
      action: { _action: "upload" },
      method: "post",
      encType: "multipart/form-data",
      children: null,
    });

    expect(tree.props.method).toBe("post");
    expect(tree.props.encType).toBe("multipart/form-data");
  });
});
