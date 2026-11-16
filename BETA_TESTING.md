# Small-group beta

App: https://sc-ship-rental-app.vercel.app/

## Before inviting testers

- Confirm the Supabase project is active and the listing pages load. A paused project must be restored before testers can post or browse saved data.
- Confirm ship, crew, material, and player pages load successfully. An empty marketplace is expected until players post listings; an unavailable-service message means the backend still needs attention.
- Use two different Discord accounts to confirm the real request flow works before distributing the link.

## What to try

1. Sign in with Discord and check your public display name. Linking an RSI handle is optional.
2. Add a ship under Account, enter rental rates, and set future availability dates. Find it on the Ships page and check the date filter and Details popup.
3. Create a crew service and a material listing. Check their prices, descriptions, and edit/delete controls.
4. Ask another tester to request a listing. The provider should accept or reject it from My Deals.
5. For an accepted request, have both participants confirm completion, then leave ratings. Verify that a new user has no rated deals until real ratings are submitted.
6. Try filters, Details tabs, mobile layouts, signing out, and signing back in. Refresh and confirm saved listings and deals remain.

## Beta limits

- Availability is set by owners. Rental dates and exact start/end times must be agreed with the owner; requests do not automatically reserve dates.
- Payments and notifications are not included. Coordinate handoffs directly with the other player.
- The calendar shows posted availability. Rental simulation, sample listings, simulated deal actions, and inactive Pause buttons have been removed.

## Reporting feedback

Use the site's Issues & Suggestions link. Include the page, steps taken, expected result, actual result, and a screenshot if useful. Do not include passwords, session cookies, or API keys.
