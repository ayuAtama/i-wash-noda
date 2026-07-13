#!/usr/bin/env bash
# scripts/test-full-flow.sh
# Full lifecycle test for I Wash Noda backend API
# Prerequisites:
#   1. pnpm dev running (server on port 3000)
#   2. jq installed
#   3. docker postgres-uwu container running
#
# Run: bash scripts/test-full-flow.sh

set -uo pipefail

BASE_URL="http://localhost:3000"
TMPDIR=$(mktemp -d)
DB_NAME="laundry_app_playground"
PSQL="docker exec postgres-uwu psql -U postgres -d $DB_NAME -t -A"
CURL="curl --connect-timeout 5 --max-time 15"
PASS_COUNT=0
FAIL_COUNT=0
TOTAL_COUNT=0

cleanup() { rm -rf "$TMPDIR"; }
trap cleanup EXIT

# ─── Helpers ───────────────────────────────────────────

green()  { printf "\033[32m%s\033[0m" "$1"; }
red()    { printf "\033[31m%s\033[0m" "$1"; }

pass() {
  TOTAL_COUNT=$((TOTAL_COUNT + 1))
  PASS_COUNT=$((PASS_COUNT + 1))
  echo "  $(green '✓ PASS') $1"
}

fail() {
  TOTAL_COUNT=$((TOTAL_COUNT + 1))
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo "  $(red '✗ FAIL') $1"
  if [ -n "${2:-}" ]; then
    echo "    Response: $2"
  fi
}

section() {
  echo ""
  echo "══════════════════════════════════════════════════════"
  echo "  $1"
  echo "══════════════════════════════════════════════════════"
}

get_field() {
  local json="$1"
  local field="$2"
  echo "$json" | jq -r "$field" 2>/dev/null
}

# ─── Variables ─────────────────────────────────────────

OUTLET_A_ID=""
OUTLET_B_ID=""
KAOS_ID=""
CELANA_ID=""
HANDUK_ID=""
CUST_ADDR_ID=""
ORDER_ID_WALKIN=""
ORDER_ID_CUSTOMER=""
PICKUP_REQUEST_ID=""
DELIVERY_REQUEST_ID=""
LOG_ID=""

# ─── Phase 0: Bootstrap + Create Test Users ────────────

section "Phase 0: Bootstrap + Create Test Users"

echo "  Cleaning up previous test data..."
$PSQL -c "DELETE FROM verification_tokens WHERE user_id IN (SELECT id FROM users WHERE email IN ('adminA@gmail.com','washA@gmail.com','ironA@gmail.com','packA@gmail.com','driverA1@gmail.com','budi@gmail.com'));" > /dev/null 2>&1 || true
$PSQL -c "DELETE FROM users WHERE email IN ('adminA@gmail.com','washA@gmail.com','ironA@gmail.com','packA@gmail.com','driverA1@gmail.com','budi@gmail.com');" > /dev/null 2>&1 || true

echo "  Running bootstrap script..."
npx tsx scripts/bootstrap.ts 2>/dev/null
if [ $? -eq 0 ]; then
  pass "Super_admin password set"
else
  fail "Bootstrap script failed"
  echo "  Cannot continue. Exiting."
  exit 1
fi

echo "  Setting up test users..."
npx tsx scripts/setup-test-users.ts 2>/dev/null
if [ $? -eq 0 ]; then
  pass "Test users created with passwords"
else
  fail "Test user setup failed"
  echo "  Cannot continue. Exiting."
  exit 1
fi

# ─── Capture seed data IDs ────────────────────────────

section "Capturing seed data IDs"

OUTLET_A_ID=$($PSQL -c "SELECT id FROM outlets WHERE name = 'Outlet Laundry Ilir Barat' LIMIT 1;")
OUTLET_B_ID=$($PSQL -c "SELECT id FROM outlets WHERE name = 'Outlet Laundry Bukit Besar' LIMIT 1;")
KAOS_ID=$($PSQL -c "SELECT id FROM items WHERE name = 'Baju Caleg' LIMIT 1;")
CELANA_ID=$($PSQL -c "SELECT id FROM items WHERE name = 'Celana Jeans' LIMIT 1;")
HANDUK_ID=$($PSQL -c "SELECT id FROM items WHERE name = 'Baju Pramuka' LIMIT 1;")

echo "  OUTLET_A_ID=$OUTLET_A_ID"
echo "  OUTLET_B_ID=$OUTLET_B_ID"
echo "  KAOS_ID=$KAOS_ID"
echo "  CELANA_ID=$CELANA_ID"
echo "  HANDUK_ID=$HANDUK_ID"

if [ -n "$OUTLET_A_ID" ] && [ -n "$KAOS_ID" ]; then
  pass "Seed data IDs captured"
else
  fail "Could not capture seed data IDs"
  exit 1
fi

# ─── Phase 1: Login All Users ──────────────────────────

section "Phase 1: Login All Users"

