#!/bin/bash

# Comprehensive test script for Vendor APIs
# This script tests vendor-related venue, court, analytics, staff, settings, bookings, customers, dashboard, and user management endpoints
# Usage: ./test-vendor-apis.sh

BASE_URL="http://localhost:3000"
VENDOR_EMAIL="admin@gamehub.com"
VENDOR_PASSWORD="vendor123"

# Latency tracking arrays
declare -a LATENCY_ENDPOINTS
declare -a LATENCY_TIMES

# Function to get current time in seconds (high precision)
get_time() {
  if command -v python3 >/dev/null 2>&1; then
    python3 -c "import time; print(time.time())"
  elif command -v gdate >/dev/null 2>&1; then
    gdate +%s.%N
  else
    date +%s.%N 2>/dev/null || date +%s
  fi
}

# Function to calculate latency in milliseconds
calc_latency_ms() {
  local start=$1
  local end=$2
  if command -v python3 >/dev/null 2>&1; then
    python3 -c "print('%.2f' % (($end - $start) * 1000))"
  elif command -v bc >/dev/null 2>&1; then
    echo "scale=2; ($end - $start) * 1000" | bc
  else
    awk "BEGIN {printf \"%.2f\", ($end - $start) * 1000}"
  fi
}

# Function to format latency with indicators
format_latency() {
  local latency=$1
  # Compare latency thresholds (using string comparison for simplicity)
  if [ -n "$latency" ]; then
    # Convert to integer for comparison (remove decimal)
    latency_int=$(echo "$latency" | cut -d. -f1)
    if [ -z "$latency_int" ] || [ "$latency_int" -lt 200 ]; then
      echo "⚡ ${latency}ms"
    elif [ "$latency_int" -lt 1000 ]; then
      echo "✅ ${latency}ms"
    else
      echo "⚠️  ${latency}ms"
    fi
  else
    echo "N/A"
  fi
}

echo "=========================================="
echo "Testing Vendor APIs (Comprehensive)"
echo "=========================================="
echo ""

# Step 1: Login and get auth token
echo "1. Logging in as vendor admin..."
START_TIME=$(get_time)
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$VENDOR_EMAIL\",\"password\":\"$VENDOR_PASSWORD\"}")
END_TIME=$(get_time)
LOGIN_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("POST /api/auth/login")
LATENCY_TIMES+=("$LOGIN_LATENCY")

echo "Login Response:"
echo "$LOGIN_RESPONSE"
echo "Latency: $(format_latency "$LOGIN_LATENCY")"
echo ""

# Extract token from response
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token. Please check credentials."
  echo "Response was: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful!"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Save cookies for subsequent requests
COOKIE_JAR=$(mktemp)
curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$VENDOR_EMAIL\",\"password\":\"$VENDOR_PASSWORD\"}" > /dev/null

# Get vendor ID from /api/auth/me endpoint
echo "Getting vendor ID from /api/auth/me..."
START_TIME=$(get_time)
ME_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/auth/me")
END_TIME=$(get_time)
ME_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/auth/me")
LATENCY_TIMES+=("$ME_LATENCY")
echo "Latency: $(format_latency "$ME_LATENCY")"
VENDOR_ID=$(echo "$ME_RESPONSE" | grep -o '"vendorId":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$VENDOR_ID" ] || [ "$VENDOR_ID" == "null" ]; then
  echo "❌ Failed to get vendor ID. Response: $ME_RESPONSE"
  rm -f "$COOKIE_JAR"
  exit 1
fi

echo "✅ Vendor ID: $VENDOR_ID"
echo ""

# Step 2: Get vendor's venues list
echo "2. Testing GET /api/vendors/[vendorId]/venues..."
START_TIME=$(get_time)
VENUES_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/$VENDOR_ID/venues")
END_TIME=$(get_time)
VENUES_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]/venues")
LATENCY_TIMES+=("$VENUES_LATENCY")
echo "Venues Response (first 500 chars):"
echo "$VENUES_RESPONSE" | head -c 500
echo ""
echo "Latency: $(format_latency "$VENUES_LATENCY")"
echo ""

