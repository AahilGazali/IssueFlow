import { createContext, useContext, useState } from 'react'
import { projectsAPI } from '../services/api'

const ProjectContext = createContext()

export const useProjects = () => {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider')
  }
  return context
}

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([])
  const [deletedProjects, setDeletedProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await projectsAPI.getAll()
      setProjects(response.data.projects)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProject = async (id) => {
    if (!id) return null
    setLoading(true)
    setCurrentProject(null) // Clear stale project so we show loading, not wrong project
    try {
      const response = await projectsAPI.getById(id)
      const project = response.data?.project
      setCurrentProject(project)
      return project
    } catch (error) {
      console.error('Error fetching project:', error)
      setCurrentProject(null)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (data) => {
    try {
      const response = await projectsAPI.create(data)
      setProjects([...projects, response.data.project])
      return { success: true, project: response.data.project }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create project',
      }
    }
  }

  const updateProject = async (id, data) => {
    try {
      const response = await projectsAPI.update(id, data)
      setProjects(projects.map((p) => (p.id === id ? response.data.project : p)))
      if (currentProject?.id === id) {
        setCurrentProject(response.data.project)
      }
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update project',
      }
    }
  }

  const deleteProject = async (id) => {
    try {
      const response = await projectsAPI.delete(id)
      const deletedProject = response.data?.project
      setProjects(projects.filter((p) => p.id !== id))
      if (currentProject?.id === id) {
        setCurrentProject(null)
      }
      if (deletedProject) {
        setDeletedProjects((prev) => [deletedProject, ...(prev || [])])
      } else {
        await fetchDeletedProjects()
      }
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete project',
      }
    }
  }

  const fetchDeletedProjects = async () => {
    try {
      const response = await projectsAPI.getDeleted()
      setDeletedProjects(response.data?.projects || [])
    } catch (error) {
      console.error('Error fetching deleted projects:', error)
      setDeletedProjects([])
    }
  }

  const restoreProject = async (id) => {
    try {
      await projectsAPI.restore(id)
      setDeletedProjects(deletedProjects.filter((p) => p.id !== id))
      await fetchProjects()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to restore project',
      }
    }
  }

  const permanentDeleteProject = async (id) => {
    try {
      await projectsAPI.permanentDelete(id)
      setDeletedProjects(deletedProjects.filter((p) => p.id !== id))
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to permanently delete project',
      }
    }
  }

  const value = {
    projects,
    deletedProjects,
    currentProject,
    loading,
    fetchProjects,
    fetchDeletedProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    restoreProject,
    permanentDeleteProject,
    setCurrentProject,
  }

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}
