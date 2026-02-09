-- Create application user for project management
CREATE USER IF NOT EXISTS 'pm_user'@'localhost' IDENTIFIED BY 'pm_password123';

-- Grant all privileges on my_app_db database
GRANT ALL PRIVILEGES ON my_app_db.* TO 'pm_user'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Verify user creation
SELECT User, Host FROM mysql.user WHERE User = 'pm_user';
