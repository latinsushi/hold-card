# Hold Card

Put the wait in writing when the client holds the timeline.

A static web tool for independent designers, developers, and consultants blocked waiting on client feedback, assets, or approvals. Paste the project, what you need, and days waiting. Get a sendable email and a one-page PDF hold note.

Price: $19 once. The generator is free to try. Licensed PDFs drop the free-version footer line.

This is not a contract rewrite. Not legal advice. Not a penalty notice.

## How to open locally

No build step. No backend.

```bash
cd projects/004-hold-card
python3 -m http.server 8080
```

Then open http://localhost:8080/

Unlock a watermark-free PDF for testing:

http://localhost:8080/?license=demo

That sets `localStorage.holdCardLicense`.

## Checkout

Stripe payment link is not wired yet. That is the payment blocker. Checkout button stays on `#price` until a link exists. `?license=` still unlocks PDFs for testing.

## Where this gets found

SEO pages first. People search "waiting on client feedback" and "client not responding revisions" when the ball is in the client's court.

## Privacy

Nothing typed in the form is uploaded. It stays in the browser.

## Live

https://latinsushi.github.io/hold-card/