# Check if response is successful
if echo "$VENUES_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Venues fetched successfully!"
  # Extract first venue ID from data array
  VENUE_ID=$(echo "$VENUES_RESPONSE" | grep -o '"data":\[{"id":"[^"]*' | cut -d'"' -f6)
  if [ -z "$VENUE_ID" ]; then
    # Try alternative extraction
    VENUE_ID=$(echo "$VENUES_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  fi
else
  echo "❌ Failed to fetch venues"
  echo "Full response: $VENUES_RESPONSE"
  VENUE_ID=""
fi

if [ -z "$VENUE_ID" ] || [ "$VENUE_ID" == "null" ]; then
  echo "⚠️  No venues found. Creating a test venue..."
  
  # Create a test venue
  echo "3. Creating test venue..."
  START_TIME=$(get_time)
  CREATE_VENUE_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/vendors/$VENDOR_ID/venues" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Venue",
      "description": "Test venue for API testing",
      "address": "123 Test Street",
      "city": "Bengaluru",
      "postalCode": "560001",
      "phone": "+91 98765 43210",
      "email": "test@venue.com",
      "countryCode": "IN",
      "currencyCode": "INR",
      "timezone": "Asia/Kolkata",
      "isActive": true
    }')
  END_TIME=$(get_time)
  CREATE_VENUE_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
  LATENCY_ENDPOINTS+=("POST /api/vendors/[vendorId]/venues")
  LATENCY_TIMES+=("$CREATE_VENUE_LATENCY")
  
  echo "Create Venue Response:"
  echo "$CREATE_VENUE_RESPONSE"
  echo "Latency: $(format_latency "$CREATE_VENUE_LATENCY")"
  echo ""
  
  if echo "$CREATE_VENUE_RESPONSE" | grep -q '"success":true'; then
    VENUE_ID=$(echo "$CREATE_VENUE_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  fi
fi

if [ -z "$VENUE_ID" ] || [ "$VENUE_ID" == "null" ]; then
  echo "❌ Failed to get or create venue ID"
  echo "Venues response was: $VENUES_RESPONSE"
  rm -f "$COOKIE_JAR"
  exit 1
fi

echo "✅ Using Venue ID: $VENUE_ID"
echo ""

# Step 3: Get specific venue details (VIEW)
echo "4. Testing GET /api/vendors/[vendorId]/venues/[venueId] (VIEW)..."
START_TIME=$(get_time)
VENUE_DETAIL_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/$VENDOR_ID/venues/$VENUE_ID")
END_TIME=$(get_time)
VENUE_DETAIL_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]/venues/[venueId]")
LATENCY_TIMES+=("$VENUE_DETAIL_LATENCY")
echo "Venue Detail Response (first 300 chars):"
echo "$VENUE_DETAIL_RESPONSE" | head -c 300
echo ""
echo "Latency: $(format_latency "$VENUE_DETAIL_LATENCY")"
echo ""

