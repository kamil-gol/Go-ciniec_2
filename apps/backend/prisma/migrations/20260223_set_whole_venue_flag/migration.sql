-- Data migration: Set isWholeVenue flag for existing "Cały obiekt" hall
-- #137: Without this flag, venue surcharge calculation is skipped
--
-- The schema column was added with DEFAULT false, so existing rows
-- need an explicit UPDATE to enable the surcharge logic.

UPDATE "Hall"
SET    "isWholeVenue" = true,
       "updatedAt"    = NOW()
WHERE  LOWER("name") LIKE '%ca%y obiekt%'
  AND  "isWholeVenue" = false;