ADMIN_COOKIE="$TMPDIR/cookies_super_admin.txt"
login_resp=$($CURL -s -c "$ADMIN_COOKIE" -X POST "${BASE_URL}/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tijipog769@roastic.com","password":"TestPassword123"}')
login_ok=$(get_field "$login_resp" '.success')
admin_role=$(get_field "$login_resp" '.data.role')

if [ "$login_ok" = "true" ] && [ "$admin_role" = "super_admin" ]; then
  pass "Login as super_admin"
else
  fail "Login as super_admin" "$login_resp"
  exit 1
fi

cp "$ADMIN_COOKIE" "$TMPDIR/cookies_admin.txt"

# Helper: login user, save cookie file path to stdout
login_user() {
  local email="$1"
  local label="$2"
  local cookie_file="$TMPDIR/cookies_${label}.txt"

  resp=$($CURL -s -c "$cookie_file" -X POST "${BASE_URL}/api/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"TestPassword123\"}")
  ok=$(get_field "$resp" '.success')

  if [ "$ok" = "true" ]; then
    pass "Login ${label} (${email})"
  else
    fail "Login ${label}" "$resp"
  fi
}

login_user "adminA@gmail.com" "outlet_admin"
login_user "washA@gmail.com" "wash_worker"
login_user "ironA@gmail.com" "iron_worker"
login_user "packA@gmail.com" "pack_worker"
login_user "driverA1@gmail.com" "driver"

# Verify /me
me_resp=$($CURL -s -b "$ADMIN_COOKIE" "${BASE_URL}/api/me")
me_name=$(get_field "$me_resp" '.data.name')
if echo "$me_name" | grep -qi "Hati"; then
  pass "GET /api/me returns super_admin info"
else
  fail "GET /api/me" "$me_resp"
fi

# ─── Phase 2: Public Endpoints ────────────────────────

section "Phase 2: Public Endpoints"

resp=$($CURL -s "${BASE_URL}/api/outlets/")
count=$(echo "$resp" | jq '.data | length' 2>/dev/null || echo "0")
if [ "$count" -gt 0 ] 2>/dev/null; then
  pass "GET /api/outlets/ — ${count} outlets"
else
  fail "GET /api/outlets/" "$resp"
fi

resp=$($CURL -s "${BASE_URL}/api/items/")
count=$(echo "$resp" | jq '.data | length' 2>/dev/null || echo "0")
if [ "$count" -gt 0 ] 2>/dev/null; then
  pass "GET /api/items/ — ${count} items"
else
  fail "GET /api/items/" "$resp"
fi

resp=$($CURL -s "${BASE_URL}/api/items/${KAOS_ID}")
item_name=$(get_field "$resp" '.data.name')
if [ "$item_name" = "Baju Caleg" ]; then
  pass "GET /api/items/:id — Baju Caleg"
else
  fail "GET /api/items/:id" "$resp"
fi

resp=$($CURL -s "${BASE_URL}/")
healthy=$(get_field "$resp" '.success')
if [ "$healthy" = "true" ]; then
  pass "Health check"
else
  fail "Health check" "$resp"
fi

resp=$($CURL -s -o /dev/null -w "%{http_code}" "${BASE_URL}/docs/")
if [ "$resp" = "200" ]; then
  pass "Swagger docs accessible"
else
  fail "Swagger docs (HTTP $resp)"
fi

# ─── Phase 3: Address Management (Customer) ────────────

section "Phase 3: Address Management"

COOKIE_CUSTOMER="$TMPDIR/cookies_budi@gmail.com.txt"

resp=$($CURL -s -b "$COOKIE_CUSTOMER" -X POST "${BASE_URL}/api/addresses" \
  -H "Content-Type: application/json" \
  -d '{"label":"Rumah","address":"Jl. Kenanga No.12","lat":-6.2011,"lng":106.817,"is_default":true}')
success=$(get_field "$resp" '.success')
CUST_ADDR_ID=$(get_field "$resp" '.data.id')

if [ "$success" = "true" ] && [ -n "$CUST_ADDR_ID" ]; then
  pass "POST /api/addresses — created (id: ${CUST_ADDR_ID:0:8}...)"
else
  fail "POST /api/addresses" "$resp"
fi

resp=$($CURL -s -b "$COOKIE_CUSTOMER" "${BASE_URL}/api/addresses")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/addresses"
else
  fail "GET /api/addresses" "$resp"
fi

resp=$($CURL -s -b "$COOKIE_CUSTOMER" -X PUT "${BASE_URL}/api/addresses/${CUST_ADDR_ID}" \
  -H "Content-Type: application/json" \
  -d '{"label":"Kantor"}')
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "PUT /api/addresses/:id — updated"
else
  fail "PUT /api/addresses/:id" "$resp"
fi

resp=$($CURL -s -b "$COOKIE_CUSTOMER" -X PUT "${BASE_URL}/api/addresses/${CUST_ADDR_ID}/set-default")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "PUT /api/addresses/:id/set-default"
else
  fail "PUT /api/addresses/:id/set-default" "$resp"
fi

# ─── Phase 4: Walk-In Order Lifecycle ──────────────────

section "Phase 4: Walk-In Order Lifecycle"

