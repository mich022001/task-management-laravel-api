#!/usr/bin/env sh
set -eu

php artisan config:cache
php artisan route:cache

php-fpm -D
exec nginx -g "daemon off;"
