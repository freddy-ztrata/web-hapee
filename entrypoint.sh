#!/bin/sh
# Inject environment variables into nginx config and start
envsubst '${ANTHROPIC_API_KEY} ${ELEVENLABS_API_KEY}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
