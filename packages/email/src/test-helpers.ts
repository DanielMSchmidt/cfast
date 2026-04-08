/**
 * @module test-helpers
 *
 * Test utilities for `@cfast/email` that let consumers assert on rendered
 * email bodies without needing a Mailgun API key, a network, or even a
 * running email client.
 *
 * The rendering path is the same `@react-email/render` call
 * {@link createEmailClient} uses in production — exported as a standalone
 * helper so tests can drive it directly against a template component.
 */
import { render } from "@react-email/render";
import type { ComponentType, ReactElement } from "react";
import { createElement, isValidElement } from "react";

/**
 * The fully rendered output of an email template.
 *
 * Identical in shape to what an {@link EmailProvider} would receive when
 * called through the real client — the only thing missing is the envelope
 * metadata (`to`, `from`, `subject`) because the helper intentionally
 * stops at rendering and does not attempt delivery.
 */
export type RenderedEmail = {
  /** HTML body produced by `@react-email/render`. */
  html: string;
  /** Plain-text body produced by `@react-email/render` with `plainText: true`. */
  text: string;
};

/**
 * Renders a react-email template to HTML and plain-text without sending.
 *
 * Accepts either:
 * - A React component (e.g. `MagicLinkEmail`) plus its props, or
 * - A rendered React element (e.g. `<MagicLinkEmail url="..." />`) with
 *   no props argument.
 *
 * Uses the same `@react-email/render` path production uses, so whatever
 * output assertions pass here will match what actually ships in the
 * email body.
 *
 * @example Component + props
 * ```ts
 * import { renderEmail } from "@cfast/email/test-helpers";
 * import { MagicLinkEmail } from "~/email/templates/magic-link";
 *
 * test("magic link email contains the right link", async () => {
 *   const { html, text } = await renderEmail(MagicLinkEmail, {
 *     url: "https://example.com/verify?token=abc",
 *   });
 *   expect(html).toContain("https://example.com/verify?token=abc");
 *   expect(text).toContain("Sign in to your account");
 * });
 * ```
 *
 * @example Already-rendered element
 * ```ts
 * import { renderEmail } from "@cfast/email/test-helpers";
 * import { WelcomeEmail } from "~/email/templates/welcome";
 *
 * test("welcome email renders", async () => {
 *   const { html } = await renderEmail(<WelcomeEmail name="Alice" />);
 *   expect(html).toContain("Welcome, Alice");
 * });
 * ```
 */
export async function renderEmail<Props extends object>(
  template: ComponentType<Props>,
  props: Props,
): Promise<RenderedEmail>;
export async function renderEmail(
  element: ReactElement,
): Promise<RenderedEmail>;
export async function renderEmail<Props extends object>(
  templateOrElement: ComponentType<Props> | ReactElement,
  props?: Props,
): Promise<RenderedEmail> {
  const element: ReactElement = isValidElement(templateOrElement)
    ? templateOrElement
    : createElement(
        templateOrElement as ComponentType<Props>,
        (props ?? ({} as Props)) as Props,
      );

  // `@react-email/render` is the same renderer production uses — call it
  // with the same flags so `plainText: true` produces the exact text body
  // the email provider would see.
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  return { html, text };
}
