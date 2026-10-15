#!/bin/sh
set -eu
src=/home/azureuser/.local/share/papermotion-tls
dst=/etc/nginx/ssl/papermotion.chillicurry.uk
install -d -m 700 "$dst"
install -m 600 "$src/privkey.pem" "$dst/privkey.pem"
install -m 644 "$src/fullchain.pem" "$dst/fullchain.pem"
/usr/sbin/nginx -t
/bin/systemctl reload nginx
