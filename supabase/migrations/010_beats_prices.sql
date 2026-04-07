-- Add more pricing columns to beats table
ALTER TABLE beats 
ADD COLUMN price_basic numeric(10,2) DEFAULT 0,
ADD COLUMN price_premium numeric(10,2) DEFAULT 0,
ADD COLUMN price_exclusive numeric(10,2) DEFAULT 0;

-- Optionally, migrate existing price to price_basic
-- UPDATE beats SET price_basic = price;
