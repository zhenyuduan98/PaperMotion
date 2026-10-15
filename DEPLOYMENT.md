# SUPERSEDED: rollback checkout only

Live release is now `/home/azureuser/.openclaw/workspace/papermotion-releases/f81310f` at upstream commit `f81310f461861d886814e91c70502a59eb922f91`. See that release's DEPLOYMENT.md for verification and rollback instructions. This checkout and its `.next` are preserved for rollback; do not build it as though it were live.

---
# CANONICAL ROOT DEPLOYMENT — supersedes all subpath notes below

User explicitly reconfirmed repository, commit, model, credential, and domain. Verified remote `https://github.com/zhenyuduan98/PaperMotion.git`, HEAD `676c07bae1560dbbada95e43ea3aa3386a47d76d`, PM2 process cwd PaperMotion, and exact token match without printing the token.

**Canonical URL: https://papermotion.chillicurry.uk/**. Root now directly serves the app, not a subpath redirect. `NEXT_PUBLIC_BASE_PATH` is empty; production rebuilt successfully. Page title is PaperMotion. Existing local safety and URL-helper adaptations remain.

Nginx primary domain uses `/etc/nginx/snippets/papermotion-app.conf`. Old `/papermotion/` links on primary and main domains redirect to the canonical root/path. `chillicurry.uk` no longer proxies an independent PaperMotion deployment. Existing main site remains HTTP 200.

Validated again publicly: authenticated root 200 and title PaperMotion; browser homepage and PDF viewer no JS/HTTP errors; live server model gpt-6-astra via https://copilot.chillicurry.uk/v1/responses; actual AI Chinese reply from root API; anonymous root 401; hostile Origin and forbidden proxy 403; token absent from 91 browser asset files. Credentials unchanged. TLS CN papermotion.chillicurry.uk, expires 2026-12-06; renewal hook unchanged.

---
Historical deployment log:

# LIVE UPDATE — 2026-09-07 07:08 UTC

**Public deployment is LIVE:** https://papermotion.chillicurry.uk/ redirects to `/papermotion/`.
Backup: https://chillicurry.uk/papermotion/.
Next basePath and NEXT_PUBLIC_BASE_PATH are `/papermotion`; client API calls use lib/app-url.ts, including PDF URL/worker handling.
Both domains use `/etc/nginx/snippets/papermotion-subpath-proxy.conf`, with full authentication and exact Origin validation. Main domain existing root/mall/mall-admin verified HTTP 200, unchanged.
TLS issued by Let's Encrypt, installed to `/etc/nginx/ssl/papermotion.chillicurry.uk/`. Renewal hook `sudo -n /usr/local/sbin/papermotion-install-cert` deploys from `~/.local/share/papermotion-tls` and validates/reloads Nginx automatically.
Public tests passed: unauthenticated 401, authenticated settings 200, hostile Origin and blocked proxy 403; authenticated browser homepage/PDF viewer 200 with zero JS/HTTP errors. AI request through public backup URL returned valid Chinese answer using gpt-6-astra.
User briefly saw existing AI Avatar site before the new TLS vhost was active; routing corrected and primary domain browser verification passed.
Login username zhenyu; password location below. No API token in client assets. Single-trusted-user generated-JS residual risk remains.

---
The following is the earlier preparation record (pending-DNS sections are superseded):

# Private PaperMotion deployment

Base commit: `676c07bae1560dbbada95e43ea3aa3386a47d76d`.
Prepared 2026-09-07. **Public HTTPS is pending DNS and certificate issuance.**

## Service

- PM2: `papermotion`, Next.js production server on `127.0.0.1:3010`.
- PM2 configuration: `ecosystem.config.cjs`; process list saved.
- Data: `/home/azureuser/.local/share/papermotion` (0700), independent of builds.
- Secret environment: `.env.local` (0600, ignored by git). Never send it to a browser or commit it.
- API: `https://copilot.chillicurry.uk/v1/responses`, model `gpt-6-astra`.
- `GETIT_WEB=1`, `GETIT_HOSTED=1`; hosted settings force the provider, API type, URL, model, and key from server environment.
- Settings writes only accept theme, autoGenerate, and bounded maxRetries.
- Login: username `zhenyu`; password is kept in `/home/azureuser/.config/papermotion/access-password` (0600). Nginx stores only its bcrypt hash.

## Nginx

- Active HTTP vhost: `/etc/nginx/sites-available/papermotion.chillicurry.uk`, symlink from sites-enabled; currently only ACME challenge + HTTPS redirect.
- App protection snippet: `/etc/nginx/snippets/papermotion-app.conf`.
- CSRF maps: `/etc/nginx/conf.d/papermotion-guards.conf`.
- Loopback-only preview on `127.0.0.1:3011`: `/etc/nginx/conf.d/papermotion-local-test.conf`.
- Full site authentication, no-store headers, upload cap 30 MB, 600s proxy timeout, same-origin CSP, exact write Origin requirement.
- `/api/pi-proxy/*`, `/api/codex/account`, `/api/codex/logout`, `/api/provider/logout` are blocked. `/api/codex/health` stays available because it only reads the in-memory provider health and the browser UI polls it.
- The loopback preview accepts its own exact `http://127.0.0.1:3011` write Origin only on server port 3011; this exception does not apply to public HTTPS on 443.
- TLS vhost template: `deploy/nginx-https.conf` (not activated).

## Remaining launch steps

1. User adds Cloudflare A `papermotion` -> `128.85.34.109`, SSL mode Full (strict). Confirm DNS publicly resolves.
2. Issue a certificate for `papermotion.chillicurry.uk` with acme.sh using `/var/www/acme-papermotion` as webroot.
3. Install cert/key to the paths referenced by `deploy/nginx-https.conf`. Ensure the renewal deployment hook copies renewed files and reloads Nginx; do not repeat the old manual-copy-only renewal issue.
4. Install TLS vhost; `sudo nginx -t` before reload.
5. Verify public unauthenticated 401, authenticated HTML/API 200, bad/missing Origin 403, document/PDF viewer and AI requests. Remove the temporary loopback Nginx test vhost once no longer needed.
6. Deliver the URL and generated password privately. Recommend rotating the API token pasted into chat.

## Validation and limitations

- Production build and TypeScript check passed.
- API Responses protocol, Markdown upload/PDF conversion, document chat plus follow-up, and flashcard generation passed against the selected model.
- Nginx basic auth, secret masking, protected endpoints, hostile Origin rejection tested over loopback.
- Browser home/PDF rendering passed with zero JS errors and zero HTTP errors, through authenticated Nginx preview. Document tagging and graph construction started. Use `deploy/browser-smoke.mjs`, not networkidle on the polling viewer.
- Server API credential absent from all 91 browser asset files; `.env.local` mode verified 0600.
- This is a **single trusted user** deployment, not a multi-user SaaS: all documents share one library.
- **Residual risk:** original graph/2D/3D visualizers execute model-generated JavaScript in the application origin. The upstream JS wrapper is not a robust sandbox. Authentication and CSP do not prevent such code from making same-origin requests. Use only trusted documents; a proper opaque-origin iframe sandbox is required before accepting untrusted documents or broader users.
- Privacy copy was corrected: data is stored on the VM; AI features send relevant document text/conversations to the configured upstream API. No claim that documents remain on the browser's computer.

## Rebuild

While the app is private/unavailable to users:

```sh
pm2 stop papermotion
NODE_OPTIONS=--max-old-space-size=1536 npm run browser:build
pm2 restart papermotion
pm2 save
```

Do not restart if the build fails. Future zero-downtime deployments should use versioned release directories rather than rebuilding the active `.next` directory.