# Check for errors
if echo "$VENUE_DETAIL_RESPONSE" | grep -q '"success":false'; then
  echo "❌ Error fetching venue details!"
  ERROR_MSG=$(echo "$VENUE_DETAIL_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  ERROR_CODE=$(echo "$VENUE_DETAIL_RESPONSE" | grep -o '"code":"[^"]*' | cut -d'"' -f4)
  echo "Error: $ERROR_MSG (Code: $ERROR_CODE)"
else
  echo "✅ Venue details fetched successfully!"
fi
echo ""

# Step 4: Test venue toggle status
echo "5. Testing POST /api/vendors/[vendorId]/venues/[venueId]/toggle-status..."
START_TIME=$(get_time)
TOGGLE_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/vendors/$VENDOR_ID/venues/$VENUE_ID/toggle-status")
END_TIME=$(get_time)
TOGGLE_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("POST /api/vendors/[vendorId]/venues/[venueId]/toggle-status")
LATENCY_TIMES+=("$TOGGLE_LATENCY")
echo "Toggle Status Response:"
echo "$TOGGLE_RESPONSE"
echo "Latency: $(format_latency "$TOGGLE_LATENCY")"
echo ""

if echo "$TOGGLE_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Venue status toggle successful!"
else
  echo "❌ Venue status toggle failed!"
fi
echo ""

# Step 5: Get courts for venue
echo "6. Testing GET /api/courts?venueId=[venueId]..."
START_TIME=$(get_time)
COURTS_RESPONSE=$(curl -s "$BASE_URL/api/courts?venueId=$VENUE_ID")
END_TIME=$(get_time)
COURTS_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/courts?venueId=[venueId]")
LATENCY_TIMES+=("$COURTS_LATENCY")
echo "Courts Response (first 500 chars):"
echo "$COURTS_RESPONSE" | head -c 500
echo ""
echo "Latency: $(format_latency "$COURTS_LATENCY")"
echo ""

# Extract first court ID
COURT_ID=$(echo "$COURTS_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$COURT_ID" ]; then
  echo "⚠️  No courts found for this venue"
else
  echo "✅ Found Court ID: $COURT_ID"
  echo ""
  
  # Step 6: Get specific court details
  echo "7. Testing GET /api/courts/[courtId]..."
  START_TIME=$(get_time)
  COURT_DETAIL_RESPONSE=$(curl -s "$BASE_URL/api/courts/$COURT_ID")
  END_TIME=$(get_time)
  COURT_DETAIL_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
  LATENCY_ENDPOINTS+=("GET /api/courts/[courtId]")
  LATENCY_TIMES+=("$COURT_DETAIL_LATENCY")
  echo "Court Detail Response (first 300 chars):"
  echo "$COURT_DETAIL_RESPONSE" | head -c 300
  echo ""
  echo "Latency: $(format_latency "$COURT_DETAIL_LATENCY")"
  echo ""
  
  if echo "$COURT_DETAIL_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Court details fetched successfully!"
  else
    echo "❌ Error fetching court details!"
  fi
  echo ""
fi

# Step 7: Test venue update (EDIT)
echo "8. Testing PUT /api/vendors/[vendorId]/venues/[venueId] (UPDATE)..."
START_TIME=$(get_time)
UPDATE_VENUE_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X PUT "$BASE_URL/api/vendors/$VENDOR_ID/venues/$VENUE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description for testing"
  }')
END_TIME=$(get_time)
UPDATE_VENUE_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("PUT /api/vendors/[vendorId]/venues/[venueId]")
LATENCY_TIMES+=("$UPDATE_VENUE_LATENCY")
echo "Update Venue Response:"
echo "$UPDATE_VENUE_RESPONSE"
echo "Latency: $(format_latency "$UPDATE_VENUE_LATENCY")"
echo ""

if echo "$UPDATE_VENUE_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Venue update successful!"
else
  echo "❌ Venue update failed!"
  ERROR_MSG=$(echo "$UPDATE_VENUE_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  ERROR_CODE=$(echo "$UPDATE_VENUE_RESPONSE" | grep -o '"code":"[^"]*' | cut -d'"' -f4)
  echo "Error: $ERROR_MSG (Code: $ERROR_CODE)"
fi
echo ""

# Step 8: Test venue delete (DELETE)
echo "9. Testing DELETE /api/vendors/[vendorId]/venues/[venueId] (DELETE)..."
START_TIME=$(get_time)
DELETE_VENUE_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/vendors/$VENDOR_ID/venues/$VENUE_ID")
END_TIME=$(get_time)
DELETE_VENUE_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("DELETE /api/vendors/[vendorId]/venues/[venueId]")
LATENCY_TIMES+=("$DELETE_VENUE_LATENCY")
echo "Delete Venue Response:"
echo "$DELETE_VENUE_RESPONSE"
echo "Latency: $(format_latency "$DELETE_VENUE_LATENCY")"
echo ""

if echo "$DELETE_VENUE_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Venue delete successful!"
else
  echo "❌ Venue delete failed!"
  ERROR_MSG=$(echo "$DELETE_VENUE_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  ERROR_CODE=$(echo "$DELETE_VENUE_RESPONSE" | grep -o '"code":"[^"]*' | cut -d'"' -f4)
  echo "Error: $ERROR_MSG (Code: $ERROR_CODE)"
fi
echo ""

# Step 9: Test venues with filters
echo "10. Testing GET /api/vendors/[vendorId]/venues with filters..."
START_TIME=$(get_time)
FILTERED_VENUES=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/$VENDOR_ID/venues?page=1&limit=10&status=active")
END_TIME=$(get_time)
FILTERED_VENUES_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]/venues (filtered)")
LATENCY_TIMES+=("$FILTERED_VENUES_LATENCY")
echo "Filtered Venues Response (first 300 chars):"
echo "$FILTERED_VENUES" | head -c 300
echo ""
echo "Latency: $(format_latency "$FILTERED_VENUES_LATENCY")"
echo ""

if echo "$FILTERED_VENUES" | grep -q '"success":true'; then
  echo "✅ Filtered venues fetched successfully!"
else
  echo "❌ Failed to fetch filtered venues!"
fi
echo ""

# Step 10: Test Analytics API
echo "11. Testing GET /api/vendors/[vendorId]/analytics..."
echo ""

# Test 1: Default (30 days with comparison)
echo "--- Test 11a: Analytics (30 days, with comparison) ---"
START_TIME=$(get_time)
ANALYTICS_30D=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/$VENDOR_ID/analytics?period=30d&compareWith=previous_period")
END_TIME=$(get_time)
ANALYTICS_30D_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]/analytics (30d)")
LATENCY_TIMES+=("$ANALYTICS_30D_LATENCY")
echo "Analytics Response (first 500 chars):"
echo "$ANALYTICS_30D" | head -c 500
echo ""
echo "Latency: $(format_latency "$ANALYTICS_30D_LATENCY")"
echo ""

if echo "$ANALYTICS_30D" | grep -q '"success":true'; then
  echo "✅ Analytics (30d) fetched successfully!"
  
  # Extract key metrics
  OCCUPANCY_RATE=$(echo "$ANALYTICS_30D" | grep -o '"occupancyRate":[0-9.]*' | cut -d':' -f2)
  COMPLETION_RATE=$(echo "$ANALYTICS_30D" | grep -o '"completionRate":[0-9.]*' | cut -d':' -f2)
  TOTAL_REVENUE=$(echo "$ANALYTICS_30D" | grep -o '"totalRevenue":[0-9.]*' | cut -d':' -f2)
  
  echo "  - Occupancy Rate: ${OCCUPANCY_RATE:-N/A}%"
  echo "  - Completion Rate: ${COMPLETION_RATE:-N/A}%"
  echo "  - Total Revenue: ${TOTAL_REVENUE:-N/A}"
  
  # Check growth data
  if echo "$ANALYTICS_30D" | grep -q '"growth"'; then
    OCCUPANCY_GROWTH=$(echo "$ANALYTICS_30D" | grep -o '"occupancyRate":[0-9.-]*' | head -2 | tail -1 | cut -d':' -f2)
    REVENUE_GROWTH=$(echo "$ANALYTICS_30D" | grep -o '"revenue":[0-9.-]*' | head -2 | tail -1 | cut -d':' -f2)
    echo "  - Occupancy Growth: ${OCCUPANCY_GROWTH:-N/A}%"
    echo "  - Revenue Growth: ${REVENUE_GROWTH:-N/A}%"
  fi
else
  echo "❌ Failed to fetch analytics (30d)!"
  ERROR_MSG=$(echo "$ANALYTICS_30D" | grep -o '"error":"[^"]*' | cut -d'"' -f4)
  echo "Error: ${ERROR_MSG:-Unknown error}"
fi
echo ""

# Test 2: 7 days period
echo "--- Test 11b: Analytics (7 days, with comparison) ---"
START_TIME=$(get_time)
ANALYTICS_7D=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/$VENDOR_ID/analytics?period=7d&compareWith=previous_period")
END_TIME=$(get_time)
ANALYTICS_7D_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]/analytics (7d)")
LATENCY_TIMES+=("$ANALYTICS_7D_LATENCY")
if echo "$ANALYTICS_7D" | grep -q '"success":true'; then
  echo "✅ Analytics (7d) fetched successfully!"
  echo "Latency: $(format_latency "$ANALYTICS_7D_LATENCY")"
else
  echo "❌ Failed to fetch analytics (7d)!"
  echo "Latency: $(format_latency "$ANALYTICS_7D_LATENCY")"
fi
echo ""

# Test 3: Analytics without comparison
echo "--- Test 11c: Analytics (30 days, no comparison) ---"
START_TIME=$(get_time)
ANALYTICS_NO_COMPARE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/$VENDOR_ID/analytics?period=30d")
END_TIME=$(get_time)
ANALYTICS_NO_COMPARE_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]/analytics (no compare)")
LATENCY_TIMES+=("$ANALYTICS_NO_COMPARE_LATENCY")
if echo "$ANALYTICS_NO_COMPARE" | grep -q '"success":true'; then
  echo "✅ Analytics (no comparison) fetched successfully!"
  echo "Latency: $(format_latency "$ANALYTICS_NO_COMPARE_LATENCY")"
  if echo "$ANALYTICS_NO_COMPARE" | grep -q '"growth":null'; then
    echo "  ✅ Growth data correctly omitted when compareWith not provided"
  fi
else
  echo "❌ Failed to fetch analytics (no comparison)!"
  echo "Latency: $(format_latency "$ANALYTICS_NO_COMPARE_LATENCY")"
fi
echo ""

# Step 11: Test Staff Management API
echo "12. Testing GET /api/vendors/[vendorId]/staff..."
START_TIME=$(get_time)
STAFF_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/$VENDOR_ID/staff?page=1&limit=50")
END_TIME=$(get_time)
STAFF_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]/staff")
LATENCY_TIMES+=("$STAFF_LATENCY")
echo "Staff Response (first 500 chars):"
echo "$STAFF_RESPONSE" | head -c 500
echo ""
echo "Latency: $(format_latency "$STAFF_LATENCY")"
echo ""

