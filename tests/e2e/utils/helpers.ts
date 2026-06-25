import { Page, Locator, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  async waitForAppReady(): Promise<void> {
    await this.page.waitForSelector('[data-testid="app-ready"], .pinc-app', { timeout: 30000 });
    await this.page.waitForLoadState('networkidle');
  }

  async clickTab(tabName: string): Promise<void> {
    const tab = this.page.locator(`[data-testid="tab-${tabName}"], [role="tab"][aria-label="${tabName}"], button:has-text("${tabName}")`);
    await tab.first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async fillInput(selector: string, value: string): Promise<void> {
    const input = this.page.locator(selector);
    await input.fill(value);
  }

  async clickButton(text: string): Promise<void> {
    const button = this.page.locator(`button:has-text("${text}"), [role="button"]:has-text("${text}")`);
    await button.first().click();
  }

  async waitForToast(message: string): Promise<void> {
    await expect(this.page.locator(`[role="alert"]:has-text("${message}"), .toast:has-text("${message}"), [data-testid="toast"]:has-text("${message}")`)).toBeVisible({ timeout: 10000 });
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `../reports/screenshots/${name}.png`, fullPage: true });
  }

  async getText(selector: string): Promise<string> {
    return (await this.page.locator(selector).textContent()) || '';
  }

  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  async waitForElement(selector: string, timeout = 10000): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  async clickAndWait(selector: string, waitSelector?: string): Promise<void> {
    await this.page.locator(selector).click();
    if (waitSelector) {
      await this.waitForElement(waitSelector);
    }
  }

  async clearAndType(selector: string, value: string): Promise<void> {
    const input = this.page.locator(selector);
    await input.clear();
    await input.fill(value);
  }

  async selectOption(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).selectOption(value);
  }

  async checkCheckbox(selector: string): Promise<void> {
    const checkbox = this.page.locator(selector);
    if (!(await checkbox.isChecked())) {
      await checkbox.click();
    }
  }

  async uncheckCheckbox(selector: string): Promise<void> {
    const checkbox = this.page.locator(selector);
    if (await checkbox.isChecked()) {
      await checkbox.click();
    }
  }

  async getAttribute(selector: string, attr: string): Promise<string | null> {
    return await this.page.locator(selector).getAttribute(attr);
  }

  async waitForNetworkIdle(timeout = 5000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  async evalOnPage<T>(fn: () => Promise<T>): Promise<T> {
    return await this.page.evaluate(fn);
  }
}

export function createTestHelpers(page: Page): TestHelpers {
  return new TestHelpers(page);
}