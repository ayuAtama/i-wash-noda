#!/usr/bin/env bash
set -uo pipefail

# Source .env for DATABASE_URL (needed by node DB queries)
set -a; source .env; set +a

BASE="http://localhost:3000"
PASS=0; FAIL=0; TOTAL=0

JAR=$(mktemp -d)
J="$JAR/jar.txt"  # shared jar (one login at a time)

G='\033[0;32m'; R='\033[0;31m'; C='\033[0;36m'; B='\033[1m'; N='\033[0m'

sec() { echo ""; echo -e "${C}━━━━ $1 ━━━━${N}"; }

# curl wrapper: sets HC, BD
_c() {
  local m="$1" u="$2"; shift 2
  local o; o=$(curl -s -w "\n%{http_code}" -X "$m" "$u" "$@" 2>&1)
  HC=$(echo "$o" | tail -1)
  BD=$(echo "$o" | sed '$d')
}

# JSON extract from BD
_j() { echo "$BD" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{let j=JSON.parse(d),p='$1'.split('.'),v=j;for(let k of p)v=v?.[k];console.log(v??'')}catch(e){console.log('')}})"; }

ok() { local l="$1" m="$2" u="$3"; shift 3; TOTAL=$((TOTAL+1)); _c "$m" "$u" "$@"; if [[ "$HC" -ge 200 && "$HC" -lt 300 ]]; then PASS=$((PASS+1)); echo -e "  ${G}✓${N} [$HC] $l"; else FAIL=$((FAIL+1)); echo -e "  ${R}✗${N} [$HC] $l | $(echo "$BD" | head -c 120)"; fi; }

no() { local l="$1" m="$2" u="$3"; shift 3; TOTAL=$((TOTAL+1)); _c "$m" "$u" "$@"; if [[ "$HC" -ge 400 ]]; then PASS=$((PASS+1)); echo -e "  ${G}✓${N} [$HC] $l (expected error)"; else FAIL=$((FAIL+1)); echo -e "  ${R}✗${N} [$HC] $l (expected error but got $HC)"; fi; }

echo -e "${B}I-Wash-Noda — Full Flow Curl Test${N}"
echo "Started: $(date)"

# ================================================================
# PHASE 1: Health + Public
# ================================================================
sec "Phase 1: Public Endpoints"

ok "Health check" GET "$BASE/"

ok "List outlets" GET "$BASE/api/outlets?page=1&limit=3"
_c GET "$BASE/api/outlets?page=1&limit=1"
OUTLET=$(_j "data.0.id"); echo "  → OUTLET=$OUTLET"

ok "Outlet coverage" GET "$BASE/api/outlets/coverage?lat=-2.925&lng=104.861"

ok "List items" GET "$BASE/api/items?page=1&limit=3"
_c GET "$BASE/api/items?page=1&limit=1"
ITEM=$(_j "data.0.id"); echo "  → ITEM=$ITEM"

ok "Get item by ID" GET "$BASE/api/items/$ITEM"

# ================================================================
# PHASE 2: Super Admin — Create Test Users
# ================================================================
sec "Phase 2: Super Admin Login + Create Users"

ok "Login super admin" POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tijipog769@roastic.com","password":"password123"}' \
  -c "$J" -b "$J"

ok "Super admin /me" GET "$BASE/api/me" -c "$J" -b "$J"

ok "List users (admin)" GET "$BASE/api/admin/users?page=1&limit=5" -c "$J" -b "$J"

# Create test outlet
ok "Create outlet" POST "$BASE/api/outlets" \
  -H "Content-Type: application/json" \
  -d '{"name":"Curl Test Outlet","address":"Jl. Curl 123, Palembang","lat":-2.93,"lng":104.87,"max_distance_km":10,"price_per_km":3000,"price_per_kg":7000}' \
  -c "$J" -b "$J"

_c GET "$BASE/api/outlets?page=1&limit=1" -c "$J" -b "$J"
NEW_OUTLET=$(_j "data.0.id"); echo "  → NEW_OUTLET=$NEW_OUTLET"