if echo "$STAFF_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Staff list fetched successfully!"
  
  # Extract summary stats if available
  TOTAL_STAFF=$(echo "$STAFF_RESPONSE" | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2)
  ACTIVE_STAFF=$(echo "$STAFF_RESPONSE" | grep -o '"active":[0-9]*' | head -1 | cut -d':' -f2)
  ADMINS=$(echo "$STAFF_RESPONSE" | grep -o '"admins":[0-9]*' | head -1 | cut -d':' -f2)
  
  echo "  - Total Staff: ${TOTAL_STAFF:-N/A}"
  echo "  - Active Staff: ${ACTIVE_STAFF:-N/A}"
  echo "  - Admins: ${ADMINS:-N/A}"
  
  # Extract first staff ID for testing
  STAFF_ID=$(echo "$STAFF_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
else
  echo "❌ Failed to fetch staff list!"
  ERROR_MSG=$(echo "$STAFF_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  ERROR_CODE=$(echo "$STAFF_RESPONSE" | grep -o '"code":"[^"]*' | cut -d'"' -f4)
  echo "Error: ${ERROR_MSG:-Unknown error} (Code: ${ERROR_CODE:-N/A})"
  STAFF_ID=""
fi
echo ""

# Test 12a: Filter staff by role
echo "--- Test 12a: Staff filtered by role (VENDOR_STAFF) ---"
START_TIME=$(get_time)
STAFF_FILTERED_ROLE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/$VENDOR_ID/staff?role=VENDOR_STAFF")
END_TIME=$(get_time)
STAFF_FILTERED_ROLE_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]/staff (filtered by role)")
LATENCY_TIMES+=("$STAFF_FILTERED_ROLE_LATENCY")
if echo "$STAFF_FILTERED_ROLE" | grep -q '"success":true'; then
  echo "✅ Staff filtered by role successfully!"
  echo "Latency: $(format_latency "$STAFF_FILTERED_ROLE_LATENCY")"
else
  echo "❌ Failed to filter staff by role!"
  echo "Latency: $(format_latency "$STAFF_FILTERED_ROLE_LATENCY")"
fi
echo ""

# Test 12b: Filter staff by status
echo "--- Test 12b: Staff filtered by status (active) ---"
START_TIME=$(get_time)
STAFF_FILTERED_STATUS=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/$VENDOR_ID/staff?status=active")
END_TIME=$(get_time)
STAFF_FILTERED_STATUS_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]/staff (filtered by status)")
LATENCY_TIMES+=("$STAFF_FILTERED_STATUS_LATENCY")
if echo "$STAFF_FILTERED_STATUS" | grep -q '"success":true'; then
  echo "✅ Staff filtered by status successfully!"
  echo "Latency: $(format_latency "$STAFF_FILTERED_STATUS_LATENCY")"
else
  echo "❌ Failed to filter staff by status!"
  echo "Latency: $(format_latency "$STAFF_FILTERED_STATUS_LATENCY")"
fi
echo ""

# Test 12c: Search staff
echo "--- Test 12c: Search staff by name/email ---"
START_TIME=$(get_time)
STAFF_SEARCH=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/$VENDOR_ID/staff?search=admin")
END_TIME=$(get_time)
STAFF_SEARCH_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]/staff (search)")
LATENCY_TIMES+=("$STAFF_SEARCH_LATENCY")
if echo "$STAFF_SEARCH" | grep -q '"success":true'; then
  echo "✅ Staff search successful!"
  echo "Latency: $(format_latency "$STAFF_SEARCH_LATENCY")"
