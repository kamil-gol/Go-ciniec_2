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

USER_ID=$(echo $LOGIN | jq -r '.data.user.id')

echo "✅ Logged in as admin (User ID: ${USER_ID:0:8}...)"
echo ""

# ============================================
# HALLS (Sale)
# ============================================
echo "🏛️  Creating Halls..."

HALLS=(
  "Sala Kryształowa:150:180:120:80"
  "Sala Taneczna:100:160:100:70"
  "Sala Złota:80:150:90:60"
  "Cały obiekt:300:200:150:100"
  "Strzecha 1:50:140:80:50"
  "Strzecha 2:50:140:80:50"
)

declare -A HALL_IDS

for hall_data in "${HALLS[@]}"; do
  IFS=':' read -r name capacity priceAdult priceChild priceToddler <<< "$hall_data"
  
  HALL=$(curl -s -X POST http://localhost:3001/api/halls \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$name\",
      \"capacity\": $capacity,
      \"pricePerPerson\": $priceAdult,
      \"pricePerChild\": $priceChild,
      \"pricePerToddler\": $priceToddler,
      \"description\": \"Piękna sala idealna na różne okazje\",
      \"isActive\": true
    }")
  
  HALL_ID=$(echo $HALL | jq -r '.data.id')
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
  
  EVENT_ID=$(echo $EVENT | jq -r '.data.id')
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
  "Barbara:Górska:barbara.gorska@email.com:+48123450006"
  "Robert:Sikora:robert.sikora@email.com:+48123450007"
  "Elżbieta:Baran:elzbieta.baran@email.com:+48123450008"
  "Rafał:Szewczyk:rafal.szewczyk@email.com:+48123450009"
  "Aleksandra:Rutkowska:aleksandra.rutkowska@email.com:+48123450010"
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
  
  CLIENT_ID=$(echo $CLIENT | jq -r '.data.id')
  CLIENT_IDS+=($CLIENT_ID)
  echo "  ✅ $firstName $lastName ($email)"
done

echo ""

# ============================================
# DISH CATEGORIES
# ============================================
echo "🍽️  Creating Dish Categories..."

CATEGORIES=(
  "cold-appetizers:Przystawki zimne:🥗:1"
  "hot-appetizers:Przystawki gorące:🍖:2"
  "soups:Zupy:🍲:3"
  "main-courses:Dania główne:🍖:4"
  "side-dishes:Dodatki:🥔:5"
  "salads:Sałatki:🥗:6"
  "desserts:Desery:🍰:7"
  "beverages:Napoje:🥤:8"
)

declare -A CATEGORY_IDS

for cat_data in "${CATEGORIES[@]}"; do
  IFS=':' read -r slug name icon order <<< "$cat_data"
  
  CAT=$(curl -s -X POST http://localhost:3001/api/menu/dish-categories \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"slug\": \"$slug\",
      \"name\": \"$name\",
      \"icon\": \"$icon\",
      \"displayOrder\": $order,
      \"isActive\": true
    }")
  
  CAT_ID=$(echo $CAT | jq -r '.data.id')
  CATEGORY_IDS[$slug]=$CAT_ID
  echo "  ✅ $name $icon"
done

echo ""

# ============================================
# DISHES
# ============================================
echo "🍴 Creating Dishes..."

# Cold Appetizers
COLD_APP_ID=${CATEGORY_IDS["cold-appetizers"]}
for dish in "Tatar wołowy" "Carpaccio" "Rolada z łososia" "Pasztet węgierski" "Szaszlyk z kurczaka"; do
  curl -s -X POST http://localhost:3001/api/menu/dishes \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"categoryId\":\"$COLD_APP_ID\",\"name\":\"$dish\",\"isActive\":true}" > /dev/null
  echo "  ✅ $dish"
done

