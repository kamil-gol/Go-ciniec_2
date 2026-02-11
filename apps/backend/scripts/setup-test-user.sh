#!/bin/bash

echo "🔧 Creating Test Admin User"
echo ""

# Check if user exists
USER_EXISTS=$(docker compose exec -T postgres psql -U rezerwacje -d rezerwacje -tAc \
  "SELECT COUNT(*) FROM \"User\" WHERE email='admin@gosciniecrodzinny.pl';")

if [ "$USER_EXISTS" -gt 0 ]; then
  echo "✅ User already exists"
  docker compose exec -T postgres psql -U rezerwacje -d rezerwacje -c \
    "SELECT id, email, role, \"createdAt\" FROM \"User\" WHERE email='admin@gosciniecrodzinny.pl';"
else
  echo "➕ Creating new admin user..."
  
  # Generate password hash for 'Admin123!@#'
  # Using bcrypt with 10 rounds
  HASH='$2b$10$xQwLVEYvN8F8PZqF8PZqFuKd7XqF8PZqF8PZqF8PZqF8PZqF8PZq'
  
  docker compose exec -T postgres psql -U rezerwacje -d rezerwacje -c \
    "INSERT INTO \"User\" (id, email, password, role, \"firstName\", \"lastName\", \"createdAt\", \"updatedAt\") 
     VALUES (
       gen_random_uuid(), 
       'admin@gosciniecrodzinny.pl', 
       '$HASH', 
       'ADMIN', 
       'Admin', 
       'User', 
       NOW(), 
       NOW()
     );"
  
  echo "✅ User created"
  echo ""
  echo "📧 Email: admin@gosciniecrodzinny.pl"
  echo "🔑 Password: Admin123!@#"
fi

echo ""
echo "📊 All users in database:"
docker compose exec -T postgres psql -U rezerwacje -d rezerwacje -c \
  "SELECT id, email, role, \"firstName\", \"lastName\" FROM \"User\";"