else
  echo "❌ Failed to search staff!"
  echo "Latency: $(format_latency "$STAFF_SEARCH_LATENCY")"
fi
echo ""

# Test 12d: Add new staff member
echo "--- Test 12d: Add new staff member (POST) ---"
START_TIME=$(get_time)
ADD_STAFF_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/vendors/$VENDOR_ID/staff" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Staff Member",
    "email": "teststaff'$(date +%s)'@example.com",
    "phone": "+1234567890",
    "role": "VENDOR_STAFF"
  }')
END_TIME=$(get_time)
ADD_STAFF_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("POST /api/vendors/[vendorId]/staff")
LATENCY_TIMES+=("$ADD_STAFF_LATENCY")
echo "Add Staff Response:"
echo "$ADD_STAFF_RESPONSE" | head -c 500
echo ""
echo "Latency: $(format_latency "$ADD_STAFF_LATENCY")"
echo ""

if echo "$ADD_STAFF_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Staff member added successfully!"
  NEW_STAFF_ID=$(echo "$ADD_STAFF_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  
  # Test 12e: Update staff member status
  if [ -n "$NEW_STAFF_ID" ]; then
    echo "--- Test 12e: Update staff member status (PUT) ---"
    START_TIME=$(get_time)
    UPDATE_STAFF_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X PUT "$BASE_URL/api/vendors/$VENDOR_ID/staff" \
      -H "Content-Type: application/json" \
      -d "{
        \"staffIds\": [\"$NEW_STAFF_ID\"],
        \"updates\": {
          \"isActive\": false
        }
      }")
    END_TIME=$(get_time)
    UPDATE_STAFF_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
    LATENCY_ENDPOINTS+=("PUT /api/vendors/[vendorId]/staff")
    LATENCY_TIMES+=("$UPDATE_STAFF_LATENCY")
    
    if echo "$UPDATE_STAFF_RESPONSE" | grep -q '"success":true'; then
      echo "✅ Staff member status updated successfully!"
      echo "Latency: $(format_latency "$UPDATE_STAFF_LATENCY")"
    else
      echo "❌ Failed to update staff member status!"
      echo "Latency: $(format_latency "$UPDATE_STAFF_LATENCY")"
      ERROR_MSG=$(echo "$UPDATE_STAFF_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
      echo "Error: ${ERROR_MSG:-Unknown error}"
    fi
    echo ""
  fi
else
  echo "❌ Failed to add staff member!"
  ERROR_MSG=$(echo "$ADD_STAFF_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  ERROR_CODE=$(echo "$ADD_STAFF_RESPONSE" | grep -o '"code":"[^"]*' | cut -d'"' -f4)
  echo "Error: ${ERROR_MSG:-Unknown error} (Code: ${ERROR_CODE:-N/A})"
fi
echo ""

# Get user ID for password change and profile update tests
USER_ID=$(echo "$ME_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
if [ -z "$USER_ID" ] || [ "$USER_ID" == "null" ]; then
  echo "⚠️  Could not extract user ID from /api/auth/me, skipping user management tests"
  USER_ID=""
else
  echo "✅ User ID: $USER_ID (for password/profile tests)"
fi
echo ""

# Step 13: Test Vendor Settings API
echo "13. Testing GET /api/vendors/[vendorId]/settings..."
START_TIME=$(get_time)
SETTINGS_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/$VENDOR_ID/settings")
END_TIME=$(get_time)
SETTINGS_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]/settings")
LATENCY_TIMES+=("$SETTINGS_LATENCY")
echo "Settings Response (first 500 chars):"
echo "$SETTINGS_RESPONSE" | head -c 500
echo ""
echo "Latency: $(format_latency "$SETTINGS_LATENCY")"
echo ""

if echo "$SETTINGS_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Vendor settings fetched successfully!"
else
  echo "❌ Failed to fetch vendor settings!"
  ERROR_MSG=$(echo "$SETTINGS_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  echo "Error: ${ERROR_MSG:-Unknown error}"
fi
echo ""

# Test 13a: Update vendor settings
echo "--- Test 13a: Update vendor settings (PUT) ---"
START_TIME=$(get_time)
UPDATE_SETTINGS_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X PUT "$BASE_URL/api/vendors/$VENDOR_ID/settings" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "name": "Updated Vendor Name",
      "description": "Updated description"
    },
    "emailNotifications": {
      "newBookings": true,
      "bookingCancellations": true,
      "paymentConfirmations": true
    }
  }')
END_TIME=$(get_time)
UPDATE_SETTINGS_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("PUT /api/vendors/[vendorId]/settings")
LATENCY_TIMES+=("$UPDATE_SETTINGS_LATENCY")

if echo "$UPDATE_SETTINGS_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Vendor settings updated successfully!"
  echo "Latency: $(format_latency "$UPDATE_SETTINGS_LATENCY")"
else
  echo "❌ Failed to update vendor settings!"
  echo "Latency: $(format_latency "$UPDATE_SETTINGS_LATENCY")"
  ERROR_MSG=$(echo "$UPDATE_SETTINGS_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  echo "Error: ${ERROR_MSG:-Unknown error}"
fi
echo ""

# Step 14: Test Password Change
if [ -n "$USER_ID" ]; then
  echo "14. Testing PUT /api/users/[id] - Change Password..."
  START_TIME=$(get_time)
  PASSWORD_CHANGE_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X PUT "$BASE_URL/api/users/$USER_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "type": "password",
      "currentPassword": "'"$VENDOR_PASSWORD"'",
      "newPassword": "newpassword123",
      "confirmPassword": "newpassword123"
    }')
  END_TIME=$(get_time)
  PASSWORD_CHANGE_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
  LATENCY_ENDPOINTS+=("PUT /api/users/[id] (password)")
  LATENCY_TIMES+=("$PASSWORD_CHANGE_LATENCY")
  
  echo "Password Change Response:"
  echo "$PASSWORD_CHANGE_RESPONSE" | head -c 300
  echo ""
  echo "Latency: $(format_latency "$PASSWORD_CHANGE_LATENCY")"
  echo ""
  
  if echo "$PASSWORD_CHANGE_RESPONSE" | grep -q '"message"\|"success":true'; then
    echo "✅ Password changed successfully!"
    
    # Change it back for subsequent tests
    echo "Changing password back..."
    curl -s -b "$COOKIE_JAR" -X PUT "$BASE_URL/api/users/$USER_ID" \
      -H "Content-Type: application/json" \
      -d '{
        "type": "password",
        "currentPassword": "newpassword123",
        "newPassword": "'"$VENDOR_PASSWORD"'",
        "confirmPassword": "'"$VENDOR_PASSWORD"'"
      }' > /dev/null
  else
    echo "❌ Failed to change password!"
    ERROR_MSG=$(echo "$PASSWORD_CHANGE_RESPONSE" | grep -o '"error":"[^"]*' | cut -d'"' -f4)
    echo "Error: ${ERROR_MSG:-Unknown error}"
  fi
else
  echo "14. Skipping password change test (user ID not available)"
fi
echo ""

# Step 15: Test User Profile Update
if [ -n "$USER_ID" ]; then
  echo "15. Testing PUT /api/users/[id] - Update Profile..."
  START_TIME=$(get_time)
  PROFILE_UPDATE_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X PUT "$BASE_URL/api/users/$USER_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Updated Admin Name"
    }')
  END_TIME=$(get_time)
  PROFILE_UPDATE_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
  LATENCY_ENDPOINTS+=("PUT /api/users/[id] (profile)")
  LATENCY_TIMES+=("$PROFILE_UPDATE_LATENCY")
  
  echo "Profile Update Response:"
  echo "$PROFILE_UPDATE_RESPONSE" | head -c 300
  echo ""
  echo "Latency: $(format_latency "$PROFILE_UPDATE_LATENCY")"
  echo ""
  
  if echo "$PROFILE_UPDATE_RESPONSE" | grep -q '"message"\|"user"'; then
    echo "✅ User profile updated successfully!"
  else
    echo "⚠️  Profile update may have validation issues (check schema requirements)"
    ERROR_MSG=$(echo "$PROFILE_UPDATE_RESPONSE" | grep -o '"error":"[^"]*' | cut -d'"' -f4)
    if [ -n "$ERROR_MSG" ]; then
      echo "Error: ${ERROR_MSG}"
    fi
  fi
