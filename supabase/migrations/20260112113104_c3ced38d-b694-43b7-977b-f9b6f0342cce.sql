-- Consolidate "Nairobi City" to "Nairobi" in stores table
UPDATE stores 
SET county = 'Nairobi' 
WHERE county = 'Nairobi City';

-- Consolidate "Nairobi City" to "Nairobi" in customers table
UPDATE customers 
SET county = 'Nairobi' 
WHERE county = 'Nairobi City';