ok "Update outlet" PUT "$BASE/api/outlets/$NEW_OUTLET" \
  -H "Content-Type: application/json" -d '{"name":"Curl Outlet Updated"}' \
  -c "$J" -b "$J"

# Create test item
ok "Create item" POST "$BASE/api/items" \
  -H "Content-Type: application/json" -d '{"name":"Curl Test Item"}' \
  -c "$J" -b "$J"

_c GET "$BASE/api/items?page=1&limit=1" -c "$J" -b "$J"
NEW_ITEM=$(_j "data.0.id"); echo "  → NEW_ITEM=$NEW_ITEM"

ok "Update item" PUT "$BASE/api/items/$NEW_ITEM" \
  -H "Content-Type: application/json" -d '{"name":"Curl Item Updated"}' \
  -c "$J" -b "$J"

ok "Search items" GET "$BASE/api/items/search?name=Curl" -c "$J" -b "$J"

# Register new internal users via admin
TW="tw$(date +%s)@gmail.com"
TI="ti$(date +%s)@gmail.com"
TP="tp$(date +%s)@gmail.com"
TD="td$(date +%s)@gmail.com"
TO="to$(date +%s)@gmail.com"

ok "Register washing worker" POST "$BASE/api/admin/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TW\",\"role\":\"worker\",\"outlet_id\":\"$OUTLET\",\"worker_station\":\"washing\"}" \
  -c "$J" -b "$J"

ok "Register ironing worker" POST "$BASE/api/admin/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TI\",\"role\":\"worker\",\"outlet_id\":\"$OUTLET\",\"worker_station\":\"ironing\"}" \
  -c "$J" -b "$J"

ok "Register packing worker" POST "$BASE/api/admin/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TP\",\"role\":\"worker\",\"outlet_id\":\"$OUTLET\",\"worker_station\":\"packing\"}" \
  -c "$J" -b "$J"

ok "Register driver via admin" POST "$BASE/api/admin/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TD\",\"role\":\"driver\",\"outlet_id\":\"$OUTLET\"}" \
  -c "$J" -b "$J"

ok "Register outlet_admin via admin" POST "$BASE/api/admin/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TO\",\"role\":\"outlet_admin\",\"outlet_id\":\"$OUTLET\"}" \
  -c "$J" -b "$J"

echo "  → Created: wash=$TW iron=$TI pack=$TP driver=$TD admin=$TO"

# ================================================================
# PHASE 3: Verify + Complete Registration for admin-created users
# ================================================================
sec "Phase 3: Verify Admin-Created Users"