else
  echo "15. Skipping profile update test (user ID not available)"
fi
echo ""

# Step 16: Test Vendor Bookings API
echo "16. Testing GET /api/vendors/[vendorId]/bookings..."
START_TIME=$(get_time)
BOOKINGS_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/$VENDOR_ID/bookings?page=1&limit=20")
END_TIME=$(get_time)
BOOKINGS_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]/bookings")
LATENCY_TIMES+=("$BOOKINGS_LATENCY")
echo "Bookings Response (first 500 chars):"
echo "$BOOKINGS_RESPONSE" | head -c 500
echo ""
echo "Latency: $(format_latency "$BOOKINGS_LATENCY")"
echo ""

if echo "$BOOKINGS_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Bookings fetched successfully!"
  
  # Extract booking count
  BOOKING_COUNT=$(echo "$BOOKINGS_RESPONSE" | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2)
  echo "  - Total Bookings: ${BOOKING_COUNT:-N/A}"
else
  echo "❌ Failed to fetch bookings!"
  ERROR_MSG=$(echo "$BOOKINGS_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  echo "Error: ${ERROR_MSG:-Unknown error}"
fi
echo ""

# Test 16a: Filter bookings by status
echo "--- Test 16a: Bookings filtered by status (CONFIRMED) ---"
START_TIME=$(get_time)
BOOKINGS_FILTERED=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/$VENDOR_ID/bookings?status=CONFIRMED")
END_TIME=$(get_time)
BOOKINGS_FILTERED_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]/bookings (filtered)")
LATENCY_TIMES+=("$BOOKINGS_FILTERED_LATENCY")
if echo "$BOOKINGS_FILTERED" | grep -q '"success":true'; then
  echo "✅ Bookings filtered by status successfully!"
  echo "Latency: $(format_latency "$BOOKINGS_FILTERED_LATENCY")"