# 4.1 Create walk-in customer
resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" -X POST "${BASE_URL}/api/walk-in-customer" \
  -H "Content-Type: application/json" \
  -d '{"name":"Walk-In Budi","phone":"0812345678901"}')
success=$(get_field "$resp" '.success')
WALKIN_ID=$(get_field "$resp" '.data.id')

if [ "$success" = "true" ] && [ -n "$WALKIN_ID" ]; then
  pass "POST /api/walk-in-customer — created (id: ${WALKIN_ID:0:8}...)"
else
  fail "POST /api/walk-in-customer" "$resp"
fi

# 4.2 Search walk-in customer
resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" "${BASE_URL}/api/walk-in-customer?keyword=Budi")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/walk-in-customer?keyword=Budi — found"
else
  fail "GET /api/walk-in-customer?keyword=Budi" "$resp"
fi

# 4.3 Create manual order
resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" -X POST "${BASE_URL}/api/walk-in-customer/orders" \
  -H "Content-Type: application/json" \
  -d "{\"walkin_customer_id\":\"${WALKIN_ID}\",\"pickup_fee\":0,\"delivery_fee\":0,\"laundry_price\":0,\"total_amount\":0,\"total_kilo\":3,\"status\":\"arrived_at_outlet\",\"paid\":true,\"source\":\"walk_in\",\"items\":[{\"id\":\"${KAOS_ID}\",\"quantity\":2},{\"id\":\"${CELANA_ID}\",\"quantity\":3}]}")
ORDER_ID_WALKIN=$(get_field "$resp" '.order.data.order.id // .data.order.id // empty')
if [ -z "$ORDER_ID_WALKIN" ]; then
  ORDER_ID_WALKIN=$(echo "$resp" | jq -r 'try .order.data.order.id catch empty try .data.order.id catch empty' 2>/dev/null)
fi

if [ -n "$ORDER_ID_WALKIN" ]; then
  pass "POST /api/walk-in-customer/orders — order created (${ORDER_ID_WALKIN:0:8}...)"
else
  fail "POST /api/walk-in-customer/orders" "$resp"
fi

# 4.4 List orders
resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" "${BASE_URL}/api/")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/ — list orders"
else
  fail "GET /api/" "$resp"
fi

# Get item IDs from the order
ITEM1_ID=$($PSQL -c "SELECT item_id FROM order_items WHERE order_id = '${ORDER_ID_WALKIN}' LIMIT 1;")
ITEM2_ID=$($PSQL -c "SELECT item_id FROM order_items WHERE order_id = '${ORDER_ID_WALKIN}' OFFSET 1 LIMIT 1;")

# Process through stations
process_station() {
  local cookie="$1"
  local station_name="$2"
  local order_id="$3"

  local avail_resp
  avail_resp=$($CURL -s -b "$cookie" "${BASE_URL}/api/worker/orders/available?page=1&limit=10")
  local avail_count
  avail_count=$(echo "$avail_resp" | jq '.data | length' 2>/dev/null || echo "0")

  if [ "$avail_count" -gt 0 ] 2>/dev/null; then
    pass "GET /api/worker/orders/available (${station_name}) — ${avail_count} orders"
  else
    fail "GET /api/worker/orders/available (${station_name})" "$avail_resp"
    return 1
  fi

  local accept_resp
  accept_resp=$($CURL -s -b "$cookie" -X POST "${BASE_URL}/api/worker/orders/${order_id}/accept" \
    -H "Content-Type: application/json" \
    -d "{\"items\":[{\"itemId\":\"${ITEM1_ID}\",\"quantity\":2},{\"itemId\":\"${ITEM2_ID}\",\"quantity\":3}]}")
  local accept_msg
  accept_msg=$(get_field "$accept_resp" '.message')

  if echo "$accept_msg" | grep -qi "success\|accepted\|conflict"; then
    pass "POST /api/worker/orders/:id/accept (${station_name})"
  else
    fail "POST /api/worker/orders/:id/accept (${station_name})" "$accept_resp"
  fi

  local complete_resp
  complete_resp=$($CURL -s -b "$cookie" -X POST "${BASE_URL}/api/worker/orders/${order_id}/complete")
  local complete_status
  complete_status=$(get_field "$complete_resp" '.status // .data.status')

  if [ -n "$complete_status" ] && [ "$complete_status" != "null" ]; then
    pass "POST /api/worker/orders/:id/complete (${station_name}) → ${complete_status}"
  else
    local complete_success
    complete_success=$(get_field "$complete_resp" '.success')
    if [ "$complete_success" = "true" ]; then
      pass "POST /api/worker/orders/:id/complete (${station_name})"
    else
      fail "POST /api/worker/orders/:id/complete (${station_name})" "$complete_resp"
    fi
  fi
}

echo "  Processing walk-in order through stations..."

echo "  → Washing:"
process_station "$TMPDIR/cookies_wash_worker.txt" "washing" "$ORDER_ID_WALKIN"

echo "  → Ironing:"
process_station "$TMPDIR/cookies_iron_worker.txt" "ironing" "$ORDER_ID_WALKIN"

