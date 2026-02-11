#!/bin/bash

echo "=== Checking Backend Logs ==="
docker compose logs --tail=50 backend | grep -i "error\|login\|auth"

echo ""
echo "=== Testing Health Endpoint ==="
curl -s http://localhost:3001/api/health | jq

echo ""
echo "=== Testing Login Endpoint (verbose) ==="
curl -v -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gosciniecrodzinny.pl","password":"Admin123!@#"}'

echo ""
echo "=== Checking if Users table exists ==="
docker compose exec -T postgres psql -U rezerwacje_user -d rezerwacje -c "SELECT id, email, role FROM \"User\" LIMIT 5;"