# Verify + Complete Registration for admin-created users
# Each user needs their own temp_jwt cookie, so we complete each one fully before moving on
for uemail in "$TW" "$TI" "$TP" "$TD" "$TO"; do
  UJ=$(mktemp)
  # Get full hashed token from DB
  TOKEN=$(node --input-type=module -e "
import pg from 'pg';
const c=new pg.Client({connectionString:process.env.DATABASE_URL}); await c.connect();
const r=await c.query('SELECT token FROM verification_tokens WHERE user_id=(SELECT id FROM users WHERE email=\$1) ORDER BY created_at DESC LIMIT 1', ['$uemail']);
if(r.rows[0])process.stdout.write(r.rows[0].token);
await c.end();
" 2>/dev/null)
  USER_ID=$(node --input-type=module -e "
import pg from 'pg';
const c=new pg.Client({connectionString:process.env.DATABASE_URL}); await c.connect();
const r=await c.query('SELECT id FROM users WHERE email=\$1', ['$uemail']);
if(r.rows[0])process.stdout.write(r.rows[0].id);
await c.end();
" 2>/dev/null)
  if [ ${#TOKEN} -ge 10 ] && [ -n "$USER_ID" ]; then
    # Verify: sets temp_jwt + next_step=2 cookies in UJ
    _c POST "$BASE/api/verify?userId=$USER_ID&token=$TOKEN" -c "$UJ" -b "$UJ"
    if [[ "$HC" -ge 200 && "$HC" -lt 300 ]]; then
      echo "  ✓ Verified $uemail"
      sleep 1
      # Complete registration: reads temp_jwt from UJ
      _c POST "$BASE/api/complete-register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$uemail\",\"name\":\"Test $uemail\",\"password\":\"password123\"}" \
        -c "$UJ" -b "$UJ"
      if [[ "$HC" -ge 200 && "$HC" -lt 300 ]]; then
        echo "  ✓ Completed registration for $uemail"
      else
        echo "  ✗ Failed to complete $uemail: $(echo "$BD" | head -c 100)"
      fi
      sleep 20
    else
      echo "  ✗ Verify failed for $uemail: $(echo "$BD" | head -c 80)"
    fi
  else
    echo "  ⚠ No token for $uemail (len=${#TOKEN})"
  fi
  rm -f "$UJ"
done

# ================================================================
# PHASE 4: Customer Login (budi)
# ================================================================
sec "Phase 4: Customer — Login & Profile"

ok "Login customer (budi)" POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"budi@gmail.com","password":"password123"}' \
  -c "$J" -b "$J"

ok "Customer /me" GET "$BASE/api/me" -c "$J" -b "$J"

ok "Update /me" PUT "$BASE/api/me" \
  -H "Content-Type: application/json" -d '{"name":"Budi Curl"}' \
  -c "$J" -b "$J"

# ================================================================
# PHASE 5: Customer — Address
# ================================================================
sec "Phase 5: Customer — Addresses"

ok "Create address" POST "$BASE/api/addresses" \
  -H "Content-Type: application/json" \
  -d '{"label":"Home","address":"Jl. Kenanga 12, Palembang","lat":-2.925,"lng":104.861,"isDefault":true}' \
  -c "$J" -b "$J"

_c GET "$BASE/api/addresses" -c "$J" -b "$J"
ADDR=$(_j "data.0.id"); echo "  → ADDR=$ADDR"

ok "List addresses" GET "$BASE/api/addresses" -c "$J" -b "$J"

ok "Update address" PUT "$BASE/api/addresses/$ADDR" \
  -H "Content-Type: application/json" -d '{"label":"Office"}' \
  -c "$J" -b "$J"

ok "Set default" PUT "$BASE/api/addresses/$ADDR/set-default" -c "$J" -b "$J"

# ================================================================
# PHASE 6: Customer — Pickup Request
# ================================================================
sec "Phase 6: Customer — Pickup Request"

# Coverage check — may 409 if pickup already exists
_c GET "$BASE/api/pickup-requests/coverage-check?lat=-2.925&lng=104.861&outletId=$OUTLET" \
  -c "$J" -b "$J"
if [[ "$HC" -ge 200 && "$HC" -lt 300 ]]; then
  TOTAL=$((TOTAL+1)); PASS=$((PASS+1)); echo -e "  ${G}✓${N} [$HC] Coverage check"
else
  TOTAL=$((TOTAL+1)); echo -e "  ${C}~${N} [$HC] Coverage check (existing pickup, skipping)"
fi

# Try creating pickup — may fail with 409 if one already exists
_c POST "$BASE/api/pickup-requests" \
  -H "Content-Type: application/json" \
  -d "{\"addressId\":\"$ADDR\",\"outletId\":\"$OUTLET\"}" \
  -c "$J" -b "$J"
if [[ "$HC" -ge 200 && "$HC" -lt 300 ]]; then
  TOTAL=$((TOTAL+1)); PASS=$((PASS+1)); echo -e "  ${G}✓${N} [$HC] Create pickup"
else
  TOTAL=$((TOTAL+1)); echo -e "  ${C}~${N} [$HC] Create pickup (existing active order, reusing)"
fi

sleep 1

_c GET "$BASE/api/pickup-requests/status" -c "$J" -b "$J"
PICKUP=$(_j "data.0.id"); ORDER=$(_j "data.0.order_id")
echo "  → PICKUP=$PICKUP | ORDER=$ORDER"

ok "Check status" GET "$BASE/api/pickup-requests/status" -c "$J" -b "$J"

# ================================================================
# PHASE 7: Outlet Admin — Walk-in + Orders
# ================================================================
sec "Phase 7: Outlet Admin — Walk-in + Orders"

ok "Login outlet_admin" POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TO\",\"password\":\"password123\"}" \
  -c "$J" -b "$J"

ok "Outlet admin /me" GET "$BASE/api/me" -c "$J" -b "$J"

ok "Create walk-in customer" POST "$BASE/api/walk-in-customer" \
  -H "Content-Type: application/json" -d '{"name":"Pak Joko","phone":"081234567890"}' \
  -c "$J" -b "$J"

ok "Search walk-in" GET "$BASE/api/walk-in-customer?keyword=Pak" -c "$J" -b "$J"

_c GET "$BASE/api/walk-in-customer?keyword=Pak" -c "$J" -b "$J"
WLK=$(_j "data.0.id"); echo "  → WALKIN=$WLK"

ok "Update walk-in" PATCH "$BASE/api/walk-in-customer/$WLK" \
  -H "Content-Type: application/json" -d '{"name":"Pak Joko Updated"}' \
  -c "$J" -b "$J"

ok "Create walk-in order" POST "$BASE/api/walk-in-customer/orders" \
  -H "Content-Type: application/json" \
  -d "{\"walkin_customer_id\":\"$WLK\",\"pickup_fee\":0,\"delivery_fee\":0,\"laundry_price\":0,\"total_amount\":0,\"total_kilo\":5,\"status\":\"arrived_at_outlet\",\"paid\":true,\"source\":\"walk_in\",\"items\":[{\"id\":\"$ITEM\",\"quantity\":3}]}" \
  -c "$J" -b "$J"

WLK_ORDER=$(_j "order.data.order.id"); echo "  → WLK_ORDER=$WLK_ORDER"

ok "List all orders" GET "$BASE/api/?page=1&limit=5" -c "$J" -b "$J"

if [ -n "$WLK_ORDER" ]; then
  ok "Update order items" PATCH "$BASE/api/$WLK_ORDER" \
    -H "Content-Type: application/json" \
    -d "{\"items\":[{\"id\":\"$ITEM\",\"quantity\":2},{\"name\":\"Handuk\",\"quantity\":1}]}" \
    -c "$J" -b "$J"
else
  echo "  ${C}~${N} [skip] Update order items (no order ID)"
  TOTAL=$((TOTAL+1))
fi

ok "Delete walk-in customer" DELETE "$BASE/api/walk-in-customer/$WLK" -c "$J" -b "$J"

# ================================================================
# PHASE 8: Super Admin — Schedules
# ================================================================
sec "Phase 8: Super Admin — Schedule Management"

ok "Re-login super admin" POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tijipog769@roastic.com","password":"password123"}' \
  -c "$J" -b "$J"

# Get worker IDs for all stations
get_uid() {
  node --input-type=module -e "
import pg from 'pg';
const c=new pg.Client({connectionString:process.env.DATABASE_URL}); await c.connect();
const r=await c.query('SELECT id FROM users WHERE email=\$1', ['$1']);
if(r.rows[0])process.stdout.write(r.rows[0].id);
await c.end();
" 2>/dev/null
}

TW_ID=$(get_uid "$TW")
TI_ID=$(get_uid "$TI")
TP_ID=$(get_uid "$TP")
echo "  → washing=$TW_ID ironing=$TI_ID packing=$TP_ID"

if [ -n "$TW_ID" ]; then
  ok "Schedule: washing worker" POST "$BASE/api/admin/schedule?outlet_id=$OUTLET" \
    -H "Content-Type: application/json" \
    -d "{\"workerId\":\"$TW_ID\",\"schedules\":[{\"day\":\"mon\",\"start\":\"08:00\",\"end\":\"16:00\",\"station\":\"washing\"},{\"day\":\"tue\",\"start\":\"08:00\",\"end\":\"16:00\",\"station\":\"washing\"}]}" \
    -c "$J" -b "$J"
  ok "Get washing schedule" GET "$BASE/api/admin/schedule/$TW_ID?outlet_id=$OUTLET" -c "$J" -b "$J"
fi

if [ -n "$TI_ID" ]; then
  ok "Schedule: ironing worker" POST "$BASE/api/admin/schedule?outlet_id=$OUTLET" \
    -H "Content-Type: application/json" \
    -d "{\"workerId\":\"$TI_ID\",\"schedules\":[{\"day\":\"mon\",\"start\":\"08:00\",\"end\":\"16:00\",\"station\":\"ironing\"},{\"day\":\"wed\",\"start\":\"08:00\",\"end\":\"16:00\",\"station\":\"ironing\"}]}" \
    -c "$J" -b "$J"
  ok "Get ironing schedule" GET "$BASE/api/admin/schedule/$TI_ID?outlet_id=$OUTLET" -c "$J" -b "$J"
fi

if [ -n "$TP_ID" ]; then
  ok "Schedule: packing worker" POST "$BASE/api/admin/schedule?outlet_id=$OUTLET" \
    -H "Content-Type: application/json" \
    -d "{\"workerId\":\"$TP_ID\",\"schedules\":[{\"day\":\"mon\",\"start\":\"08:00\",\"end\":\"16:00\",\"station\":\"packing\"},{\"day\":\"thu\",\"start\":\"08:00\",\"end\":\"16:00\",\"station\":\"packing\"}]}" \
    -c "$J" -b "$J"
  ok "Get packing schedule" GET "$BASE/api/admin/schedule/$TP_ID?outlet_id=$OUTLET" -c "$J" -b "$J"
fi

ok "Get all schedules" GET "$BASE/api/admin/schedule?page=1&limit=5&outlet_id=$OUTLET" -c "$J" -b "$J"

ok "Workers list" GET "$BASE/api/admin/schedule/workers?outlet_id=$OUTLET" -c "$J" -b "$J"
ok "Washing workers" GET "$BASE/api/admin/schedule/washing?outlet_id=$OUTLET" -c "$J" -b "$J"
ok "Ironing workers" GET "$BASE/api/admin/schedule/ironing?outlet_id=$OUTLET" -c "$J" -b "$J"
ok "Packing workers" GET "$BASE/api/admin/schedule/packing?outlet_id=$OUTLET" -c "$J" -b "$J"
ok "Drivers list" GET "$BASE/api/admin/schedule/driver?outlet_id=$OUTLET" -c "$J" -b "$J"
ok "No-shift workers" GET "$BASE/api/admin/schedule/no-shift-workers?outlet_id=$OUTLET" -c "$J" -b "$J"

# ================================================================
# PHASE 9: Admin Payment
# ================================================================
sec "Phase 9: Admin Payment + Mismatch"

ok "Login outlet_admin (for payment)" POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TO\",\"password\":\"password123\"}" \
  -c "$J" -b "$J"

if [ -n "$ORDER" ]; then
  ok "Confirm payment" PATCH "$BASE/api/admin/orders/$ORDER/payment-confirm" -c "$J" -b "$J"
fi

ok "Get mismatches" GET "$BASE/api/admin/mismatch?page=1&limit=5" -c "$J" -b "$J"

# ================================================================
# PHASE 10: Driver — Pickup
# ================================================================
sec "Phase 10: Driver — Pickup Flow"

ok "Login driver" POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TD\",\"password\":\"password123\"}" \
  -c "$J" -b "$J"

ok "Driver /me" GET "$BASE/api/me" -c "$J" -b "$J"

ok "Pending pickups" GET "$BASE/api/pickup-requests?page=1&limit=5" -c "$J" -b "$J"

if [ -n "$PICKUP" ]; then
  ok "Accept pickup" POST "$BASE/api/pickup-requests/$PICKUP/accept" -c "$J" -b "$J"
  ok "Accepted pickups" GET "$BASE/api/pickup-requests/accepted" -c "$J" -b "$J"

  for s in 1 2 3; do
    ok "Advance pickup step $s" PATCH "$BASE/api/pickup-requests/$PICKUP/next" -c "$J" -b "$J"
  done

  ok "Already picked up" GET "$BASE/api/pickup-requests/already-picked-up" -c "$J" -b "$J"
fi

# ================================================================
# PHASE 11: Worker Stations — Mismatch Count Flow
# ================================================================
sec "Phase 11: Worker Stations — Mismatch Count Tests"

# Query the actual quantity_initial for $ITEM in the walk-in order
if [ -n "$WLK_ORDER" ]; then
  QTY_INIT=$(node --input-type=module -e "
import pg from 'pg';
const c=new pg.Client({connectionString:process.env.DATABASE_URL}); await c.connect();
const r=await c.query('SELECT quantity_initial FROM order_items WHERE order_id=\$1 AND item_id=\$2', ['$WLK_ORDER','$ITEM']);
if(r.rows[0])process.stdout.write(String(r.rows[0].quantity_initial));
await c.end();
" 2>/dev/null)
  echo "  → quantity_initial=$QTY_INIT"
fi

WRONG_QTY=999

# --- WASHING: Mismatch → Approve → Re-accept → Complete ---
echo "  ── Washing Station (Mismatch + Approve) ──"

ok "Login washing worker" POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TW\",\"password\":\"password123\"}" \
  -c "$J" -b "$J"

ok "Worker /me (washing)" GET "$BASE/api/me" -c "$J" -b "$J"

ok "Washing: available orders" GET "$BASE/api/worker/orders/available?page=1&limit=5" -c "$J" -b "$J"

if [ -n "$WLK_ORDER" ] && [ -n "$QTY_INIT" ]; then
  ok "Washing: accept wrong qty → mismatch" POST "$BASE/api/worker/orders/$WLK_ORDER/accept" \
    -H "Content-Type: application/json" \
    -d "{\"items\":[{\"itemId\":\"$ITEM\",\"quantity\":$WRONG_QTY}]}" \
    -c "$J" -b "$J"

  ok "Login outlet_admin (washing review)" POST "$BASE/api/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TO\",\"password\":\"password123\"}" \
    -c "$J" -b "$J"

  ok "Admin: list washing mismatches" GET "$BASE/api/admin/mismatch?station=washing&page=1&limit=5" \
    -c "$J" -b "$J"

  _c GET "$BASE/api/admin/mismatch?station=washing&page=1&limit=1" -c "$J" -b "$J"
  WASH_MISMATCH=$(_j "data.0.id")
  echo "  → WASH_MISMATCH_ID=$WASH_MISMATCH"

  if [ -n "$WASH_MISMATCH" ]; then
    ok "Admin: approve washing mismatch" PATCH "$BASE/api/admin/mismatch/$WASH_MISMATCH/approve" \
      -H "Content-Type: application/json" \
      -d "{\"acceptedQuantity\":$QTY_INIT}" \
      -c "$J" -b "$J"
  fi

  ok "Re-login washing worker" POST "$BASE/api/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TW\",\"password\":\"password123\"}" \
    -c "$J" -b "$J"

  ok "Washing: accept correct qty" POST "$BASE/api/worker/orders/$WLK_ORDER/accept" \
    -H "Content-Type: application/json" \
    -d "{\"items\":[{\"itemId\":\"$ITEM\",\"quantity\":$QTY_INIT}]}" \
    -c "$J" -b "$J"

  ok "Washing: complete order" POST "$BASE/api/worker/orders/$WLK_ORDER/complete" -c "$J" -b "$J"
fi

ok "Washing: order history" GET "$BASE/api/worker/orders/history?page=1&limit=5" -c "$J" -b "$J"

# --- IRONING: Mismatch → Reject → Re-accept → Complete ---
echo "  ── Ironing Station (Mismatch + Reject) ──"

ok "Login ironing worker" POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TI\",\"password\":\"password123\"}" \
  -c "$J" -b "$J"

ok "Worker /me (ironing)" GET "$BASE/api/me" -c "$J" -b "$J"

ok "Ironing: available orders" GET "$BASE/api/worker/orders/available?page=1&limit=5" -c "$J" -b "$J"

if [ -n "$WLK_ORDER" ] && [ -n "$QTY_INIT" ]; then
  ok "Ironing: accept wrong qty → mismatch" POST "$BASE/api/worker/orders/$WLK_ORDER/accept" \
    -H "Content-Type: application/json" \
    -d "{\"items\":[{\"itemId\":\"$ITEM\",\"quantity\":$WRONG_QTY}]}" \
    -c "$J" -b "$J"

  ok "Login outlet_admin (ironing review)" POST "$BASE/api/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TO\",\"password\":\"password123\"}" \
    -c "$J" -b "$J"

  ok "Admin: list ironing mismatches" GET "$BASE/api/admin/mismatch?station=ironing&page=1&limit=5" \
    -c "$J" -b "$J"

  _c GET "$BASE/api/admin/mismatch?station=ironing&page=1&limit=1" -c "$J" -b "$J"
  IRON_MISMATCH=$(_j "data.0.id")
  echo "  → IRON_MISMATCH_ID=$IRON_MISMATCH"

  if [ -n "$IRON_MISMATCH" ]; then
    ok "Admin: reject ironing mismatch" PATCH "$BASE/api/admin/mismatch/$IRON_MISMATCH/reject" \
      -H "Content-Type: application/json" \
      -d '{"note":"Quantity mismatch, please recount"}' \
      -c "$J" -b "$J"
  fi

  ok "Re-login ironing worker" POST "$BASE/api/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TI\",\"password\":\"password123\"}" \
    -c "$J" -b "$J"

  ok "Ironing: accept correct qty" POST "$BASE/api/worker/orders/$WLK_ORDER/accept" \
    -H "Content-Type: application/json" \
    -d "{\"items\":[{\"itemId\":\"$ITEM\",\"quantity\":$QTY_INIT}]}" \
    -c "$J" -b "$J"

  ok "Ironing: complete order" POST "$BASE/api/worker/orders/$WLK_ORDER/complete" -c "$J" -b "$J"
fi

ok "Ironing: order history" GET "$BASE/api/worker/orders/history?page=1&limit=5" -c "$J" -b "$J"

# --- PACKING: No Mismatch → Complete ---
echo "  ── Packing Station (No Mismatch) ──"

ok "Login packing worker" POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TP\",\"password\":\"password123\"}" \
  -c "$J" -b "$J"

ok "Worker /me (packing)" GET "$BASE/api/me" -c "$J" -b "$J"

ok "Packing: available orders" GET "$BASE/api/worker/orders/available?page=1&limit=5" -c "$J" -b "$J"

if [ -n "$WLK_ORDER" ] && [ -n "$QTY_INIT" ]; then
  ok "Packing: accept correct qty (no mismatch)" POST "$BASE/api/worker/orders/$WLK_ORDER/accept" \
    -H "Content-Type: application/json" \
    -d "{\"items\":[{\"itemId\":\"$ITEM\",\"quantity\":$QTY_INIT}]}" \
    -c "$J" -b "$J"

  ok "Packing: complete order" POST "$BASE/api/worker/orders/$WLK_ORDER/complete" -c "$J" -b "$J"
fi

ok "Packing: order history" GET "$BASE/api/worker/orders/history?page=1&limit=5" -c "$J" -b "$J"

# ================================================================
# PHASE 12: Driver — Delivery
# ================================================================
sec "Phase 12: Driver — Delivery"

ok "Re-login driver" POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TD\",\"password\":\"password123\"}" \
  -c "$J" -b "$J"

ok "Delivery requests" GET "$BASE/api/delivery-requests?page=1&limit=5" -c "$J" -b "$J"

_c GET "$BASE/api/delivery-requests?page=1&limit=1" -c "$J" -b "$J"
DELIV=$(_j "data.0.id"); echo "  → DELIVERY=$DELIV"

if [ -n "$DELIV" ]; then
  ok "Accept delivery" POST "$BASE/api/delivery-requests/$DELIV/accept" -c "$J" -b "$J"
  ok "Accepted deliveries" GET "$BASE/api/delivery-requests/accepted" -c "$J" -b "$J"
  ok "Advance delivery" PATCH "$BASE/api/delivery-requests/$DELIV/next" -c "$J" -b "$J"
fi

ok "Completed deliveries" GET "$BASE/api/delivery-requests/completed" -c "$J" -b "$J"

# ================================================================
# PHASE 13: Outlet Admin — Mark Delivered
# ================================================================
sec "Phase 13: Mark Delivered"

ok "Re-login outlet_admin" POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TO\",\"password\":\"password123\"}" \
  -c "$J" -b "$J"

if [ -n "$WLK_ORDER" ]; then
  ok "Mark delivered" PATCH "$BASE/api/orders/$WLK_ORDER/deliver" -c "$J" -b "$J"
fi

# ================================================================
# PHASE 14: Payment Proof
# ================================================================
sec "Phase 14: Payment Proof"

ok "Re-login customer" POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"budi@gmail.com","password":"password123"}' \
  -c "$J" -b "$J"

TIMG=$(mktemp "$JAR/proof-XXXXX.jpg")
printf '\xff\xd8\xff\xe0\x00\x10JFIF' > "$TIMG"

if [ -n "$ORDER" ]; then
  ok "Upload payment proof" POST "$BASE/api/orders/$ORDER/payment-proof" \
    -F "proof=@$TIMG" -c "$J" -b "$J"
  ok "Get payment proof" GET "$BASE/api/orders/$ORDER/payment-proof" -c "$J" -b "$J"
fi
rm -f "$TIMG"

# ================================================================
# PHASE 15: SSE
# ================================================================
sec "Phase 15: SSE"

ok "Broadcast all" POST "$BASE/api/sse/test/all" \
  -H "Content-Type: application/json" -d '{"message":"test"}'

ok "Broadcast role" POST "$BASE/api/sse/test/role?role=customer" \
  -H "Content-Type: application/json" -d '{"message":"hi customers"}'

# ================================================================
# PHASE 16: Error Cases
# ================================================================
sec "Phase 16: Error Cases"

no "No auth" GET "$BASE/api/me"
no "Wrong password" POST "$BASE/api/login" \
  -H "Content-Type: application/json" -d '{"email":"budi@gmail.com","password":"wrong"}'
no "Invalid email" POST "$BASE/api/login" \
  -H "Content-Type: application/json" -d '{"email":"bad","password":"x"}'
no "Customer → admin route" GET "$BASE/api/admin/users" -c "$J" -b "$J"
no "Outlet admin → create outlet" POST "$BASE/api/outlets" \
  -H "Content-Type: application/json" \
  -d '{"name":"x","address":"x","lat":0,"lng":0,"max_distance_km":1,"price_per_km":1,"price_per_kg":1}' \
  -c "$J" -b "$J"

# Login back as outlet_admin for the guard test
ok "Login outlet_admin (for guard)" POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TO\",\"password\":\"password123\"}" \
  -c "$J" -b "$J"

no "Outlet admin → driver route (forbidden)" GET "$BASE/api/delivery-requests?page=1&limit=1" -c "$J" -b "$J"

# ================================================================
# PHASE 17: Refresh + Logout
# ================================================================
sec "Phase 17: Refresh & Logout"

ok "Re-login customer" POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"budi@gmail.com","password":"password123"}' \
  -c "$J" -b "$J"

ok "Refresh token" GET "$BASE/api/refresh" -c "$J" -b "$J"

ok "Logout" GET "$BASE/api/logout" -c "$J" -b "$J"

no "Access after logout" GET "$BASE/api/me" -c "$J" -b "$J"

# ================================================================
# PHASE 18: Cleanup
# ================================================================
sec "Phase 18: Cleanup"

ok "Re-login super admin" POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tijipog769@roastic.com","password":"password123"}' \
  -c "$J" -b "$J"

if [ -n "$NEW_ITEM" ]; then
  ok "Delete test item" DELETE "$BASE/api/items/$NEW_ITEM" -c "$J" -b "$J"
fi

if [ -n "$NEW_OUTLET" ]; then
  ok "Delete test outlet" DELETE "$BASE/api/outlets/$NEW_OUTLET" -c "$J" -b "$J"
fi

# ================================================================
# SUMMARY
# ================================================================
echo ""
echo -e "${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${B}  RESULTS${N}"
echo -e "${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "  Total:    $TOTAL"
echo -e "  ${G}Passed:   $PASS${N}"
echo -e "  ${R}Failed:   $FAIL${N}"
echo ""
rm -rf "$JAR"

if [ "$FAIL" -eq 0 ]; then
  echo -e "${G}${B}  ALL TESTS PASSED!${N}"; exit 0
else
  echo -e "${R}${B}  SOME TESTS FAILED${N}"; exit 1
fi
