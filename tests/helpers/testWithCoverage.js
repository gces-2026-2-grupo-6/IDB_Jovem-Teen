import { test as baseTest } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { setupApiMocks } from './mockApi.js';

export const test = baseTest.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      window.addEventListener('beforeunload', () => {
        if (window.__coverage__ && window.__playwright_coverage) {
          window.__playwright_coverage(window.__coverage__);
        }
      });
    });

    await setupApiMocks(context);

    /* O <Analytics /> do Vercel busca este script, que só existe com o site
       hospedado no Vercel. Fora dele a busca dá 404 e enche o log. */
    await context.route('**/_vercel/insights/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/javascript', body: '' })
    );

    const coverages = [];
    await context.exposeFunction('__playwright_coverage', (coverage) => {
      coverages.push(coverage);
    });

    await use(context);

    for (const page of context.pages()) {
      const coverage = await page.evaluate(() => window.__coverage__).catch(() => null);
      if (coverage) coverages.push(coverage);
    }

    for (const coverage of coverages) {
      const dir = path.join(process.cwd(), '.nyc_output');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const fileName = `coverage-${crypto.randomBytes(8).toString('hex')}.json`;
      fs.writeFileSync(path.join(dir, fileName), JSON.stringify(coverage));
    }
  }
});
export { expect } from '@playwright/test';
