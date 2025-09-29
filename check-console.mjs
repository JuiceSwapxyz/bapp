import { chromium } from 'playwright';

const url = 'http://localhost:3001/swap';
const messages = [];

console.log(`Opening ${url} and capturing console logs...\n`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

// Capture console messages
page.on('console', msg => {
  const type = msg.type();
  const text = msg.text();
  messages.push({ type, text });
  console.log(`[${type.toUpperCase()}] ${text}`);
});

// Capture errors
page.on('pageerror', error => {
  messages.push({ type: 'error', text: error.message });
  console.log(`[ERROR] ${error.message}`);
});

// Navigate to the page
await page.goto(url, { waitUntil: 'networkidle' });

// Wait a bit for any async operations
await page.waitForTimeout(8000);

// Filter for specific errors
const graphqlErrors = messages.filter(m =>
  m.text.includes('graphql') ||
  m.text.includes('CSP') ||
  m.text.includes('Content Security Policy') ||
  m.text.includes('dev.api.juiceswap.com')
);

console.log('\n--- GraphQL/CSP/API Related Errors ---');
if (graphqlErrors.length > 0) {
  graphqlErrors.forEach(err => {
    console.log(`[${err.type}] ${err.text}`);
  });
} else {
  console.log('No GraphQL, CSP, or dev.api.juiceswap.com errors found!');
}

console.log(`\n--- Total messages captured: ${messages.length} ---`);

await browser.close();