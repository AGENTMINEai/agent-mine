# Deployment

The site is a fully static Next.js export. It can be served by any static host; the
notes below use nginx as the reference setup.

## 1. Build

```bash
cd web
npm ci
EXPORT=1 npm run build      # -> web/out
```

`EXPORT=1` switches `next.config.mjs` to `output: "export"`, disables the image
optimizer, and adds trailing slashes so directory-style hosts work.

The export reads these build-time variables (see `web/.env.example`):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_VAULT` | Vault address the site reads `poolState()` from |
| `NEXT_PUBLIC_TOKEN` | Optional fallback; the site prefers the vault's on-chain `taxToken()` |
| `NEXT_PUBLIC_AGENT_ID` | Agent ID registry (defaults to the BSC registry) |
| `NEXT_PUBLIC_MAX_RIGS` / `NEXT_PUBLIC_DRIP_HOURS` | Display fallbacks |

## 2. Serve

Copy `web/out` to the web root, then use an nginx server block like:

```nginx
server {
    listen 80;
    server_name your-domain.example;

    root /var/www/agentmine;
    index index.html;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    location ^~ /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location / {
        add_header Cache-Control "no-cache";
        try_files $uri $uri/ =404;
    }

    error_page 404 /404.html;
    location = /404.html { internal; }
}
```

## 3. TLS

```bash
certbot --nginx -d your-domain.example -d www.your-domain.example --redirect
```

Wallet providers refuse non-secure contexts, so HTTPS is required before the mine
panel can be used in production.

## 4. Updating

Rebuild, replace the files, keep the vhost untouched. If you let certbot edit the
server block, do not overwrite it blindly on later deploys — it holds the TLS
configuration.
