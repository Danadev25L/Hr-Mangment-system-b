-- Add departmentId to expenses table
ALTER TABLE expenses ADD COLUMN department_id INTEGER;

-- Add foreign key constraint
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_department 
  FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_expenses_department_id ON expenses(department_id);

-- Create comments for documentation
COMMENT ON COLUMN expenses.department_id IS 'Department ID for department-specific expenses. NULL means company-wide expense.';
