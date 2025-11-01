-- Add approval/rejection tracking fields to expenses table
ALTER TABLE expenses
ADD COLUMN approved_by INTEGER REFERENCES users(id),
ADD COLUMN approved_at TIMESTAMP,
ADD COLUMN rejected_by INTEGER REFERENCES users(id),
ADD COLUMN rejected_at TIMESTAMP,
ADD COLUMN paid_at TIMESTAMP,
ADD COLUMN paid_by INTEGER REFERENCES users(id),
ADD COLUMN item_name VARCHAR(255);

-- Add comment for clarity
COMMENT ON COLUMN expenses.approved_by IS 'User ID who approved the expense';
COMMENT ON COLUMN expenses.approved_at IS 'Timestamp when expense was approved';
COMMENT ON COLUMN expenses.rejected_by IS 'User ID who rejected the expense';
COMMENT ON COLUMN expenses.rejected_at IS 'Timestamp when expense was rejected';
COMMENT ON COLUMN expenses.paid_at IS 'Timestamp when expense was marked as paid';
COMMENT ON COLUMN expenses.paid_by IS 'User ID who marked expense as paid';
COMMENT ON COLUMN expenses.item_name IS 'Name/title of the expense item';