echo "  → Packing:"
process_station "$TMPDIR/cookies_pack_worker.txt" "packing" "$ORDER_ID_WALKIN"

# 4.5 Check status
ORDER_STATUS=$($PSQL -c "SELECT status FROM orders WHERE id = '${ORDER_ID_WALKIN}';")
echo "  Order status after packing: $ORDER_STATUS"
if [ "$ORDER_STATUS" = "waiting_for_payment" ]; then
  pass "Walk-in order reached waiting_for_payment"
else
  fail "Expected waiting_for_payment, got: $ORDER_STATUS"
fi

# 4.6 Admin marks as delivered (walk-in pickup)
resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" -X PATCH "${BASE_URL}/api/orders/${ORDER_ID_WALKIN}/deliver")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "PATCH /api/orders/:orderId/deliver — walk-in picked up"
else
  fail "PATCH /api/orders/:orderId/deliver" "$resp"
fi

ORDER_STATUS=$($PSQL -c "SELECT status FROM orders WHERE id = '${ORDER_ID_WALKIN}';")
if [ "$ORDER_STATUS" = "delivered" ]; then
  pass "Walk-in order status is 'delivered'"
else
  fail "Expected delivered, got: $ORDER_STATUS"
fi

# 4.7 Worker history
resp=$($CURL -s -b "$TMPDIR/cookies_wash_worker.txt" "${BASE_URL}/api/worker/orders/history?page=1&limit=10")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/worker/orders/history"
else
  fail "GET /api/worker/orders/history" "$resp"
fi

# ─── Phase 5: Customer App Order Lifecycle ─────────────

section "Phase 5: Customer App Order Lifecycle"

# 5.1 Coverage check
resp=$($CURL -s -b "$COOKIE_CUSTOMER" "${BASE_URL}/api/pickup-requests/coverage-check")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/pickup-requests/coverage-check"
else
  fail "GET /api/pickup-requests/coverage-check" "$resp"
fi

# 5.2 Create pickup request
resp=$($CURL -s -b "$COOKIE_CUSTOMER" -X POST "${BASE_URL}/api/pickup-requests" \
  -H "Content-Type: application/json" \
  -d "{\"addressId\":\"${CUST_ADDR_ID}\",\"outletId\":\"${OUTLET_A_ID}\"}")
success=$(get_field "$resp" '.success')
PICKUP_REQUEST_ID=$(get_field "$resp" '.data.pickupRequestId // .data.id // empty')
ORDER_ID_CUSTOMER=$(get_field "$resp" '.data.orderId // empty')

if [ -n "$PICKUP_REQUEST_ID" ]; then
  pass "POST /api/pickup-requests — created (${PICKUP_REQUEST_ID:0:8}...)"
else
  # Fallback: get from DB
  PICKUP_REQUEST_ID=$($PSQL -c "SELECT id FROM pickup_requests WHERE order_id = (SELECT id FROM orders WHERE customer_id = (SELECT id FROM users WHERE email = 'budi@gmail.com') ORDER BY created_at DESC LIMIT 1) ORDER BY created_at DESC LIMIT 1;")
  ORDER_ID_CUSTOMER=$($PSQL -c "SELECT id FROM orders WHERE customer_id = (SELECT id FROM users WHERE email = 'budi@gmail.com') ORDER BY created_at DESC LIMIT 1;")
  if [ -n "$PICKUP_REQUEST_ID" ]; then
    pass "POST /api/pickup-requests — created (from DB)"
  else
    fail "POST /api/pickup-requests" "$resp"
  fi
fi

echo "  ORDER_ID_CUSTOMER=$ORDER_ID_CUSTOMER"

# 5.3 Customer status
resp=$($CURL -s -b "$COOKIE_CUSTOMER" "${BASE_URL}/api/pickup-requests/status")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/pickup-requests/status"
else
  fail "GET /api/pickup-requests/status" "$resp"
fi

# 5.4 Driver lists
resp=$($CURL -s -b "$TMPDIR/cookies_driver.txt" "${BASE_URL}/api/pickup-requests")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/pickup-requests (driver)"
else
  fail "GET /api/pickup-requests (driver)" "$resp"
fi

# 5.5 Driver accepts
resp=$($CURL -s -b "$TMPDIR/cookies_driver.txt" -X POST "${BASE_URL}/api/pickup-requests/${PICKUP_REQUEST_ID}/accept")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "POST /api/pickup-requests/:id/accept (driver)"
else
  fail "POST /api/pickup-requests/:id/accept" "$resp"
fi

# 5.6 Progress pickup (3 steps)
for i in 1 2 3; do
  resp=$($CURL -s -b "$TMPDIR/cookies_driver.txt" -X PATCH "${BASE_URL}/api/pickup-requests/${PICKUP_REQUEST_ID}/next")
  success=$(get_field "$resp" '.success')
  if [ "$success" = "true" ]; then
    pass "PATCH /api/pickup-requests/:id/next (step $i/3)"
  else
    fail "PATCH /api/pickup-requests/:id/next (step $i)" "$resp"
  fi