# Hot Appetizers  
HOT_APP_ID=${CATEGORY_IDS["hot-appetizers"]}
for dish in "Krewetki w czośnku" "Krokiety" "Mięso po indyjsku" "Sajgonki" "Krewetki panierowane"; do
  curl -s -X POST http://localhost:3001/api/menu/dishes \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"categoryId\":\"$HOT_APP_ID\",\"name\":\"$dish\",\"isActive\":true}" > /dev/null
  echo "  ✅ $dish"
done

# Soups
SOUPS_ID=${CATEGORY_IDS["soups"]}
for dish in "Rosol z makaronem" "Krem z pieczarek" "Barszcz czerwony" "Żurek staropolski" "Krem z dyni"; do
  curl -s -X POST http://localhost:3001/api/menu/dishes \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"categoryId\":\"$SOUPS_ID\",\"name\":\"$dish\",\"isActive\":true}" > /dev/null
  echo "  ✅ $dish"
done

# Main Courses
MAIN_ID=${CATEGORY_IDS["main-courses"]}
for dish in "Polędwica wołowa" "Filet z kurczaka" "Pierś kaczki" "Łosoś pieczony" "Stek wieprzowy" "Filet ze szczupaka"; do
  curl -s -X POST http://localhost:3001/api/menu/dishes \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"categoryId\":\"$MAIN_ID\",\"name\":\"$dish\",\"isActive\":true}" > /dev/null
  echo "  ✅ $dish"
done

# Desserts
DESSERT_ID=${CATEGORY_IDS["desserts"]}
for dish in "Sernik nowojorski" "Tiramisu" "Lawa czekoladowa" "Panna cotta" "Tort orzechowy"; do
  curl -s -X POST http://localhost:3001/api/menu/dishes \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"categoryId\":\"$DESSERT_ID\",\"name\":\"$dish\",\"isActive\":true}" > /dev/null
  echo "  ✅ $dish"
done

echo ""

# ============================================
# MENU TEMPLATES & PACKAGES
# ============================================
echo "📝 Creating Menu Templates & Packages..."

for event_name in "Wesele" "Urodziny" "Komunia"; do
  EVENT_ID=${EVENT_TYPE_IDS[$event_name]}
  
  if [ "$EVENT_ID" != "" ]; then
    TEMPLATE=$(curl -s -X POST http://localhost:3001/api/menu/templates \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"eventTypeId\": \"$EVENT_ID\",
        \"name\": \"Menu $event_name 2026\",
        \"description\": \"Kompleksowe menu na $event_name\",
        \"isActive\": true
      }")
    
    TEMPLATE_ID=$(echo $TEMPLATE | jq -r '.data.id')
    echo "  ✅ Menu Template: $event_name"
    
    # Create 3 packages per template
    PACKAGES=(
      "Standard:120:80:40:Podstawowy pakiet"
      "Premium:160:110:60:Rozszerzony pakiet z dodatkami"
      "VIP:220:150:80:Pełna obsługa premium"
    )
    
    for pkg_data in "${PACKAGES[@]}"; do
      IFS=':' read -r name priceAdult priceChild priceToddler desc <<< "$pkg_data"
      
      curl -s -X POST http://localhost:3001/api/menu/packages \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"menuTemplateId\": \"$TEMPLATE_ID\",
          \"name\": \"Pakiet $name\",
          \"description\": \"$desc\",
          \"pricePerAdult\": $priceAdult,
          \"pricePerChild\": $priceChild,
          \"pricePerToddler\": $priceToddler,
          \"isActive\": true
        }" > /dev/null
      echo "    • Pakiet $name"
    done
  fi
done

echo ""

# ============================================
# MENU OPTIONS
# ============================================
echo "🍸 Creating Menu Options..."