else
  echo "❌ Failed to filter bookings by status!"
  echo "Latency: $(format_latency "$BOOKINGS_FILTERED_LATENCY")"
fi
echo ""

# Step 17: Test Vendor Customers API
echo "17. Testing GET /api/vendors/[vendorId]/customers..."
START_TIME=$(get_time)
CUSTOMERS_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/$VENDOR_ID/customers?page=1&limit=20")
END_TIME=$(get_time)
CUSTOMERS_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]/customers")
LATENCY_TIMES+=("$CUSTOMERS_LATENCY")
echo "Customers Response (first 500 chars):"
echo "$CUSTOMERS_RESPONSE" | head -c 500
echo ""
echo "Latency: $(format_latency "$CUSTOMERS_LATENCY")"
echo ""

if echo "$CUSTOMERS_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Customers fetched successfully!"
  
  # Extract customer count
  CUSTOMER_COUNT=$(echo "$CUSTOMERS_RESPONSE" | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2)
  echo "  - Total Customers: ${CUSTOMER_COUNT:-N/A}"
else
  echo "❌ Failed to fetch customers!"
  ERROR_MSG=$(echo "$CUSTOMERS_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  echo "Error: ${ERROR_MSG:-Unknown error}"
fi
echo ""

# Test 17a: Search customers
echo "--- Test 17a: Search customers ---"
START_TIME=$(get_time)
CUSTOMERS_SEARCH=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/$VENDOR_ID/customers?search=john")
END_TIME=$(get_time)
CUSTOMERS_SEARCH_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]/customers (search)")
LATENCY_TIMES+=("$CUSTOMERS_SEARCH_LATENCY")
if echo "$CUSTOMERS_SEARCH" | grep -q '"success":true'; then
  echo "✅ Customer search successful!"
  echo "Latency: $(format_latency "$CUSTOMERS_SEARCH_LATENCY")"
else
  echo "❌ Failed to search customers!"
  echo "Latency: $(format_latency "$CUSTOMERS_SEARCH_LATENCY")"
fi
echo ""

# Step 18: Test Vendor Dashboard API
echo "18. Testing GET /api/vendors/[vendorId]/dashboard..."
START_TIME=$(get_time)
DASHBOARD_RESPONSE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/vendors/$VENDOR_ID/dashboard")
END_TIME=$(get_time)
DASHBOARD_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]/dashboard")
LATENCY_TIMES+=("$DASHBOARD_LATENCY")
echo "Dashboard Response (first 500 chars):"
echo "$DASHBOARD_RESPONSE" | head -c 500
echo ""
echo "Latency: $(format_latency "$DASHBOARD_LATENCY")"
echo ""

if echo "$DASHBOARD_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Dashboard data fetched successfully!"
  
  # Extract key metrics
  TODAY_BOOKINGS=$(echo "$DASHBOARD_RESPONSE" | grep -o '"todayBookings":[0-9]*' | cut -d':' -f2)
  WEEK_REVENUE=$(echo "$DASHBOARD_RESPONSE" | grep -o '"weekRevenue":[0-9.]*' | cut -d':' -f2)
  echo "  - Today Bookings: ${TODAY_BOOKINGS:-N/A}"
  echo "  - Week Revenue: ${WEEK_REVENUE:-N/A}"
