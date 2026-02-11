#!/bin/bash

set -e

echo "🌱 Seeding Test Data for Gościniec Rodzinny"
echo "============================================="
echo ""

# Get admin token
echo "🔐 Logging in..."
LOGIN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gosciniecrodzinny.pl","password":"Admin123!@#"}')

TOKEN=$(echo $LOGIN | jq -r '.data.token')

if [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed!"
  exit 1
fi

echo "✅ Logged in as admin"
echo ""

# ============================================
# HALLS (Sale)
# ============================================
echo "🏛️  Creating Halls..."

HALLS=(
  "Sala Kryształowa:150:8000"
  "Sala Taneczna:100:6000"
  "Sala Złota:80:5000"
  "Cały obiekt:300:15000"
  "Strzecha 1:50:3000"
  "Strzecha 2:50:3000"
)

declare -A HALL_IDS

for hall_data in "${HALLS[@]}"; do
  IFS=':' read -r name capacity price <<< "$hall_data"
  
  HALL=$(curl -s -X POST http://localhost:3001/api/halls \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$name\",
      \"capacity\": $capacity,
      \"pricePerPerson\": $price,
      \"description\": \"Piękna sala idealna na różne okazje\",
      \"isActive\": true
    }")
  
  HALL_ID=$(echo $HALL | jq -r '.id')
  HALL_IDS[$name]=$HALL_ID
  echo "  ✅ $name (capacity: $capacity, ID: ${HALL_ID:0:8}...)"
done

echo ""

# ============================================
# EVENT TYPES (Typy wydarzeń)
# ============================================
echo "🎉 Creating Event Types..."

EVENT_TYPES=(
  "Wesele:🎊"
  "Urodziny:🎂"
  "Rocznica/Jubileusz:💍"
  "Komunia:🕊️"
  "Chrzest/Roczek:👶"
  "Stypa:🕯️"
  "Inne:🎈"
)

declare -A EVENT_TYPE_IDS

for event_data in "${EVENT_TYPES[@]}"; do
  IFS=':' read -r name icon <<< "$event_data"
  
  EVENT=$(curl -s -X POST http://localhost:3001/api/event-types \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$name\",
      \"description\": \"Organizacja $name w Gośćcu Rodzinnym\",
      \"isActive\": true
    }")
  
  EVENT_ID=$(echo $EVENT | jq -r '.id')
  EVENT_TYPE_IDS[$name]=$EVENT_ID
  echo "  ✅ $name $icon (ID: ${EVENT_ID:0:8}...)"
done

echo ""

# ============================================
# CLIENTS (Klienci)
# ============================================
echo "👥 Creating Clients..."

CLIENTS=(
  "Jan:Kowalski:jan.kowalski@email.com:+48123456789"
  "Anna:Nowak:anna.nowak@email.com:+48234567890"
  "Piotr:Wiśniewski:piotr.wisniewski@email.com:+48345678901"
  "Maria:Wójcik:maria.wojcik@email.com:+48456789012"
  "Tomasz:Kamiński:tomasz.kaminski@email.com:+48567890123"
  "Katarzyna:Lewandowska:katarzyna.lewandowska@email.com:+48678901234"
  "Michał:Zieliński:michal.zielinski@email.com:+48789012345"
  "Agnieszka:Szymańska:agnieszka.szymanska@email.com:+48890123456"
  "Krzysztof:Woźniak:krzysztof.wozniak@email.com:+48901234567"
  "Magdalena:Dąbrowska:magdalena.dabrowska@email.com:+48012345678"
  "Paweł:Kozłowski:pawel.kozlowski@email.com:+48123450001"
  "Joanna:Jankowska:joanna.jankowska@email.com:+48123450002"
  "Marek:Mazur:marek.mazur@email.com:+48123450003"
  "Ewa:Krawczyk:ewa.krawczyk@email.com:+48123450004"
  "Andrzej:Piotrowski:andrzej.piotrowski@email.com:+48123450005"
)

declare -a CLIENT_IDS

for client_data in "${CLIENTS[@]}"; do
  IFS=':' read -r firstName lastName email phone <<< "$client_data"
  
  CLIENT=$(curl -s -X POST http://localhost:3001/api/clients \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"firstName\": \"$firstName\",
      \"lastName\": \"$lastName\",
      \"email\": \"$email\",
      \"phone\": \"$phone\",
      \"notes\": \"Klient testowy\"
    }")
  
  CLIENT_ID=$(echo $CLIENT | jq -r '.id')
  CLIENT_IDS+=($CLIENT_ID)
  echo "  ✅ $firstName $lastName ($email)"
done

echo ""

# ============================================
# RESERVATIONS (Rezerwacje)
# ============================================
echo "📅 Creating Reservations..."

# Helper function to get random element from array
get_random() {
  local arr=("$@")
  echo "${arr[RANDOM % ${#arr[@]}]}"
}

# Convert associative arrays to indexed arrays for random selection
HALL_ID_ARRAY=("${HALL_IDS[@]}")
EVENT_TYPE_ID_ARRAY=("${EVENT_TYPE_IDS[@]}")

RESERVATION_COUNT=0
declare -a RESERVATION_IDS

# Create 20 reservations with various dates
for i in {1..20}; do
  # Random date in next 180 days
  DAYS_OFFSET=$((RANDOM % 180 + 1))
  RES_DATE=$(date -d "+$DAYS_OFFSET days" +%Y-%m-%d)
  
  # Random client
  CLIENT_ID=${CLIENT_IDS[$((RANDOM % ${#CLIENT_IDS[@]}))]}
  
  # Random hall
  HALL_ID=${HALL_ID_ARRAY[$((RANDOM % ${#HALL_ID_ARRAY[@]}))]}
  
  # Random event type
  EVENT_TYPE_ID=${EVENT_TYPE_ID_ARRAY[$((RANDOM % ${#EVENT_TYPE_ID_ARRAY[@]}))]}
  
  # Random guest count (30-150)
  GUESTS=$((RANDOM % 121 + 30))
  
  # Random price (3000-12000)
  PRICE=$((RANDOM % 9001 + 3000))
  
  RESERVATION=$(curl -s -X POST http://localhost:3001/api/reservations \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"clientId\": \"$CLIENT_ID\",
      \"hallId\": \"$HALL_ID\",
      \"eventTypeId\": \"$EVENT_TYPE_ID\",
      \"date\": \"$RES_DATE\",
      \"guestCount\": $GUESTS,
      \"totalPrice\": $PRICE,
      \"status\": \"CONFIRMED\",
      \"notes\": \"Testowa rezerwacja #$i\"
    }")
  
  RES_ID=$(echo $RESERVATION | jq -r '.id')
  
  if [ "$RES_ID" != "null" ]; then
    RESERVATION_IDS+=($RES_ID)
    RESERVATION_COUNT=$((RESERVATION_COUNT + 1))
    echo "  ✅ Reservation #$i: $RES_DATE, $GUESTS guests, ${PRICE} PLN"
  fi
done

echo ""

# ============================================
# DEPOSITS (Zaliczki)
# ============================================
echo "💰 Creating Deposits..."

DEPOSIT_COUNT=0

for RES_ID in "${RESERVATION_IDS[@]}"; do
  # Get reservation details
  RES=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "http://localhost:3001/api/reservations/$RES_ID")
  
  TOTAL_PRICE=$(echo $RES | jq -r '.totalPrice')
  RES_DATE=$(echo $RES | jq -r '.date')
  
  # Calculate deposit (30% of total)
  DEPOSIT_AMOUNT=$(echo "$TOTAL_PRICE * 0.3" | bc | cut -d'.' -f1)
  
  # Due date: 30 days before event
  DUE_DATE=$(date -d "$RES_DATE -30 days" +%Y-%m-%d)
  
  # Create deposit
  DEPOSIT=$(curl -s -X POST http://localhost:3001/api/deposits \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"reservationId\": \"$RES_ID\",
      \"amount\": $DEPOSIT_AMOUNT,
      \"dueDate\": \"$DUE_DATE\",
      \"title\": \"Zaliczka 30%\",
      \"description\": \"Pierwsza zaliczka na rezerwację\"
    }")
  
  DEPOSIT_ID=$(echo $DEPOSIT | jq -r '.id')
  
  if [ "$DEPOSIT_ID" != "null" ]; then
    DEPOSIT_COUNT=$((DEPOSIT_COUNT + 1))
    
    # Randomly pay some deposits
    RANDOM_ACTION=$((RANDOM % 10))
    
    if [ $RANDOM_ACTION -lt 3 ]; then
      # 30% - fully paid
      curl -s -X PUT "http://localhost:3001/api/deposits/$DEPOSIT_ID/mark-paid" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"paymentMethod\": \"TRANSFER\"
        }" > /dev/null
      echo "  ✅ Deposit ${DEPOSIT_AMOUNT} PLN - PAID ✓"
    elif [ $RANDOM_ACTION -lt 5 ]; then
      # 20% - partial payment
      PARTIAL=$((DEPOSIT_AMOUNT / 2))
      curl -s -X POST "http://localhost:3001/api/deposits/$DEPOSIT_ID/payments" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"amount\": $PARTIAL,
          \"paymentMethod\": \"CASH\"
        }" > /dev/null
      echo "  ✅ Deposit ${DEPOSIT_AMOUNT} PLN - PARTIAL (${PARTIAL} PLN paid)"
    else
      # 50% - pending
      echo "  ✅ Deposit ${DEPOSIT_AMOUNT} PLN - PENDING"
    fi
  fi
done

echo ""

# ============================================
# SUMMARY
# ============================================
echo "═══════════════════════════════════════════"
echo "✅ TEST DATA SEEDED SUCCESSFULLY!"
echo "═══════════════════════════════════════════"
echo ""
echo "📊 Summary:"
echo "  • Halls: ${#HALL_IDS[@]}"
echo "  • Event Types: ${#EVENT_TYPE_IDS[@]}"
echo "  • Clients: ${#CLIENT_IDS[@]}"
echo "  • Reservations: $RESERVATION_COUNT"
echo "  • Deposits: $DEPOSIT_COUNT"
echo ""
echo "🎉 Ready to test!"
echo ""