OPTIONS=(
  "Tort weselny:PER_PERSON:15:desserts"
  "Candy Bar:PER_EVENT:500:desserts"
  "Fontanna czekoladowa:PER_EVENT:400:desserts"
  "Bar alkoholowy:PER_PERSON:30:beverages"
  "Wino stołowe:PER_PERSON:20:beverages"
  "Drinki bezalkoholowe:PER_PERSON:10:beverages"
  "Kawa i herbata:PER_PERSON:5:beverages"
  "DJ + oświetlenie:PER_EVENT:1500:entertainment"
  "Zespół na żywo:PER_EVENT:3000:entertainment"
  "Dekoracje premium:PER_EVENT:800:decorations"
  "Bukiety kwiatowe:PER_EVENT:300:decorations"
)

for opt_data in "${OPTIONS[@]}"; do
  IFS=':' read -r name priceType price category <<< "$opt_data"
  
  curl -s -X POST http://localhost:3001/api/menu/options \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$name\",
      \"category\": \"$category\",
      \"priceType\": \"$priceType\",
      \"priceAmount\": $price,
      \"isActive\": true
    }" > /dev/null
  echo "  ✅ $name ($price zł)"
done

echo ""

# ============================================
# CONFIRMED RESERVATIONS
# ============================================
echo "📅 Creating Confirmed Reservations..."

HALL_ID_ARRAY=("${HALL_IDS[@]}")
EVENT_TYPE_ID_ARRAY=("${EVENT_TYPE_IDS[@]}")

RESERVATION_COUNT=0
declare -a RESERVATION_IDS

