-- Alter the "amount" column in the "expenses" table to support larger numbers and decimal values.
ALTER TABLE expenses ALTER COLUMN amount TYPE numeric(12, 2);
