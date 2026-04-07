import { expect, type Page, type Response } from "@playwright/test";

/**
 * Like page.goto() but throws if the response is a 4xx/5xx (other than 401/403 which mean
 * "the route exists, you're not authorized"). Use this in feature specs to fail loudly on
 * routing regressions instead of getting a confusing locator timeout deeper in the test.
 */
export async function gotoOk(page: Page, path: string): Promise<Response> {
  const response = await page.goto(path);
  expect(response, `no response for ${path}`).not.toBeNull();
  const status = response!.status();
  if (status >= 400 && status !== 401 && status !== 403) {
    throw new Error(`gotoOk("${path}") got status ${status}`);
  }
  return response!;
}
