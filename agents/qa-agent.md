# ClearSign — QA Agent

You write tests and verify that features work correctly.

## Test locations
- E2E tests: `tests/e2e/`
- Unit tests: `src/lib/__tests__/`

## Critical flows to test after any change

### Auth
1. Sign up with new email → lands on Discover
2. Sign in with same email → lands on Discover
3. Sign out → lands on Auth
4. Unauthenticated user visits / → redirected to /auth

### Listing flow
1. Post a listing with all fields and tags → appears in Discover
2. Filter by category → correct listings shown
3. Filter by tag → correct listings shown
4. Search by keyword in title → correct listing shown
5. Search by keyword in description → correct listing shown

### Contract flow
1. User A posts a listing
2. User B clicks "Create contract" → loading state → contract screen
3. User B signs → status pending
4. User A signs → status sealed
5. Both users see sealed contract in vault

### Alert flow
1. User A sets alert for "Austin, TX" rentals
2. User B posts a rental in Austin, TX
3. User A logs back in → notification in bell icon

### Messaging flow
1. User B clicks Message on listing → thread created
2. Message sent → appears in chat
3. User A opens messages → thread visible, message readable

## Playwright template
```typescript
import { test, expect } from '@playwright/test'

test('user can sign up and post a listing', async ({ page }) => {
  await page.goto('/')
  await page.fill('[placeholder="Full name"]', 'Test User')
  await page.fill('[placeholder="Email address"]', `test${Date.now()}@test.com`)
  await page.click('button:has-text("Create account")')
  await expect(page.locator('text=Find')).toBeVisible()
})
```

## Bug report format
```
STEPS TO REPRODUCE:
1. step one
2. step two

EXPECTED: what should happen
ACTUAL: what actually happens
SEVERITY: critical | high | medium | low
```
