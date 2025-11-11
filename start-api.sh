#!/bin/sh
# Railway start script for API service
cd /app
exec node apps/api/dist/src/main.js
