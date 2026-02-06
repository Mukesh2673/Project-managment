#!/bin/bash

echo "Setting up MySQL database and user for Project Management..."
echo ""

# Option 1: Create dedicated user (recommended)
echo "Creating MySQL user 'pm_user'..."
sudo mysql << EOF
-- Drop user if exists and recreate
DROP USER IF EXISTS 'pm_user'@'localhost';

-- Create user with native password authentication (better compatibility)
CREATE USER 'pm_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'pm_password123';

-- Grant privileges
GRANT ALL PRIVILEGES ON my_app_db.* TO 'pm_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Verify
SELECT 'User pm_user created successfully' AS status;
SELECT User, Host, plugin FROM mysql.user WHERE User = 'pm_user';
EOF

echo ""
echo "Testing connection..."
mysql -u pm_user -ppm_password123 -e "USE my_app_db; SELECT 'Connection successful!' AS status;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ Database setup completed successfully!"
else
    echo "✗ Connection test failed. Please check the error above."
fi
