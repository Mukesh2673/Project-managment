-- Migration: Create tickets table
-- Created: 2026-02-06
-- Description: Initial migration to create the tickets table

CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('todo', 'in-progress', 'review', 'done') NOT NULL DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  assignee VARCHAR(255),
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
