-- Project Management Tool Database Schema
-- MySQL Database Setup Script

-- Create database (uncomment if you need to create the database)
-- CREATE DATABASE IF NOT EXISTS project_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE project_management;

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('todo', 'in-progress', 'review', 'done') NOT NULL DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  assignee VARCHAR(255) DEFAULT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data (optional - uncomment to insert sample tickets)
-- INSERT INTO tickets (id, title, description, status, priority, assignee, createdAt, updatedAt) VALUES
-- ('1', 'Setup Database', 'Configure MySQL database for the project', 'in-progress', 'high', 'John Doe', NOW(), NOW()),
-- ('2', 'Design UI', 'Create user interface mockups', 'todo', 'medium', 'Jane Smith', NOW(), NOW()),
-- ('3', 'Write Tests', 'Add unit and integration tests', 'review', 'high', NULL, NOW(), NOW());