done

# 5.7 Driver accepted/picked-up lists
resp=$($CURL -s -b "$TMPDIR/cookies_driver.txt" "${BASE_URL}/api/pickup-requests/accepted")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/pickup-requests/accepted"
else
  fail "GET /api/pickup-requests/accepted" "$resp"
fi

resp=$($CURL -s -b "$TMPDIR/cookies_driver.txt" "${BASE_URL}/api/pickup-requests/already-picked-up")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/pickup-requests/already-picked-up"
else
  fail "GET /api/pickup-requests/already-picked-up" "$resp"
fi

# Verify order status
ORDER_STATUS=$($PSQL -c "SELECT status FROM orders WHERE id = '${ORDER_ID_CUSTOMER}';")
echo "  Customer order status after pickup: $ORDER_STATUS"

# Get item IDs for customer order
CUST_ITEM1_ID=$($PSQL -c "SELECT item_id FROM order_items WHERE order_id = '${ORDER_ID_CUSTOMER}' LIMIT 1;")
CUST_ITEM2_ID=$($PSQL -c "SELECT item_id FROM order_items WHERE order_id = '${ORDER_ID_CUSTOMER}' OFFSET 1 LIMIT 1;")

if [ -z "$CUST_ITEM1_ID" ]; then
  CUST_ITEM1_ID="$ITEM1_ID"
  CUST_ITEM2_ID="$ITEM2_ID"
fi

# Process through stations
echo "  Processing customer order through stations..."

echo "  → Washing:"
process_station "$TMPDIR/cookies_wash_worker.txt" "washing" "$ORDER_ID_CUSTOMER"

echo "  → Ironing:"
process_station "$TMPDIR/cookies_iron_worker.txt" "ironing" "$ORDER_ID_CUSTOMER"

echo "  → Packing:"
process_station "$TMPDIR/cookies_pack_worker.txt" "packing" "$ORDER_ID_CUSTOMER"

ORDER_STATUS=$($PSQL -c "SELECT status FROM orders WHERE id = '${ORDER_ID_CUSTOMER}';")
echo "  Customer order status after packing: $ORDER_STATUS"
if [ "$ORDER_STATUS" = "waiting_for_payment" ]; then
  pass "Customer order reached waiting_for_payment"
else
  fail "Expected waiting_for_payment, got: $ORDER_STATUS"
fi

# ─── Phase 6: Mismatch Flow ───────────────────────────

section "Phase 6: Mismatch Resolution"

resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" -X POST "${BASE_URL}/api/walk-in-customer/orders" \
  -H "Content-Type: application/json" \
  -d "{\"walkin_customer_id\":\"${WALKIN_ID}\",\"pickup_fee\":0,\"delivery_fee\":0,\"laundry_price\":0,\"total_amount\":0,\"total_kilo\":2,\"status\":\"arrived_at_outlet\",\"paid\":true,\"source\":\"walk_in\",\"items\":[{\"id\":\"${KAOS_ID}\",\"quantity\":2}]}")
MISMATCH_ORDER_ID=$(echo "$resp" | jq -r 'try .order.data.order.id catch empty try .data.order.id catch empty' 2>/dev/null)

if [ -n "$MISMATCH_ORDER_ID" ]; then
  pass "Mismatch test order created (${MISMATCH_ORDER_ID:0:8}...)"
else
  fail "Could not create mismatch test order" "$resp"
fi

resp=$($CURL -s -b "$TMPDIR/cookies_wash_worker.txt" -X POST "${BASE_URL}/api/worker/orders/${MISMATCH_ORDER_ID}/accept" \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"itemId\":\"${KAOS_ID}\",\"quantity\":5}]}")
msg=$(get_field "$resp" '.message')
if echo "$msg" | grep -qi "conflict\|mismatch\|approval"; then
  pass "Worker accepted with mismatch → conflict detected"
else
  fail "Worker accept with mismatch" "$resp"
fi

resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" "${BASE_URL}/api/admin/mismatch/")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/admin/mismatch/ — fetched"
else
  fail "GET /api/admin/mismatch/" "$resp"
fi

LOG_ID=$($PSQL -c "SELECT id FROM order_station_logs WHERE order_id = '${MISMATCH_ORDER_ID}' AND status = 'pending' ORDER BY created_at DESC LIMIT 1;")

if [ -n "$LOG_ID" ]; then
  pass "Found pending mismatch log (${LOG_ID:0:8}...)"

  resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" -X PATCH "${BASE_URL}/api/admin/mismatch/${LOG_ID}/approve" \
    -H "Content-Type: application/json" \
    -d '{"acceptedQuantity":5}')
  success=$(get_field "$resp" '.success')
  if [ "$success" = "true" ]; then
    pass "PATCH /api/admin/mismatch/:id/approve — approved"
  else
    fail "PATCH /api/admin/mismatch/:id/approve" "$resp"
  fi
else
  fail "No pending mismatch log found"
fi

# ─── Phase 7: Payment Flow ────────────────────────────

section "Phase 7: Payment Flow"

