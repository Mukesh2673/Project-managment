import { getPool } from './db'
import mysql from 'mysql2/promise'

export interface Project {
  id: string
  name: string
  description?: string
  ownerId: string
  status: 'active' | 'archived' | 'completed'
  createdAt: Date
  updatedAt: Date
}

// Get all projects for a user
export async function getProjectsByUserId(userId: string): Promise<Project[]> {
  const connection = await getPool().getConnection()
  try {
    const [rows] = await connection.query(
      'SELECT id, name, description, owner_id as ownerId, status, created_at as createdAt, updated_at as updatedAt FROM projects WHERE owner_id = ? ORDER BY created_at DESC',
      [userId]
    ) as [any[], any]
    
    return rows.map((project: any) => ({
      ...project,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
    }))
  } catch (error) {
    console.error('Error fetching projects:', error)
    throw new Error('Failed to fetch projects')
  } finally {
    connection.release()
  }
}

// Get a single project by ID
export async function getProjectById(id: string): Promise<Project | null> {
  const connection = await getPool().getConnection()
  try {
    const [rows] = await connection.query(
      'SELECT id, name, description, owner_id as ownerId, status, created_at as createdAt, updated_at as updatedAt FROM projects WHERE id = ?',
      [id]
    ) as [any[], any]
    
    if (rows.length === 0) {
      return null
    }
    
    const project = rows[0]
    return {
      ...project,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
    }
  } catch (error) {
    console.error('Error fetching project:', error)
    throw new Error('Failed to fetch project')
  } finally {
    connection.release()
  }
}

// Create a new project
export async function createProject(
  projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Project> {
  const connection = await getPool().getConnection()
  try {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const now = new Date()
    
    await connection.query(
      `INSERT INTO projects (id, name, description, owner_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        projectData.name,
        projectData.description || null,
        projectData.ownerId,
        projectData.status || 'active',
        now,
        now,
      ]
    )
    
    const project = await getProjectById(id)
    if (!project) {
      throw new Error('Failed to retrieve created project')
    }
    return project
  } catch (error: any) {
    console.error('Error creating project:', error)
    throw new Error(`Failed to create project: ${error.message}`)
  } finally {
    connection.release()
  }
}

// Update an existing project
export async function updateProject(
  id: string,
  projectData: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Project | null> {
  const connection = await getPool().getConnection()
  try {
    const updateFields: string[] = []
    const values: any[] = []
    
    if (projectData.name !== undefined) {
      updateFields.push('name = ?')
      values.push(projectData.name)
    }
    if (projectData.description !== undefined) {
      updateFields.push('description = ?')
      values.push(projectData.description || null)
    }
    if (projectData.status !== undefined) {
      updateFields.push('status = ?')
      values.push(projectData.status)
    }
    
    if (updateFields.length === 0) {
      return await getProjectById(id)
    }
    
    updateFields.push('updated_at = ?')
    values.push(new Date())
    values.push(id)
    
    const [result] = await connection.query(
      `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    ) as [any, any]
    
    if (result.affectedRows === 0) {
      return null
    }
    
    return await getProjectById(id)
  } catch (error) {
    console.error('Error updating project:', error)
    throw new Error('Failed to update project')
  } finally {
    connection.release()
  }
}

// Delete a project
export async function deleteProject(id: string): Promise<boolean> {
  const connection = await getPool().getConnection()
  try {
    const [result] = await connection.query(
      'DELETE FROM projects WHERE id = ?',
      [id]
    ) as [any, any]
    
    return result.affectedRows > 0
  } catch (error) {
    console.error('Error deleting project:', error)
    throw new Error('Failed to delete project')
  } finally {
    connection.release()
  }
}
