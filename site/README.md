# Peekhole

Vice City's premiere creator tipping platform. Make It Rain Mondays at Jack of Hearts, 1987 Ocean Drive, Vice Beach, Leonida.

Static site: HTML, CSS, JS. No build step, no server.

## Run locally

```
cd site
python -m http.server 8080
```

Open http://localhost:8080. Opening the file directly (`file://`) won't work — ES modules require HTTP.

## Deploy

Use Cloudflare Pages or Netlify and publish the `site/` folder. Both hosts read the `_headers` file (CSP, HSTS, security headers). On Vercel, recreate those headers in `vercel.json`.

## QR code

Point the QR to `https://YOUR-DOMAIN/?ref=poster`. Visitors arriving from it see the message "You scanned the Make It Rain Mondays poster," and the parameter is removed from the URL immediately after.

## Configuration

Edit `js/config.js`:

- `socials.x` and `socials.telegram` — social links (hidden when empty)
- `lineup` — creator photos (local files under `assets/` only)
- `event` — countdown timer settings

## Pages

- `index.html` — main site
- `terms.html` — Terms of Service
- `privacy.html` — Privacy Policy
- `guidelines.html` — Content Guidelines
- `404.html` — custom error page

## 18+

Age gate is handled by `js/boot.js` (synchronous, session-based). Visitors confirm once per session.
