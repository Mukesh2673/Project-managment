import { User, AuthUser, UserRole } from '@/types'
import mysql from 'mysql2/promise'
import { hashPassword, comparePassword } from './auth'
import { getPool } from './db'

// Get all users
export async function getUsers(): Promise<User[]> {
  const connection = await getPool().getConnection()
  try {
    const [rows] = await connection.query(
      'SELECT id, email, name, role, avatar, created_at as createdAt, updated_at as updatedAt FROM users ORDER BY name ASC'
    ) as [any[], any]
    
    return rows.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    }))
  } catch (error) {
    console.error('Error fetching users:', error)
    throw new Error('Failed to fetch users')
  } finally {
    connection.release()
  }
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  const connection = await getPool().getConnection()
  try {
    const [rows] = await connection.query(
      'SELECT id, email, name, role, avatar, created_at as createdAt, updated_at as updatedAt FROM users WHERE id = ?',
      [id]
    ) as [any[], any]
    
    if (rows.length === 0) {
      return null
    }
    
    const user = rows[0]
    return {
      ...user,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    throw new Error('Failed to fetch user')
  } finally {
    connection.release()
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
  const connection = await getPool().getConnection()
  try {
    const [rows] = await connection.query(
      'SELECT id, email, name, role, avatar, password_hash as passwordHash, created_at as createdAt, updated_at as updatedAt FROM users WHERE email = ?',
      [email]
    ) as [any[], any]
    
    if (rows.length === 0) {
      return null
    }
    
    const user = rows[0]
    return {
      ...user,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    }
  } catch (error) {
    console.error('Error fetching user by email:', error)
    throw new Error('Failed to fetch user')
  } finally {
    connection.release()
  }
}

// Create user
export async function createUser(
  userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }
): Promise<User> {
  const connection = await getPool().getConnection()
  try {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const now = new Date()
    const passwordHash = await hashPassword(userData.password)
    
    await connection.query(
      `INSERT INTO users (id, email, name, password_hash, role, avatar, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userData.email,
        userData.name,
        passwordHash,
        userData.role || 'user',
        userData.avatar || null,
        now,
        now,
      ]
    )
    
    const user = await getUserById(id)
    if (!user) {
      throw new Error('Failed to retrieve created user')
    }
    return user
  } catch (error: any) {
    console.error('Error creating user:', error)
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Email already exists')
    }
    throw new Error('Failed to create user')
  } finally {
    connection.release()
  }
}

// Update user
export async function updateUser(
  id: string,
  userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> & { password?: string }
): Promise<User | null> {
  const connection = await getPool().getConnection()
  try {
    const updateFields: string[] = []
    const values: any[] = []
    
    if (userData.email !== undefined) {
      updateFields.push('email = ?')
      values.push(userData.email)
    }
    if (userData.name !== undefined) {
      updateFields.push('name = ?')
      values.push(userData.name)
    }
    if (userData.role !== undefined) {
      updateFields.push('role = ?')
      values.push(userData.role)
    }
    if (userData.avatar !== undefined) {
      updateFields.push('avatar = ?')
      values.push(userData.avatar || null)
    }
    if (userData.password) {
      const passwordHash = await hashPassword(userData.password)
      updateFields.push('password_hash = ?')
      values.push(passwordHash)
    }
    
    if (updateFields.length === 0) {
      return await getUserById(id)
    }
    
    updateFields.push('updated_at = ?')
    values.push(new Date())
    values.push(id)
    
    await connection.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    )
    
    return await getUserById(id)
  } catch (error: any) {
    console.error('Error updating user:', error)
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Email already exists')
    }
    throw new Error('Failed to update user')
  } finally {
    connection.release()
  }
}

// Delete user
export async function deleteUser(id: string): Promise<boolean> {
  const connection = await getPool().getConnection()
  try {
    const [result] = await connection.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    ) as [any, any]
    
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error deleting user:', error)
    throw new Error('Failed to delete user')
  } finally {
    connection.release()
  }
}

// Verify user credentials
export async function verifyUserCredentials(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email)
  if (!user) {
    return null
  }
  
  const isValid = await comparePassword(password, user.passwordHash)
  if (!isValid) {
    return null
  }
  
  // Return user without password
  const { passwordHash, ...userWithoutPassword } = user
  return userWithoutPassword
}