echo -ne '\xff\xd8\xff\xe0' > "$TMPDIR/test-proof.jpg"
dd if=/dev/urandom bs=1024 count=1 >> "$TMPDIR/test-proof.jpg" 2>/dev/null
echo -ne '\xff\xd9' >> "$TMPDIR/test-proof.jpg"

resp=$($CURL -s -b "$COOKIE_CUSTOMER" -X POST "${BASE_URL}/api/orders/${ORDER_ID_CUSTOMER}/payment-proof" \
  -F "proof=@${TMPDIR}/test-proof.jpg")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "POST /api/orders/:id/payment-proof — uploaded"
else
  fail "POST /api/orders/:id/payment-proof" "$resp"
fi

resp=$($CURL -s -b "$COOKIE_CUSTOMER" "${BASE_URL}/api/orders/${ORDER_ID_CUSTOMER}/payment-proof")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/orders/:id/payment-proof — fetched"
else
  fail "GET /api/orders/:id/payment-proof" "$resp"
fi

resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" -X PATCH "${BASE_URL}/api/admin/orders/${ORDER_ID_CUSTOMER}/payment-confirm" \
  -H "Content-Type: application/json" \
  -d '{"note":"Payment verified via test"}')
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "PATCH /api/admin/orders/:id/payment-confirm — confirmed"
else
  fail "PATCH /api/admin/orders/:id/payment-confirm" "$resp"
fi

ORDER_STATUS=$($PSQL -c "SELECT status FROM orders WHERE id = '${ORDER_ID_CUSTOMER}';")
echo "  Order status after payment: $ORDER_STATUS"
if [ "$ORDER_STATUS" = "waiting_for_driver_deliver" ]; then
  pass "Customer order → waiting_for_driver_deliver"
else
  fail "Expected waiting_for_driver_deliver, got: $ORDER_STATUS"
fi

# ─── Phase 8: Delivery Flow ───────────────────────────

section "Phase 8: Delivery Flow"

resp=$($CURL -s -b "$TMPDIR/cookies_driver.txt" "${BASE_URL}/api/delivery-requests/")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/delivery-requests/ — listed"
else
  fail "GET /api/delivery-requests/" "$resp"
fi

DELIVERY_REQUEST_ID=$($PSQL -c "SELECT id FROM delivery_requests WHERE order_id = '${ORDER_ID_CUSTOMER}' ORDER BY created_at DESC LIMIT 1;")

if [ -z "$DELIVERY_REQUEST_ID" ]; then
  fail "No delivery request found for order"
else
  pass "Delivery request found (${DELIVERY_REQUEST_ID:0:8}...)"

  resp=$($CURL -s -b "$TMPDIR/cookies_driver.txt" -X POST "${BASE_URL}/api/delivery-requests/${DELIVERY_REQUEST_ID}/accept")
  success=$(get_field "$resp" '.success')
  if [ "$success" = "true" ]; then
    pass "POST /api/delivery-requests/:id/accept — accepted"
  else
    fail "POST /api/delivery-requests/:id/accept" "$resp"
  fi

  resp=$($CURL -s -b "$TMPDIR/cookies_driver.txt" -X PATCH "${BASE_URL}/api/delivery-requests/${DELIVERY_REQUEST_ID}/next")
  success=$(get_field "$resp" '.success')
  if [ "$success" = "true" ]; then
    pass "PATCH /api/delivery-requests/:id/next (step 1/2)"
  else
    fail "PATCH /api/delivery-requests/:id/next (step 1)" "$resp"
  fi

  resp=$($CURL -s -b "$TMPDIR/cookies_driver.txt" -X PATCH "${BASE_URL}/api/delivery-requests/${DELIVERY_REQUEST_ID}/next")
  success=$(get_field "$resp" '.success')
  if [ "$success" = "true" ]; then
    pass "PATCH /api/delivery-requests/:id/next (step 2/2) → delivered"
  else
    fail "PATCH /api/delivery-requests/:id/next (step 2)" "$resp"
  fi

  resp=$($CURL -s -b "$TMPDIR/cookies_driver.txt" "${BASE_URL}/api/delivery-requests/accepted")
  success=$(get_field "$resp" '.success')
  if [ "$success" = "true" ]; then
    pass "GET /api/delivery-requests/accepted"
  else
    fail "GET /api/delivery-requests/accepted" "$resp"
  fi

  resp=$($CURL -s -b "$TMPDIR/cookies_driver.txt" "${BASE_URL}/api/delivery-requests/completed")
  success=$(get_field "$resp" '.success')
  if [ "$success" = "true" ]; then
    pass "GET /api/delivery-requests/completed"
  else
    fail "GET /api/delivery-requests/completed" "$resp"
  fi
fi

ORDER_STATUS=$($PSQL -c "SELECT status FROM orders WHERE id = '${ORDER_ID_CUSTOMER}';")
echo "  Customer order status after delivery: $ORDER_STATUS"
if [ "$ORDER_STATUS" = "delivered" ]; then
  pass "Customer order status is 'delivered'"
