-- Preserva a ordem e os valores existentes do enum.
ALTER TABLE users
    MODIFY COLUMN role ENUM('ADMIN', 'EMPLOYEE', 'PLATFORM_ADMIN') NOT NULL DEFAULT 'EMPLOYEE';
