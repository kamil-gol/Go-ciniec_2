#!/bin/bash
# ===========================================================
# ETAP 1: hall.service.branches.test.ts
# 4x 'not found' → 'Nie znaleziono sali'
# ===========================================================

FILE_HALL="src/tests/unit/services/hall.service.branches.test.ts"

echo "=== ETAP 1: $FILE_HALL ==="
echo "PRZED:"
grep -n "toThrow('not found')" "$FILE_HALL" || echo "(brak dopasowań — może już naprawione)"

sed -i "s/toThrow('not found')/toThrow('Nie znaleziono sali')/g" "$FILE_HALL"

echo ""
echo "PO:"
grep -n "toThrow('Nie znaleziono sali')" "$FILE_HALL"
echo ""
echo "✅ Etap 1 done — hall.service.branches.test.ts"

# ===========================================================
# ETAP 2: deposit regexy — polskie znaki
# deposit.service.crud.test.ts + deposit.service.business.test.ts
# ===========================================================

FILE_CRUD="src/tests/unit/services/deposit.service.crud.test.ts"
FILE_BIZ="src/tests/unit/services/deposit.service.business.test.ts"

echo ""
echo "=== ETAP 2a: $FILE_CRUD ==="
echo "PRZED:"
grep -n "wieksza od 0\|/oplaconej/" "$FILE_CRUD" || echo "(brak)"

# /wieksza od 0/ → /większa od 0/
sed -i 's|/wieksza od 0/|/większa od 0/|g' "$FILE_CRUD"

# /oplaconej/ → /opłaconej/
sed -i 's|/oplaconej/|/opłaconej/|g' "$FILE_CRUD"

echo "PO:"
grep -n "większa od 0\|opłaconej" "$FILE_CRUD"
echo "✅ Etap 2a done — deposit.service.crud.test.ts"

echo ""
echo "=== ETAP 2b: $FILE_BIZ ==="
echo "PRZED:"
grep -n "juz oznaczona\|oplaconej\|platnosc" "$FILE_BIZ" || echo "(brak)"

# /juz oznaczona/ → /już oznaczona/
sed -i 's|/juz oznaczona/|/już oznaczona/|g' "$FILE_BIZ"

# /oplaconej|platnosc/ → /opłaconej|płatno/
sed -i 's|oplaconej|platnosc|opłaconej|płatno|g' "$FILE_BIZ"

echo "PO:"
grep -n "już oznaczona\|opłaconej\|płatno" "$FILE_BIZ"
echo "✅ Etap 2b done — deposit.service.business.test.ts"

echo ""
echo "========================================"
echo "🎉 Etapy 1+2 zakończone!"
echo "Weryfikacja:"
echo "  npx jest src/tests/unit/services/hall.service.branches.test.ts src/tests/unit/services/deposit.service.crud.test.ts src/tests/unit/services/deposit.service.business.test.ts --no-coverage"
echo "========================================"