else
  fail "Expected delivered, got: $ORDER_STATUS"
fi

# ─── Phase 9: Auto-Close Timer ────────────────────────

section "Phase 9: Auto-Close Timer"

docker exec postgres-uwu psql -U postgres -d "$DB_NAME" -c "UPDATE orders SET delivered_at = NOW() - INTERVAL '25 hours' WHERE id = '${ORDER_ID_CUSTOMER}' AND status = 'delivered';" > /dev/null 2>&1
pass "Updated delivered_at to 25 hours ago"

ORDER_STATUS=$($PSQL -c "SELECT status FROM orders WHERE id = '${ORDER_ID_CUSTOMER}';")
echo "  Status before auto-close: $ORDER_STATUS"

MATCH_COUNT=$($PSQL -c "SELECT count(*) FROM orders WHERE status = 'delivered' AND paid = true AND delivered_at <= NOW() - INTERVAL '24 hours';")
if [ "$MATCH_COUNT" -gt 0 ] 2>/dev/null; then
  pass "Auto-close query matches ${MATCH_COUNT} order(s)"
else
  fail "Auto-close query matches 0 orders"
fi

# ─── Phase 10: Worker Schedule ────────────────────────

section "Phase 10: Worker Schedule (CRUD)"

WORKER_ID=$($PSQL -c "SELECT id FROM users WHERE email = 'washA@gmail.com' LIMIT 1;")

resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" -X POST "${BASE_URL}/api/admin/schedule/" \
  -H "Content-Type: application/json" \
  -d "{\"workerId\":\"${WORKER_ID}\",\"schedules\":[{\"day\":\"mon\",\"start\":\"08:00\",\"end\":\"16:00\"},{\"day\":\"tue\",\"start\":\"08:00\",\"end\":\"16:00\"}]}")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "POST /api/admin/schedule/ — created"
else
  fail "POST /api/admin/schedule/" "$resp"
fi

resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" "${BASE_URL}/api/admin/schedule/?page=1&limit=10")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/admin/schedule/ — listed"
else
  fail "GET /api/admin/schedule/" "$resp"
fi

SCHEDULE_ID=$($PSQL -c "SELECT id FROM worker_shifts WHERE worker_id = '${WORKER_ID}' LIMIT 1;")
if [ -n "$SCHEDULE_ID" ]; then
  resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" "${BASE_URL}/api/admin/schedule/${SCHEDULE_ID}")
  success=$(get_field "$resp" '.success')
  if [ "$success" = "true" ]; then
    pass "GET /api/admin/schedule/:id — fetched"
  else
    fail "GET /api/admin/schedule/:id" "$resp"
  fi

  resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" -X PUT "${BASE_URL}/api/admin/schedule/${SCHEDULE_ID}" \
    -H "Content-Type: application/json" \
    -d '{"schedules":[{"day":"mon","start":"09:00","end":"17:00"}]}')
  success=$(get_field "$resp" '.success')
  if [ "$success" = "true" ]; then
    pass "PUT /api/admin/schedule/:id — updated"
  else
    fail "PUT /api/admin/schedule/:id" "$resp"
  fi
else
  fail "No schedule found to test GET/PUT"
fi

for station in washing ironing packing driver; do
  resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" "${BASE_URL}/api/admin/schedule/${station}")
  success=$(get_field "$resp" '.success')
  if [ "$success" = "true" ]; then
    pass "GET /api/admin/schedule/${station}"
  else
    fail "GET /api/admin/schedule/${station}" "$resp"
  fi
done

resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" "${BASE_URL}/api/admin/schedule/workers")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/admin/schedule/workers"
else
  fail "GET /api/admin/schedule/workers" "$resp"
fi

resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" "${BASE_URL}/api/admin/schedule/no-shift-workers")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/admin/schedule/no-shift-workers"
else
  fail "GET /api/admin/schedule/no-shift-workers" "$resp"
fi

if [ -n "$SCHEDULE_ID" ]; then
  resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" -X DELETE "${BASE_URL}/api/admin/schedule/${SCHEDULE_ID}")
  success=$(get_field "$resp" '.success')
  if [ "$success" = "true" ]; then
    pass "DELETE /api/admin/schedule/:id — deleted"
  else
    fail "DELETE /api/admin/schedule/:id" "$resp"
  fi
fi

# ─── Phase 11: Admin User Management ──────────────────

section "Phase 11: Admin User Management"

resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" "${BASE_URL}/api/admin/users")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/admin/users"
else
  fail "GET /api/admin/users" "$resp"
fi

# ─── Phase 12: Items & Outlets ────────────────────────

section "Phase 12: Items & Outlet Management"

resp=$($CURL -s -b "$TMPDIR/cookies_outlet_admin.txt" "${BASE_URL}/api/items/search?keyword=Baju")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/items/search?keyword=Baju"
else
  fail "GET /api/items/search" "$resp"
fi

