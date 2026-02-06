import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProjects } from '../contexts/ProjectContext'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/Sidebar'
import Modal from '../components/Modal'
import { projectsAPI, ticketsAPI } from '../services/api'
import '../App.css'

const TICKET_TYPES = [
  { value: 'bug', label: 'Bug', icon: '🐛' },
  { value: 'task', label: 'Task', icon: '✓' },
  { value: 'feature', label: 'Feature', icon: '✨' },
  { value: 'improvement', label: 'Improvement', icon: '📈' },
  { value: 'epic', label: 'Epic', icon: '⚡' },
]
const PRIORITIES = [
  { value: 'highest', label: 'Highest' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'lowest', label: 'Lowest' },
]
const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
]

const Dashboard = () => {
  const { projects, deletedProjects, fetchProjects, fetchDeletedProjects, createProject, deleteProject, restoreProject, permanentDeleteProject, loading } = useProjects()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showModal, setShowModal] = useState(false)
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', project_key: '' })
  const [ticketForm, setTicketForm] = useState({
    project_id: '',
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    ticket_type: 'task',
    due_date: '',
  })
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [createTaskError, setCreateTaskError] = useState('')
  const [creatingTask, setCreatingTask] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewFilter, setViewFilter] = useState('all')
  const [deleteConfirmProject, setDeleteConfirmProject] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [permanentConfirmProject, setPermanentConfirmProject] = useState(null)
  const [allTickets, setAllTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  // Scroll to section when sidebar nav uses hash (e.g. #projects, #tasks)
  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (!hash) return
    const el = document.getElementById(hash)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  useEffect(() => {
    if (!showProfileMenu) return
    const close = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setShowProfileMenu(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showProfileMenu])

  const handleDeleteClick = (e, project) => {
    e.stopPropagation()
    setError('')
    setDeleteConfirmProject(project)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmProject) return
    setDeleting(true)
    setError('')
    const result = await deleteProject(deleteConfirmProject.id)
    setDeleting(false)
    setDeleteConfirmProject(null)
    if (result.success) {
      await fetchDeletedProjects()
      setViewFilter('trash')
    } else {
      setError(result.error || 'Failed to move project to trash')
    }
  }

  const handleRestoreProject = async (e, projectId) => {
    e.stopPropagation()
    setError('')
    const result = await restoreProject(projectId)
    if (result.success) {
      fetchDeletedProjects()
    } else {
      setError(result.error || 'Failed to restore project')
    }
  }

  const handlePermanentDeleteClick = (e, project) => {
    e.stopPropagation()
    setPermanentConfirmProject(project)
  }

  const handlePermanentDeleteConfirm = async () => {
    if (!permanentConfirmProject) return
    setError('')
    const result = await permanentDeleteProject(permanentConfirmProject.id)
    setPermanentConfirmProject(null)
    if (!result.success) {
      setError(result.error || 'Failed to delete permanently')
    } else {
      fetchDeletedProjects()
    }
  }

  useEffect(() => {
    if (viewFilter === 'trash') fetchDeletedProjects()
  }, [viewFilter])

  useEffect(() => {
    fetchDeletedProjects()
  }, [])

  useEffect(() => {
    if (projects.length === 0) {
      setAllTickets([])
      return
    }
    const loadAllTickets = async () => {
      setLoadingTickets(true)
      try {
        const results = await Promise.all(
          projects.map(p => ticketsAPI.getAll(p.id).catch(() => ({ data: { tickets: [] } })))
        )
        const tickets = results.flatMap(r => r.data?.tickets || [])
        setAllTickets(tickets)
      } catch (e) {
        setAllTickets([])
      } finally {
        setLoadingTickets(false)
      }
    }
    loadAllTickets()
  }, [projects])

  const handleCreateProject = async (e) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    const result = await createProject(formData)
    if (result.success) {
      setShowModal(false)
      setFormData({ title: '', description: '', project_key: '' })
    } else {
      setError(result.error)
    }
    setCreating(false)
  }

  const handleToggleStar = async (e, projectId) => {
    e.stopPropagation()
    try {
      await projectsAPI.toggleStar(projectId)
      fetchProjects()
    } catch (err) {
      console.error('Error toggling star:', err)
      fetchProjects()
    }
  }

  const openCreateTaskModal = () => {
    if (projects.length === 0) {
      setShowModal(true)
      return
    }
    setCreateTaskError('')
    setTicketForm({
      project_id: projects[0].id,
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      ticket_type: 'task',
      due_date: '',
    })
    setShowCreateTaskModal(true)
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    setCreateTaskError('')
    if (!ticketForm.project_id) {
      setCreateTaskError('Please select a project.')
      return
    }
    setCreatingTask(true)
    try {
      await ticketsAPI.create({
        project_id: ticketForm.project_id,
        title: ticketForm.title,
        description: ticketForm.description || undefined,
        priority: ticketForm.priority,
        status: ticketForm.status,
        ticket_type: ticketForm.ticket_type,
        due_date: ticketForm.due_date || undefined,
      })
      setShowCreateTaskModal(false)
      fetchProjects()
    } catch (err) {
      setCreateTaskError(err.response?.data?.error || 'Failed to create task.')
    } finally {
      setCreatingTask(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const baseProjects = viewFilter === 'trash'
    ? deletedProjects
    : viewFilter === 'starred'
      ? projects.filter(p => p.is_starred)
      : projects
  const filteredProjects = baseProjects.filter(p =>
    searchQuery === '' ||
    (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const starredProjects = projects.filter(p => p.is_starred)
  const displayName = user?.user_metadata?.display_name?.trim() || (user?.email ? user.email.split('@')[0].replace(/^./, c => c.toUpperCase()) : 'User')

  const stats = {
    totalProjects: projects.length,
    myTasks: allTickets.length,
    teamMembers: 1,
    openBugs: allTickets.filter(t => (t.ticket_type || 'task') === 'bug' && t.status !== 'done').length,
  }

  const tasksByStatus = {
    todo: allTickets.filter(t => t.status === 'todo').length,
    inProgress: allTickets.filter(t => t.status === 'in_progress' || t.status === 'in_review').length,
    completed: allTickets.filter(t => t.status === 'done').length,
  }

  const tasksByPriority = {
    high: allTickets.filter(t => t.priority === 'high' || t.priority === 'highest').length,
    medium: allTickets.filter(t => t.priority === 'medium').length,
    low: allTickets.filter(t => t.priority === 'low' || t.priority === 'lowest').length,
  }

  const recentTickets = [...allTickets]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8)

  const getProjectKey = (projectId) => {
    const p = projects.find(pr => pr.id === projectId)
    return p ? (p.project_key || p.title?.substring(0, 3).toUpperCase() || 'PRJ') : 'PRJ'
  }

  if (loading) {
    return (
      <>
        <Sidebar />
        <main className="main-content">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Sidebar />
      <main className="main-content dashboard-page">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-welcome">
              Welcome back, {displayName}! Here&apos;s what&apos;s happening with your projects.
            </p>
          </div>
          <div className="dashboard-header-right">
            <button type="button" className="icon-btn" title="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <div className="profile-menu-wrap" ref={profileMenuRef}>
              <button
                type="button"
                className="user-badge"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                title="Account menu"
              >
                <div className="user-avatar user-avatar-lg">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{displayName}</span>
              </button>
              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="user-avatar user-avatar-lg">{user?.email?.charAt(0).toUpperCase()}</div>
                    <div className="profile-dropdown-info">
                      <span className="profile-dropdown-name">{displayName}</span>
                      <span className="profile-dropdown-email">{user?.email}</span>
                    </div>
                  </div>
                  <div className="profile-dropdown-divider" />
                  <button type="button" className="profile-dropdown-item" onClick={(e) => { e.stopPropagation(); setShowProfileMenu(false); navigate('/account'); }}>
                    <span className="profile-dropdown-icon">👤</span>
                    My account
                  </button>
                  <button type="button" className="profile-dropdown-item" onClick={(e) => { e.stopPropagation(); setShowProfileMenu(false); navigate('/settings'); }}>
                    <span className="profile-dropdown-icon">⚙</span>
                    Settings
                  </button>
                  <button type="button" className="profile-dropdown-item" onClick={(e) => { e.stopPropagation(); setShowProfileMenu(false); navigate('/help'); }}>
                    <span className="profile-dropdown-icon">?</span>
                    Help & Support
                  </button>
                  <div className="profile-dropdown-divider" />
                  <button type="button" className="profile-dropdown-item profile-dropdown-item-danger" onClick={(e) => { e.stopPropagation(); setShowProfileMenu(false); handleLogout(); }}>
                    <span className="profile-dropdown-icon">⎋</span>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section id="members" className="dashboard-section dashboard-section-members">
          <div className="section-header-plain">
            <h2 className="section-title-large">Members</h2>
            <p className="section-subtitle">Overview of your team and project activity.</p>
          </div>
          <div className="stats-cards">
          <div className="stat-card stat-card-purple">
            <div className="stat-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{stats.totalProjects}</span>
              <span className="stat-card-label">Total Projects</span>
            </div>
          </div>
          <div className="stat-card stat-card-purple">
            <div className="stat-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{loadingTickets ? '…' : stats.myTasks}</span>
              <span className="stat-card-label">My Tasks</span>
            </div>
          </div>
          <div className="stat-card stat-card-green">
            <div className="stat-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{stats.teamMembers}</span>
              <span className="stat-card-label">Team Members</span>
            </div>
          </div>
          <div className="stat-card stat-card-red">
            <div className="stat-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{loadingTickets ? '…' : stats.openBugs}</span>
              <span className="stat-card-label">Open Bugs</span>
            </div>
          </div>
          </div>
        </section>

        <div className="dashboard-grid" id="tasks">
          <section className="dashboard-box tasks-by-status">
            <h3 className="box-title">Tasks by Status</h3>
            <div className="pill-list">
              <div className="pill-item">
                <span className="pill-label">To Do</span>
                <span className="pill-value pill-gray">{tasksByStatus.todo}</span>
              </div>
              <div className="pill-item">
                <span className="pill-label">In Progress</span>
                <span className="pill-value pill-blue">{tasksByStatus.inProgress}</span>
              </div>
              <div className="pill-item">
                <span className="pill-label">Completed</span>
                <span className="pill-value pill-green">{tasksByStatus.completed}</span>
              </div>
            </div>
          </section>

          <section className="dashboard-box tasks-by-priority">
            <h3 className="box-title">Tasks by Priority</h3>
            <div className="pill-list">
              <div className="pill-item">
                <span className="pill-label">High</span>
                <span className="pill-value pill-red">{tasksByPriority.high}</span>
              </div>
              <div className="pill-item">
                <span className="pill-label">Medium</span>
                <span className="pill-value pill-orange">{tasksByPriority.medium}</span>
              </div>
              <div className="pill-item">
                <span className="pill-label">Low</span>
                <span className="pill-value pill-blue">{tasksByPriority.low}</span>
              </div>
            </div>
          </section>
        </div>

        <section id="settings" className="dashboard-section dashboard-section-settings">
          <div className="section-header-plain">
            <h2 className="section-title-large">Settings</h2>
            <p className="section-subtitle">Quick actions and preferences.</p>
          </div>
          <div className="quick-actions">
            <button className="quick-action-btn" onClick={openCreateTaskModal}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Task
            </button>
            <button className="quick-action-btn" onClick={() => setShowModal(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Project
            </button>
          </div>
        </section>

        <section className="recent-tasks-section">
          <h3 className="section-heading">Recent Tasks</h3>
          {loadingTickets ? (
            <div className="loading-small"><div className="loading-spinner"></div></div>
          ) : recentTickets.length === 0 ? (
            <p className="empty-message">No tasks yet. Create a project and add issues.</p>
          ) : (
            <div className="recent-tasks-list">
              {recentTickets.map(t => (
                <div
                  key={t.id}
                  className="recent-task-item"
                  onClick={() => {
                    const proj = projects.find(p => p.id === t.project_id)
                    if (proj) navigate(`/project/${proj.id}`)
                  }}
                >
                  <span className="recent-task-key">{getProjectKey(t.project_id)}-{t.ticket_number || t.id?.slice(0, 4)}</span>
                  <span className="recent-task-title">{t.title}</span>
                  <span className={`recent-task-status status-${t.status}`}>{t.status?.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="projects" className="dashboard-section projects-section">
          {error && (
            <div className="dashboard-error-banner">
              <span>{error}</span>
              <button type="button" className="dashboard-error-dismiss" onClick={() => setError('')} aria-label="Dismiss">✕</button>
            </div>
          )}
          <div className="section-header">
            <h2 className="section-title">Projects</h2>
            <div className="section-actions">
              <div className="search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="view-tabs">
                <button className={`view-tab ${viewFilter === 'all' ? 'active' : ''}`} onClick={() => setViewFilter('all')}>All</button>
                <button className={`view-tab ${viewFilter === 'starred' ? 'active' : ''}`} onClick={() => setViewFilter('starred')}>Starred</button>
                <button className={`view-tab ${viewFilter === 'trash' ? 'active' : ''}`} onClick={() => setViewFilter('trash')}>Trash</button>
              </div>
            </div>
          </div>
          {filteredProjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📂</div>
              <h3>
                {viewFilter === 'trash' ? (searchQuery ? 'No deleted projects found' : 'Trash is empty') : searchQuery ? 'No projects found' : 'No projects yet'}
              </h3>
              <p>
                {viewFilter === 'trash' ? 'Deleted projects appear here. You can restore or delete them permanently.' : searchQuery ? 'Try a different search' : 'Create your first project to get started.'}
              </p>
              {!searchQuery && viewFilter !== 'trash' && (
                <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
              )}
            </div>
          ) : (
            <div className="projects-list">
              {filteredProjects.map(project => {
                const projectKey = project.project_key || project.title?.substring(0, 3).toUpperCase() || 'PRJ'
                const isCreator = project.created_by === user?.id
                const isTrash = viewFilter === 'trash'
                return (
                  <div
                    key={project.id}
                    className={`project-list-item ${isTrash ? 'project-list-item-trash' : ''}`}
                    onClick={() => !isTrash && navigate(`/project/${project.id}`)}
                  >
                    <div className="project-list-left">
                      <div className="project-list-icon">📋</div>
                      <div className="project-list-info">
                        <div className="project-list-header">
                          <span className="project-list-name">{project.title}</span>
                          <span className="project-list-key">{projectKey}</span>
                        </div>
                        <p className="project-list-desc">
                          {isTrash && project.deleted_at
                            ? `Deleted ${new Date(project.deleted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                            : (project.description || 'No description')}
                        </p>
                      </div>
                    </div>
                    <div className="project-list-right">
                      {isTrash ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary project-action-btn"
                            onClick={(e) => handleRestoreProject(e, project.id)}
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm project-delete-permanent-btn"
                            onClick={(e) => handlePermanentDeleteClick(e, project)}
                            title="Delete permanently"
                          >
                            Delete permanently
                          </button>
                        </>
                      ) : (
                        <>
                          {isCreator && (
                            <button
                              type="button"
                              className="project-delete-btn"
                              onClick={(e) => handleDeleteClick(e, project)}
                              title="Move to trash"
                              aria-label={`Move ${project.title} to trash`}
                            >
                              🗑️
                            </button>
                          )}
                          <button
                            type="button"
                            className={`star-btn ${project.is_starred ? 'starred' : ''}`}
                            onClick={(e) => handleToggleStar(e, project.id)}
                            title={project.is_starred ? 'Unstar' : 'Star'}
                          >
                            {project.is_starred ? '⭐' : '☆'}
                          </button>
                          <span className="project-list-date">
                            {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setError(''); setFormData({ title: '', description: '', project_key: '' }) }}
        title="Create Project"
      >
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleCreateProject}>
          <div className="form-group">
            <label className="form-label" htmlFor="create-project-name">Project Name <span className="required">*</span></label>
            <input
              id="create-project-name"
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value, project_key: e.target.value.substring(0, 3).toUpperCase() })}
              placeholder="Enter project name"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="create-project-key">Project Key</label>
            <input
              id="create-project-key"
              type="text"
              className="form-input"
              value={formData.project_key}
              onChange={(e) => setFormData({ ...formData, project_key: e.target.value.toUpperCase() })}
              placeholder="e.g. PRJ"
              maxLength={5}
            />
            <span className="form-hint">Used as prefix for issue keys (e.g. PRJ-1)</span>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="create-project-desc">Description</label>
            <textarea
              id="create-project-desc"
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this project about?"
              rows={3}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? <><span className="loading-spinner"></span> Creating...</> : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showCreateTaskModal}
        onClose={() => {
          setShowCreateTaskModal(false)
          setCreateTaskError('')
          setTicketForm({ project_id: '', title: '', description: '', priority: 'medium', status: 'todo', ticket_type: 'task', due_date: '' })
        }}
        title="Create Task"
      >
        {createTaskError && <div className="error">{createTaskError}</div>}
        <form onSubmit={handleCreateTask}>
          <div className="form-group">
            <label className="form-label">Project <span className="required">*</span></label>
            <select
              className="form-select"
              value={ticketForm.project_id}
              onChange={(e) => setTicketForm({ ...ticketForm, project_id: e.target.value })}
              required
            >
              <option value="">Select project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.project_key || p.title?.substring(0, 3).toUpperCase()})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Summary <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              value={ticketForm.title}
              onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
              placeholder="What needs to be done?"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={ticketForm.description}
              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
              placeholder="Add a description..."
              rows={3}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={ticketForm.ticket_type}
                onChange={(e) => setTicketForm({ ...ticketForm, ticket_type: e.target.value })}
              >
                {TICKET_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={ticketForm.priority}
                onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={ticketForm.status}
                onChange={(e) => setTicketForm({ ...ticketForm, status: e.target.value })}
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={ticketForm.due_date}
                onChange={(e) => setTicketForm({ ...ticketForm, due_date: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateTaskModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={creatingTask}>
              {creatingTask ? <><span className="loading-spinner"></span> Creating...</> : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirmProject}
        onClose={() => setDeleteConfirmProject(null)}
        title="Move to trash"
      >
        <p className="delete-confirm-text">
          Move project &quot;{deleteConfirmProject?.title}&quot; to trash? You can restore it from Trash later or delete it permanently.
        </p>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirmProject(null)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleDeleteConfirm} disabled={deleting}>
            {deleting ? <><span className="loading-spinner"></span> Moving...</> : 'Move to trash'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!permanentConfirmProject}
        onClose={() => setPermanentConfirmProject(null)}
        title="Delete permanently"
      >
        <p className="delete-confirm-text">
          Permanently delete &quot;{permanentConfirmProject?.title}&quot;? All tickets and data will be removed. This cannot be undone.
        </p>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setPermanentConfirmProject(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handlePermanentDeleteConfirm}>
            Delete permanently
          </button>
        </div>
      </Modal>
    </>
  )
}

export default Dashboard
