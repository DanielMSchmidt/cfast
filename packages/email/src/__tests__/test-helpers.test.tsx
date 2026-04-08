import { describe, it, expect } from "vitest";
import { renderEmail } from "../test-helpers.js";

/**
 * A representative template component. Kept intentionally simple — the
 * point of these tests is to prove `renderEmail` is a thin adapter over
 * `@react-email/render`, not to re-test the renderer itself.
 */
function MagicLinkEmail({ url }: { url: string }) {
  return (
    <html>
      <body>
        <h1>Sign in to your account</h1>
        <p>
          <a href={url}>Click here to sign in</a>
        </p>
        <p>If you did not request this email, you can safely ignore it.</p>
      </body>
    </html>
  );
}

describe("renderEmail (component + props form)", () => {
  it("renders HTML and plain-text from a template and its props", async () => {
    const { html, text } = await renderEmail(MagicLinkEmail, {
      url: "https://example.com/verify?token=abc",
    });

    // HTML body carries the anchor href we passed as a prop.
    expect(html).toContain("https://example.com/verify?token=abc");
    expect(html).toContain("Sign in to your account");

    // Plain-text variant drops the HTML scaffolding but keeps the copy.
    // `@react-email/render` uppercases `<h1>` content in the plain-text
    // output, so match the headline case-insensitively.
    expect(text).toMatch(/sign in to your account/i);
    expect(text).toContain("https://example.com/verify?token=abc");
  });

  it("substitutes different props on re-render without leaking state", async () => {
    const first = await renderEmail(MagicLinkEmail, { url: "https://a.test/1" });
    const second = await renderEmail(MagicLinkEmail, { url: "https://b.test/2" });

    expect(first.html).toContain("https://a.test/1");
    expect(first.html).not.toContain("https://b.test/2");
    expect(second.html).toContain("https://b.test/2");
    expect(second.html).not.toContain("https://a.test/1");
  });

  it("returns both html and text fields on every call", async () => {
    const result = await renderEmail(MagicLinkEmail, { url: "https://c.test" });
    expect(typeof result.html).toBe("string");
    expect(typeof result.text).toBe("string");
    expect(result.html.length).toBeGreaterThan(0);
    expect(result.text.length).toBeGreaterThan(0);
  });
});

describe("renderEmail (element form)", () => {
  it("accepts an already-rendered React element", async () => {
    const { html, text } = await renderEmail(
      <MagicLinkEmail url="https://element.test" />,
    );

    expect(html).toContain("https://element.test");
    expect(text).toContain("https://element.test");
  });

  it("supports inline JSX that references closure data", async () => {
    const token = "closure-token-123";
    const { html } = await renderEmail(
      <MagicLinkEmail url={`https://example.com/verify?token=${token}`} />,
    );
    expect(html).toContain(token);
  });
});
