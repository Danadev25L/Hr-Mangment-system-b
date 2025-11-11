-- Add department_id to expenses table to support department-specific and company-wide expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS department_id INTEGER;

-- Add foreign key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_expenses_department'
    ) THEN
        ALTER TABLE expenses ADD CONSTRAINT fk_expenses_department 
        FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_department_id ON expenses(department_id);

-- Create comments for documentation
COMMENT ON COLUMN expenses.department_id IS 'Department ID for department-specific expenses. NULL means company-wide expense.';
