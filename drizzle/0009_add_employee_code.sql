-- Add employee_code column to users table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='employee_code'
    ) THEN
        ALTER TABLE users ADD COLUMN employee_code VARCHAR(50);
        
        -- Generate employee codes for existing users based on their role
        UPDATE users 
        SET employee_code = CASE 
            WHEN role = 'ROLE_ADMIN' THEN 'ADM-' || LPAD(id::text, 4, '0')
            WHEN role = 'ROLE_MANAGER' THEN 'MGR-' || LPAD(id::text, 4, '0')
            ELSE 'EMP-' || LPAD(id::text, 4, '0')
        END
        WHERE employee_code IS NULL;
        
        -- Make employee_code NOT NULL and UNIQUE after populating existing records
        ALTER TABLE users ALTER COLUMN employee_code SET NOT NULL;
        ALTER TABLE users ADD CONSTRAINT users_employee_code_unique UNIQUE (employee_code);
    END IF;
END $$;
