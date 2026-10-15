# Intended for a single trusted user. Never serve this app without TLS and auth.
auth_basic "PaperMotion private";
auth_basic_user_file /etc/nginx/papermotion.htpasswd;
client_max_body_size 30m;
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header Referrer-Policy no-referrer always;
add_header Cache-Control "private, no-store" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
if ($papermotion_bad_origin) { return 403; }
if ($papermotion_cross_site_write) { return 403; }
if ($uri ~ "^/papermotion/api/(pi-proxy(?:/|$)|codex/(?:account|logout)(?:/|$)|provider/logout(?:/|$))") { return 403; }
    proxy_pass http://127.0.0.1:3010;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Authorization "";
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_read_timeout 600s;
    proxy_send_timeout 600s;
