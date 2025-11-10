-- Make department_id nullable in expenses table to allow company-wide expenses
ALTER TABLE expenses ALTER COLUMN department_id DROP NOT NULL;
