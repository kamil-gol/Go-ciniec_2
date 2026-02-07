-- Dodaj nowe typy wydarzeń
INSERT INTO "EventType" (id, name, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'Roczek', NOW(), NOW()),
  (gen_random_uuid(), 'Stypa', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Zmień nazwę z "Rocznica" na "Rocznica/Jubileusz"
UPDATE "EventType" 
SET name = 'Rocznica/Jubileusz', "updatedAt" = NOW() 
WHERE name = 'Rocznica';

-- Wyświetl wszystkie typy wydarzeń posortowane alfabetycznie
SELECT id, name, "createdAt", "updatedAt" 
FROM "EventType" 
ORDER BY name ASC;