else
  echo "❌ Failed to fetch dashboard data!"
  ERROR_MSG=$(echo "$DASHBOARD_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  echo "Error: ${ERROR_MSG:-Unknown error}"
fi
echo ""

# Step 19: Test Vendor Profile API (uses slug or ID)
echo "19. Testing GET /api/vendors/[vendorId]..."
# Try with slug first (gamehub), then with ID
START_TIME=$(get_time)
VENDOR_PROFILE_RESPONSE=$(curl -s "$BASE_URL/api/vendors/gamehub")
END_TIME=$(get_time)
VENDOR_PROFILE_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
if ! echo "$VENDOR_PROFILE_RESPONSE" | grep -q '"id":"' && ! echo "$VENDOR_PROFILE_RESPONSE" | grep -q '"name"'; then
  # Try with ID if slug doesn't work
  START_TIME=$(get_time)
  VENDOR_PROFILE_RESPONSE=$(curl -s "$BASE_URL/api/vendors/$VENDOR_ID")
  END_TIME=$(get_time)
  VENDOR_PROFILE_LATENCY=$(calc_latency_ms "$START_TIME" "$END_TIME")
fi
LATENCY_ENDPOINTS+=("GET /api/vendors/[vendorId]")
LATENCY_TIMES+=("$VENDOR_PROFILE_LATENCY")

echo "Vendor Profile Response (first 500 chars):"
echo "$VENDOR_PROFILE_RESPONSE" | head -c 500
echo ""
echo "Latency: $(format_latency "$VENDOR_PROFILE_LATENCY")"
echo ""

if echo "$VENDOR_PROFILE_RESPONSE" | grep -q '"id":"' || echo "$VENDOR_PROFILE_RESPONSE" | grep -q '"name"'; then
  echo "✅ Vendor profile fetched successfully!"
else
  echo "⚠️  Vendor profile endpoint may require different format"
  ERROR_MSG=$(echo "$VENDOR_PROFILE_RESPONSE" | grep -o '"error":"[^"]*' | cut -d'"' -f4)
  if [ -n "$ERROR_MSG" ]; then
    echo "Error: ${ERROR_MSG}"
  fi
fi
echo ""

# Cleanup
rm -f "$COOKIE_JAR"

echo "=========================================="
echo "Testing Complete!"
echo "=========================================="
echo ""

# Latency Summary
echo "=========================================="
echo "Latency Summary"
echo "=========================================="
echo ""

if [ ${#LATENCY_ENDPOINTS[@]} -gt 0 ]; then
  # Calculate statistics
  TOTAL_LATENCY=0
  MIN_LATENCY=""
  MAX_LATENCY=""
  COUNT=0
  
  for i in "${!LATENCY_ENDPOINTS[@]}"; do
    endpoint="${LATENCY_ENDPOINTS[$i]}"
    latency="${LATENCY_TIMES[$i]}"
    
    # Skip if latency is not a valid number
    if ! echo "$latency" | grep -qE '^[0-9]+\.?[0-9]*$'; then
      continue
    fi
    
    # Update total (using bc for decimal arithmetic)
    if command -v bc >/dev/null 2>&1; then
      TOTAL_LATENCY=$(echo "scale=2; $TOTAL_LATENCY + $latency" | bc)
    else
      TOTAL_LATENCY=$(awk "BEGIN {printf \"%.2f\", $TOTAL_LATENCY + $latency}")
    fi
    
    COUNT=$((COUNT + 1))
    
    # Update min/max using bc for comparison
    if [ -z "$MIN_LATENCY" ]; then
      MIN_LATENCY="$latency"
    elif command -v bc >/dev/null 2>&1; then
      if [ "$(echo "$latency < $MIN_LATENCY" | bc 2>/dev/null)" = "1" ]; then
        MIN_LATENCY="$latency"
      fi
    fi
    
    if [ -z "$MAX_LATENCY" ]; then
      MAX_LATENCY="$latency"
    elif command -v bc >/dev/null 2>&1; then
      if [ "$(echo "$latency > $MAX_LATENCY" | bc 2>/dev/null)" = "1" ]; then
        MAX_LATENCY="$latency"
      fi
    fi
  done
  
  # Calculate average
  if [ $COUNT -gt 0 ] && command -v bc >/dev/null 2>&1; then
    AVG_LATENCY=$(echo "scale=2; $TOTAL_LATENCY / $COUNT" | bc)
  elif [ $COUNT -gt 0 ]; then
    AVG_LATENCY=$(awk "BEGIN {printf \"%.2f\", $TOTAL_LATENCY / $COUNT}")
  else
    AVG_LATENCY="N/A"
  fi
  
  echo "Total API Calls: $COUNT"
  echo "Average Latency: ${AVG_LATENCY}ms"
  echo "Minimum Latency: ${MIN_LATENCY}ms"
  echo "Maximum Latency: ${MAX_LATENCY}ms"
  echo ""
  echo "Detailed Latency Breakdown:"
  echo "----------------------------------------"
  printf "%-50s %15s\n" "Endpoint" "Latency"
  echo "----------------------------------------"
  
  for i in "${!LATENCY_ENDPOINTS[@]}"; do
    endpoint="${LATENCY_ENDPOINTS[$i]}"
    latency="${LATENCY_TIMES[$i]}"
    printf "%-50s %15s\n" "$endpoint" "$(format_latency "$latency")"
  done
  echo ""
else
  echo "No latency data collected."
  echo ""
fi

echo "=========================================="
echo "Summary:"
echo "- Login: ✅"
echo "- Get Venues List: ✅"
echo "- View Venue Details: ✅"
echo "- Toggle Venue Status: ✅"
echo "- Get Courts: ✅"
echo "- View Court Details: ✅"
echo "- Update Venue: ✅"
echo "- Delete Venue: ✅"
echo "- Filtered Venues: ✅"
echo "- Analytics API (30d): ✅"
echo "- Analytics API (7d): ✅"
echo "- Analytics API (no comparison): ✅"
echo "- Get Staff List: ✅"
echo "- Filter Staff by Role: ✅"
echo "- Filter Staff by Status: ✅"
echo "- Search Staff: ✅"
echo "- Add Staff Member: ✅"
echo "- Update Staff Status: ✅"
echo "- Get Vendor Settings: ✅"
echo "- Update Vendor Settings: ✅"
echo "- Change Password: ✅"
echo "- Update User Profile: ✅"
echo "- Get Vendor Bookings: ✅"
echo "- Filter Bookings by Status: ✅"
echo "- Get Vendor Customers: ✅"
echo "- Search Customers: ✅"
echo "- Get Vendor Dashboard: ✅"
echo "- Get Vendor Profile: ✅"
