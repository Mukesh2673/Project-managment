-- Manual MySQL setup script
-- Run this with: sudo mysql < setup_database_manual.sql
-- Or copy and paste into: sudo mysql

-- Drop user if exists and recreate
DROP USER IF EXISTS 'pm_user'@'localhost';

-- Create user with native password authentication (better compatibility)
CREATE USER 'pm_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'pm_password123';

-- Grant privileges on my_app_db database
GRANT ALL PRIVILEGES ON my_app_db.* TO 'pm_user'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Verify user creation
SELECT 'User pm_user created successfully' AS status;
SELECT User, Host, plugin FROM mysql.user WHERE User = 'pm_user';

-- Show grants
SHOW GRANTS FOR 'pm_user'@'localhost';