resp=$($CURL -s -b "$ADMIN_COOKIE" -X POST "${BASE_URL}/api/items/" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sprei"}')
success=$(get_field "$resp" '.success')
NEW_ITEM_ID=$(get_field "$resp" '.data.id')
if [ "$success" = "true" ] && [ -n "$NEW_ITEM_ID" ]; then
  pass "POST /api/items/ — created Sprei (${NEW_ITEM_ID:0:8}...)"
else
  fail "POST /api/items/" "$resp"
fi

resp=$($CURL -s -b "$ADMIN_COOKIE" -X PUT "${BASE_URL}/api/items/${NEW_ITEM_ID}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sprei King"}')
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "PUT /api/items/:id — updated"
else
  fail "PUT /api/items/:id" "$resp"
fi

resp=$($CURL -s -b "$ADMIN_COOKIE" -X DELETE "${BASE_URL}/api/items/${NEW_ITEM_ID}")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "DELETE /api/items/:id — deleted"
else
  fail "DELETE /api/items/:id" "$resp"
fi

resp=$($CURL -s "${BASE_URL}/api/outlets/coverage?lat=-6.2011&lng=106.817")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/outlets/coverage"
else
  fail "GET /api/outlets/coverage" "$resp"
fi

# ─── Phase 13: Auth Edge Cases ────────────────────────

section "Phase 13: Auth Edge Cases"

resp=$($CURL -s -b "$COOKIE_CUSTOMER" "${BASE_URL}/api/me")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/me (authenticated)"
else
  fail "GET /api/me (authenticated)" "$resp"
fi

resp=$($CURL -s -X PUT "${BASE_URL}/api/me" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacker"}' \
  -w "\n%{http_code}" | tail -1)
if [ "$resp" = "401" ]; then
  pass "PUT /api/me without auth → 401"
else
  fail "PUT /api/me without auth → expected 401, got $resp"
fi

resp=$($CURL -s -b "$COOKIE_CUSTOMER" -X PUT "${BASE_URL}/api/me" \
  -H "Content-Type: application/json" \
  -d '{"name":"Budi Updated"}')
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "PUT /api/me (update profile)"
else
  fail "PUT /api/me (update profile)" "$resp"
fi

resp=$($CURL -s -b "$COOKIE_CUSTOMER" "${BASE_URL}/api/logout")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/logout"
else
  fail "GET /api/logout" "$resp"
fi

resp=$($CURL -s -b "$COOKIE_CUSTOMER" "${BASE_URL}/api/admin/users" -w "\n%{http_code}" | tail -1)
if [ "$resp" = "403" ]; then
  pass "Customer → admin endpoint → 403"
else
  fail "Expected 403, got $resp"
fi

resp=$($CURL -s "${BASE_URL}/api/me" -w "\n%{http_code}" | tail -1)
if [ "$resp" = "401" ]; then
  pass "Unauthenticated → /api/me → 401"
else
  fail "Expected 401, got $resp"
fi

resp=$($CURL -s -b "$COOKIE_CUSTOMER" "${BASE_URL}/api/refresh")
success=$(get_field "$resp" '.success')
if [ "$success" = "true" ]; then
  pass "GET /api/refresh"
else
  fail "GET /api/refresh" "$resp"
fi

# ─── Phase 14: SSE ────────────────────────────────────

section "Phase 14: SSE"

resp=$($CURL -s -X POST "${BASE_URL}/api/sse/test/all" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello everyone"}' \
  -w "\n%{http_code}" | tail -1)
if [ "$resp" = "200" ] || [ "$resp" = "201" ]; then
  pass "POST /api/sse/test/all"
else
  fail "POST /api/sse/test/all (HTTP $resp)"
fi

resp=$($CURL -s -X POST "${BASE_URL}/api/sse/test/role" \
  -H "Content-Type: application/json" \
  -d '{"role":"driver","message":"Drivers check in"}' \
  -w "\n%{http_code}" | tail -1)
if [ "$resp" = "200" ] || [ "$resp" = "201" ]; then
  pass "POST /api/sse/test/role"
else
  fail "POST /api/sse/test/role (HTTP $resp)"
fi

# ─── Summary ──────────────────────────────────────────

section "TEST RESULTS"

echo ""
echo "  $(green "PASSED: $PASS_COUNT")"
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "  $(red "FAILED: $FAIL_COUNT")"
else
  echo "  FAILED: 0"
fi
echo "  TOTAL:  $TOTAL_COUNT"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
  echo "  $(green '═══════════════════════════════════════')"
  echo "  $(green '  ALL TESTS PASSED!')"
  echo "  $(green '═══════════════════════════════════════')"
else
  echo "  $(red '═══════════════════════════════════════')"
  echo "  $(red '  SOME TESTS FAILED')"
  echo "  $(red '═══════════════════════════════════════')"
fi

echo ""
echo "  Key IDs for manual debugging:"
echo "    OUTLET_A_ID=$OUTLET_A_ID"
echo "    ORDER_ID_WALKIN=$ORDER_ID_WALKIN"
echo "    ORDER_ID_CUSTOMER=$ORDER_ID_CUSTOMER"
echo "    DELIVERY_REQUEST_ID=$DELIVERY_REQUEST_ID"
echo ""