for i in {1..15}; do
  DAYS_OFFSET=$((RANDOM % 180 + 1))
  RES_DATE=$(date -d "+$DAYS_OFFSET days" +%Y-%m-%d)
  
  CLIENT_ID=${CLIENT_IDS[$((RANDOM % ${#CLIENT_IDS[@]}))]}
  HALL_ID=${HALL_ID_ARRAY[$((RANDOM % ${#HALL_ID_ARRAY[@]}))]}
  EVENT_TYPE_ID=${EVENT_TYPE_ID_ARRAY[$((RANDOM % ${#EVENT_TYPE_ID_ARRAY[@]}))]}
  
  ADULTS=$((RANDOM % 91 + 30))
  CHILDREN=$((RANDOM % 21))
  TODDLERS=$((RANDOM % 6))
  
  PRICE=$((RANDOM % 9001 + 3000))
  
  # Add time fields - use 23:59 instead of 02:00 to pass validation
  START_TIME="15:00"
  END_TIME="23:59"
  
  RESERVATION=$(curl -s -X POST http://localhost:3001/api/reservations \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"clientId\": \"$CLIENT_ID\",
      \"createdById\": \"$USER_ID\",
      \"hallId\": \"$HALL_ID\",
      \"eventTypeId\": \"$EVENT_TYPE_ID\",
      \"date\": \"$RES_DATE\",
      \"startTime\": \"$START_TIME\",
      \"endTime\": \"$END_TIME\",
      \"adults\": $ADULTS,
      \"children\": $CHILDREN,
      \"toddlers\": $TODDLERS,
      \"totalPrice\": $PRICE,
      \"status\": \"CONFIRMED\",
      \"notes\": \"Potwierdzona rezerwacja #$i\"
    }")
  
  RES_ID=$(echo $RESERVATION | jq -r '.data.id')
  
  if [ "$RES_ID" != "null" ] && [ "$RES_ID" != "" ]; then
    RESERVATION_IDS+=($RES_ID)
    RESERVATION_COUNT=$((RESERVATION_COUNT + 1))
    echo "  ✅ Reservation #$i: $RES_DATE $START_TIME-$END_TIME, ${ADULTS}A+${CHILDREN}C+${TODDLERS}T, ${PRICE} PLN"
  fi
done

echo ""

# ============================================
# QUEUE RESERVATIONS (bez potwierdzonej daty)
# ============================================
echo "⏳ Creating Queue Reservations..."

QUEUE_COUNT=0

for i in {1..10}; do
  CLIENT_ID=${CLIENT_IDS[$((RANDOM % ${#CLIENT_IDS[@]}))]}
  EVENT_TYPE_ID=${EVENT_TYPE_ID_ARRAY[$((RANDOM % ${#EVENT_TYPE_ID_ARRAY[@]}))]}
  
  ADULTS=$((RANDOM % 71 + 20))
  CHILDREN=$((RANDOM % 16))
  TODDLERS=$((RANDOM % 6))
  
  PRICE=$((RANDOM % 6001 + 2000))
  
  QUEUE_DATE=$(date -d "+$((RANDOM % 365 + 30)) days" +%Y-%m-%d)
  
  QUEUE_RES=$(curl -s -X POST http://localhost:3001/api/reservations \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"clientId\": \"$CLIENT_ID\",
      \"createdById\": \"$USER_ID\",
      \"eventTypeId\": \"$EVENT_TYPE_ID\",
      \"reservationQueueDate\": \"$QUEUE_DATE\",
      \"reservationQueuePosition\": $i,
      \"adults\": $ADULTS,
      \"children\": $CHILDREN,
      \"toddlers\": $TODDLERS,
      \"totalPrice\": $PRICE,
      \"status\": \"RESERVED\",
      \"notes\": \"W kolejce - oczekuje na potwierdzenie daty\"
    }")
  
  QUEUE_ID=$(echo $QUEUE_RES | jq -r '.data.id')
  
  if [ "$QUEUE_ID" != "null" ] && [ "$QUEUE_ID" != "" ]; then
    QUEUE_COUNT=$((QUEUE_COUNT + 1))
    echo "  ✅ Queue #$i: pozycja $i, preferred: $QUEUE_DATE, ${ADULTS}A+${CHILDREN}C+${TODDLERS}T"
  fi
done

echo ""

# ============================================
# DEPOSITS (Zaliczki)
# ============================================
echo "💰 Creating Deposits..."

DEPOSIT_COUNT=0

for RES_ID in "${RESERVATION_IDS[@]}"; do
  RES=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "http://localhost:3001/api/reservations/$RES_ID")
  
  TOTAL_PRICE=$(echo $RES | jq -r '.data.totalPrice')
  RES_DATE=$(echo $RES | jq -r '.data.date')
  
  if [ "$RES_DATE" = "null" ] || [ -z "$RES_DATE" ]; then
    continue
  fi
  
  DEPOSIT_AMOUNT=$(echo "$TOTAL_PRICE * 0.3" | bc | cut -d'.' -f1)
  DUE_DATE=$(date -d "$RES_DATE -30 days" +%Y-%m-%d 2>/dev/null || echo "2026-05-01")
  
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
  
  if [ "$DEPOSIT_ID" != "null" ] && [ "$DEPOSIT_ID" != "" ]; then
    DEPOSIT_COUNT=$((DEPOSIT_COUNT + 1))
    
    RANDOM_ACTION=$((RANDOM % 10))
    
    if [ $RANDOM_ACTION -lt 3 ]; then
      curl -s -X POST "http://localhost:3001/api/deposits/$DEPOSIT_ID/payments" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"amount\": $DEPOSIT_AMOUNT,
          \"paymentMethod\": \"TRANSFER\"
        }" > /dev/null
      echo "  ✅ Deposit ${DEPOSIT_AMOUNT} PLN - PAID ✓"
    elif [ $RANDOM_ACTION -lt 5 ]; then
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
echo "  • Dish Categories: ${#CATEGORY_IDS[@]}"
echo "  • Dishes: ~35"
echo "  • Menu Templates: 3"
echo "  • Menu Packages: 9"
echo "  • Menu Options: 11"
echo "  • Confirmed Reservations: $RESERVATION_COUNT"
echo "  • Queue Reservations: $QUEUE_COUNT"
echo "  • Deposits: $DEPOSIT_COUNT"
echo ""
echo "🎉 Ready to test all modules!"
echo ""
