-- Fix salary_adjustments table to ensure monthly_salary_id is truly nullable without default
ALTER TABLE salary_adjustments 
ALTER COLUMN monthly_salary_id DROP DEFAULT;

-- Same for absence_deductions
ALTER TABLE absence_deductions 
ALTER COLUMN monthly_salary_id DROP DEFAULT;

-- Same for latency_deductions  
ALTER TABLE latency_deductions 
ALTER COLUMN monthly_salary_id DROP DEFAULT;
