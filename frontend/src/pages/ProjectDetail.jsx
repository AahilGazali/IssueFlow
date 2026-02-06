import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjects } from '../contexts/ProjectContext'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/Sidebar'
import { ticketsAPI, commentsAPI, projectsAPI } from '../services/api'
import '../App.css'

const TICKET_TYPES = [
  { value: 'bug', label: 'Bug', icon: '🐛', color: '#e74c3c' },
  { value: 'task', label: 'Task', icon: '✓', color: '#3498db' },
  { value: 'feature', label: 'Feature', icon: '✨', color: '#9b59b6' },
  { value: 'improvement', label: 'Improvement', icon: '📈', color: '#2ecc71' },
  { value: 'epic', label: 'Epic', icon: '⚡', color: '#9b59b6' },
]

const PRIORITIES = [
  { value: 'highest', label: 'Highest', icon: '⬆️⬆️', color: '#e74c3c' },
  { value: 'high', label: 'High', icon: '⬆️', color: '#e67e22' },
  { value: 'medium', label: 'Medium', icon: '➡️', color: '#f1c40f' },
  { value: 'low', label: 'Low', icon: '⬇️', color: '#3498db' },
  { value: 'lowest', label: 'Lowest', icon: '⬇️⬇️', color: '#95a5a6' },
]

const STATUSES = [
  { value: 'todo', label: 'TO DO', color: '#626f86' },
  { value: 'in_progress', label: 'IN PROGRESS', color: '#0c66e4' },
  { value: 'in_review', label: 'IN REVIEW', color: '#e2b203' },
  { value: 'done', label: 'DONE', color: '#22a06b' },
]

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchProject, currentProject, loading: projectLoading } = useProjects()
  const { user, logout } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    ticket_type: 'task',
    due_date: '',
    labels: [],
    assignee: '',
  })
  const [error, setError] = useState('')
  const [draggedTicket, setDraggedTicket] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [creating, setCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    priority: 'all',
    ticket_type: 'all',
  })
  const [viewMode, setViewMode] = useState('board')
  const [stats, setStats] = useState(null)
  const [isStarred, setIsStarred] = useState(false)
  const [projectLoadAttempted, setProjectLoadAttempted] = useState(false)
  const [members, setMembers] = useState([])
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const inviteRef = useRef(null)
  const profileMenuRef = useRef(null)

  const isAdmin = currentProject?.created_by === user?.id
  const displayName = user?.user_metadata?.display_name?.trim() || (user?.email ? user.email.split('@')[0].replace(/^./, c => c.toUpperCase()) : 'User')

  useEffect(() => {
    if (!showInvite) return
    const handleClickOutside = (e) => {
      if (inviteRef.current && !inviteRef.current.contains(e.target)) {
        setShowInvite(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showInvite])

  useEffect(() => {
    if (!showProfileMenu) return
    const close = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setShowProfileMenu(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showProfileMenu])

  useEffect(() => {
    setProjectLoadAttempted(false)
    loadProject()
    loadTickets()
    loadMembers()
  }, [id])

  const loadMembers = async () => {
    if (!id) return
    try {
      const res = await projectsAPI.getMembers(id)
      setMembers(res.data.members || [])
    } catch (err) {
      console.error('Error loading members:', err)
      setMembers([])
    }
  }

  const loadProject = async () => {
    if (!id) {
      setProjectLoadAttempted(true)
      return
    }
    try {
      const project = await fetchProject(id)
      if (project) {
        setIsStarred(project.is_starred || false)
      }
      setProjectLoadAttempted(true)
    } catch (error) {
      console.error('Error loading project:', error)
      setProjectLoadAttempted(true)
    }
  }

  const loadTickets = async () => {
    setLoading(true)
    try {
      const response = await ticketsAPI.getAll(id)
      setTickets(response.data.tickets || [])
      
      const ticketList = response.data.tickets || []
      setStats({
        total: ticketList.length,
        todo: ticketList.filter(t => t.status === 'todo').length,
        in_progress: ticketList.filter(t => t.status === 'in_progress').length,
        in_review: ticketList.filter(t => t.status === 'in_review').length,
        done: ticketList.filter(t => t.status === 'done').length,
      })
    } catch (error) {
      console.error('Error loading tickets:', error)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    setError('')
    setCreating(true)

    const tempId = `temp-${Date.now()}`
    const newTicket = {
      id: tempId,
      ...ticketForm,
      project_id: id,
      created_at: new Date().toISOString(),
      created_by: user?.id
    }
    setTickets(prev => [...prev, newTicket])
    setShowCreateModal(false)
    setTicketForm({ 
      title: '', 
      description: '', 
      priority: 'medium', 
      status: 'todo', 
      ticket_type: 'task',
      due_date: '',
      labels: [],
      assignee: '',
    })

    try {
      const result = await ticketsAPI.create({
        ...ticketForm,
        project_id: id,
        assignee: ticketForm.assignee || null,
      })
      if (result.status === 201) {
        const createdTicket = result.data.ticket
        setTickets(prev => prev.map(t => t.id === tempId ? createdTicket : t))
        if (selectedTicket?.id === tempId) {
          setSelectedTicket(createdTicket)
        }
        loadTickets()
      }
    } catch (err) {
      setTickets(prev => prev.filter(t => t.id !== tempId))
      setError(err.response?.data?.error || 'Failed to create ticket')
      setShowCreateModal(true)
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateTicket = async (ticketId, updates) => {
    if (!ticketId || String(ticketId).startsWith('temp-')) {
      setError('Please wait for the ticket to finish saving.')
      setTimeout(() => setError(''), 4000)
      return
    }
    const oldTickets = [...tickets]
    const oldSelectedTicket = selectedTicket
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, ...updates } : t))
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => ({ ...prev, ...updates }))
    }

    try {
      const result = await ticketsAPI.update(ticketId, updates)
      if (result.status === 200) {
        loadTickets()
      }
    } catch (error) {
      console.error('Error updating ticket:', error)
      setTickets(oldTickets)
      if (oldSelectedTicket?.id === ticketId) {
        setSelectedTicket(oldSelectedTicket)
      }
      const errorMsg = error.response?.data?.error || 'Failed to update ticket. Check browser console.'
      setError(errorMsg)
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleDeleteTicket = async (ticketId) => {
    const oldTickets = [...tickets]
    setTickets(tickets.filter(t => t.id !== ticketId))
    setShowDetailPanel(false)
    setSelectedTicket(null)

    try {
      await ticketsAPI.delete(ticketId)
      loadTickets()
    } catch (error) {
      console.error('Error deleting ticket:', error)
      setTickets(oldTickets)
    }
  }

  const handleToggleStar = async () => {
    const newStarred = !isStarred
    setIsStarred(newStarred) // Optimistic update
    try {
      const response = await projectsAPI.toggleStar(id)
      console.log('Star toggled:', response.data)
    } catch (error) {
      console.error('Error toggling star:', error)
      setIsStarred(!newStarred) // Revert on error
      setError('Failed to star project. Run the SQL: ALTER TABLE project_members ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;')
      setTimeout(() => setError(''), 8000)
    }
  }

  const handleInviteMember = async (e) => {
    e.preventDefault()
    const email = inviteEmail.trim()
    if (!email) {
      setInviteError('Enter an email address')
      return
    }
    setInviteError('')
    setInviteLoading(true)
    try {
      await projectsAPI.inviteMember(id, email)
      setInviteEmail('')
      setShowInvite(false)
      await loadMembers()
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Failed to invite member')
    } finally {
      setInviteLoading(false)
    }
  }

  const openTicketDetail = (ticket) => {
    setError('') // clear previous ticket error when opening a ticket
    setSelectedTicket(ticket)
    setShowDetailPanel(true)
  }

  const getFilteredTickets = (status) => {
    return tickets
      .filter(ticket => ticket.status === status)
      .filter(ticket => 
        searchQuery === '' || 
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter(ticket => 
        filters.priority === 'all' || ticket.priority === filters.priority
      )
      .filter(ticket => 
        filters.ticket_type === 'all' || ticket.ticket_type === filters.ticket_type
      )
  }

  // Drag and Drop
  const handleDragStart = (e, ticket) => {
    setDraggedTicket(ticket)
    e.dataTransfer.effectAllowed = 'move'
    e.target.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
    setDraggedTicket(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e, status) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }

  const handleDragLeave = () => setDragOverColumn(null)

  const handleDrop = async (e, newStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    
    if (draggedTicket && draggedTicket.status !== newStatus) {
      handleUpdateTicket(draggedTicket.id, { status: newStatus })
    }
    setDraggedTicket(null)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getTypeInfo = (type) => TICKET_TYPES.find(t => t.value === type) || TICKET_TYPES[1]
  const getPriorityInfo = (priority) => PRIORITIES.find(p => p.value === priority) || PRIORITIES[2]
  const getStatusInfo = (status) => STATUSES.find(s => s.value === status) || STATUSES[0]

  const isStillLoading = projectLoading || loading || !projectLoadAttempted

  if (isStillLoading) {
    return (
      <>
        <Sidebar />
        <main className="main-content">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading board...</p>
          </div>
        </main>
      </>
    )
  }

  if (projectLoadAttempted && (!currentProject || currentProject.id !== id)) {
    return (
      <>
        <Sidebar />
        <main className="main-content">
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <h3>Project not found</h3>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        </main>
      </>
    )
  }

  const projectKey = currentProject.project_key || currentProject.title?.substring(0, 3).toUpperCase() || 'PRJ'

  return (
    <>
      <Sidebar />
      {/* Error Toast */}
      {error && (
        <div className="error-toast">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}
      <main className="main-content">
        {/* Top Bar */}
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-breadcrumb">
              <a onClick={() => navigate('/dashboard')}>Projects</a>
              <span>/</span>
              <span>{currentProject.title}</span>
            </div>
          </div>
          <div className="topbar-right">
            {/* Team / Invite (admin only) */}
            {isAdmin && (
              <div className="topbar-team-wrap" ref={inviteRef}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowInvite(!showInvite)}
                  title="Invite team members"
                >
                  👥 Team
                </button>
                {showInvite && (
                  <div className="invite-dropdown">
                    <div className="invite-dropdown-header">Invite by email</div>
                    <form onSubmit={handleInviteMember} className="invite-form">
                      <input
                        type="email"
                        className="form-input invite-input"
                        placeholder="teammate@example.com"
                        value={inviteEmail}
                        onChange={(e) => { setInviteEmail(e.target.value); setInviteError('') }}
                        autoFocus
                      />
                      <button type="submit" className="btn btn-primary btn-sm" disabled={inviteLoading}>
                        {inviteLoading ? '...' : 'Invite'}
                      </button>
                    </form>
                    {inviteError && <div className="invite-error">{inviteError}</div>}
                    <div className="invite-members-list">
                      <div className="invite-members-title">Members ({members.length})</div>
                      {members.map((m) => (
                        <div key={m.user_id} className="invite-member-row">
                          <span className="invite-member-avatar">{(m.email || '?').charAt(0).toUpperCase()}</span>
                          <span className="invite-member-email" title={m.user_id}>
                            {m.email || `Member (${m.user_id?.slice(0, 8)}…)`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button 
              className={`btn btn-icon star-btn ${isStarred ? 'starred' : ''}`}
              onClick={handleToggleStar}
              title={isStarred ? 'Unstar project' : 'Star project'}
            >
              {isStarred ? '⭐' : '☆'}
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create
            </button>
            <div className="profile-menu-wrap profile-menu-wrap-topbar" ref={profileMenuRef}>
              <button
                type="button"
                className="user-avatar user-avatar-btn"
                title="Account menu"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                {user?.email?.charAt(0).toUpperCase()}
              </button>
              {showProfileMenu && (
                <div className="profile-dropdown profile-dropdown-topbar">
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
        </div>

        {/* Board Header */}
        <div className="board-toolbar">
          <div className="board-toolbar-left">
            <div className="project-badge">
              <span className="project-icon">📋</span>
              <span className="project-key">{projectKey}</span>
            </div>
            <h1 className="board-title">{currentProject.title}</h1>
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'board' ? 'active' : ''}`}
                onClick={() => setViewMode('board')}
                title="Board view"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                </svg>
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          <div className="board-toolbar-right">
            <div className="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="filter-select"
              value={filters.ticket_type}
              onChange={(e) => setFilters({...filters, ticket_type: e.target.value})}
            >
              <option value="all">All Types</option>
              {TICKET_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
              ))}
            </select>
            <select 
              className="filter-select"
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
            >
              <option value="all">All Priorities</option>
              {PRIORITIES.map(p => (
                <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="stats-bar">
            <div className="stat-chip">
              <span className="stat-label">Total</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat-chip todo">
              <span className="stat-label">To Do</span>
              <span className="stat-value">{stats.todo}</span>
            </div>
            <div className="stat-chip in-progress">
              <span className="stat-label">In Progress</span>
              <span className="stat-value">{stats.in_progress}</span>
            </div>
            <div className="stat-chip in-review">
              <span className="stat-label">In Review</span>
              <span className="stat-value">{stats.in_review}</span>
            </div>
            <div className="stat-chip done">
              <span className="stat-label">Done</span>
              <span className="stat-value">{stats.done}</span>
            </div>
          </div>
        )}

        {/* Board / List View */}
        <div className="board-container">
          {viewMode === 'board' ? (
            <div className="kanban-board">
              {STATUSES.map(status => (
                <div 
                  key={status.value}
                  className={`kanban-column ${dragOverColumn === status.value ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, status.value)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, status.value)}
                >
                  <div className="kanban-column-header">
                    <div className="column-header-left">
                      <span className="column-dot" style={{ background: status.color }}></span>
                      <span>{status.label}</span>
                      <span className="column-count">{getFilteredTickets(status.value).length}</span>
                    </div>
                    <button 
                      className="column-add-btn" 
                      onClick={() => { 
                        setTicketForm({...ticketForm, status: status.value}); 
                        setShowCreateModal(true); 
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                  </div>
                  <div className="kanban-cards">
                    {getFilteredTickets(status.value).map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        projectKey={projectKey}
                        getTypeInfo={getTypeInfo}
                        getPriorityInfo={getPriorityInfo}
                        onClick={() => openTicketDetail(ticket)}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                    {getFilteredTickets(status.value).length === 0 && (
                      <div className="kanban-empty">No issues</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="list-view">
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Key</th>
                    <th>Summary</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets
                    .filter(t => searchQuery === '' || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .filter(t => filters.priority === 'all' || t.priority === filters.priority)
                    .filter(t => filters.ticket_type === 'all' || t.ticket_type === filters.ticket_type)
                    .map(ticket => {
                      const typeInfo = getTypeInfo(ticket.ticket_type)
                      const priorityInfo = getPriorityInfo(ticket.priority)
                      const statusInfo = getStatusInfo(ticket.status)
                      const ticketKey = `${projectKey}-${ticket.ticket_number || ticket.id?.substring(0, 4).toUpperCase()}`
                      
                      return (
                        <tr key={ticket.id} onClick={() => openTicketDetail(ticket)}>
                          <td>
                            <span className="type-icon" style={{ color: typeInfo.color }}>
                              {typeInfo.icon}
                            </span>
                          </td>
                          <td className="ticket-key-cell">{ticketKey}</td>
                          <td className="ticket-title-cell">{ticket.title}</td>
                          <td>
                            <span className="status-badge" style={{ 
                              background: statusInfo.color + '20', 
                              color: statusInfo.color 
                            }}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td>
                            <span className="priority-icon">{priorityInfo.icon}</span>
                          </td>
                          <td className="date-cell">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal create-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Issue</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateTicket}>
              <div className="modal-body">
                {error && <div className="error">{error}</div>}
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Issue Type</label>
                    <select
                      className="form-select"
                      value={ticketForm.ticket_type}
                      onChange={(e) => setTicketForm({ ...ticketForm, ticket_type: e.target.value })}
                    >
                      {TICKET_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={ticketForm.status}
                      onChange={(e) => setTicketForm({ ...ticketForm, status: e.target.value })}
                    >
                      {STATUSES.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
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
                    rows={4}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                    >
                      {PRIORITIES.map(p => (
                        <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
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

                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select
                    className="form-select"
                    value={ticketForm.assignee || ''}
                    onChange={(e) => setTicketForm({ ...ticketForm, assignee: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.email || m.user_id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <><span className="loading-spinner"></span> Creating...</> : 'Create Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Detail Panel */}
      {showDetailPanel && selectedTicket && (
        <TicketDetailPanel
          ticket={selectedTicket}
          projectTickets={tickets}
          user={user}
          projectKey={projectKey}
          members={members}
          onClose={() => { setShowDetailPanel(false); setSelectedTicket(null); }}
          onUpdate={handleUpdateTicket}
          onDelete={handleDeleteTicket}
          TICKET_TYPES={TICKET_TYPES}
          PRIORITIES={PRIORITIES}
          STATUSES={STATUSES}
        />
      )}
    </>
  )
}

// Ticket Card Component
const TicketCard = ({ ticket, projectKey, getTypeInfo, getPriorityInfo, onClick, onDragStart, onDragEnd }) => {
  const typeInfo = getTypeInfo(ticket.ticket_type || 'task')
  const priorityInfo = getPriorityInfo(ticket.priority || 'medium')
  const ticketKey = `${projectKey}-${ticket.ticket_number || ticket.id?.substring(0, 4).toUpperCase()}`
  
  return (
    <div 
      className="ticket-card"
      draggable
      onDragStart={(e) => onDragStart(e, ticket)}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <div className="ticket-card-content">
        <p className="ticket-card-title">{ticket.title}</p>
        <div className="ticket-card-footer">
          <div className="ticket-card-meta">
            <span className="type-badge" style={{ color: typeInfo.color }} title={typeInfo.label}>
              {typeInfo.icon}
            </span>
            <span className="ticket-key">{ticketKey}</span>
          </div>
          <div className="ticket-card-right">
            {ticket.due_date && (
              <span className="ticket-due-date" title="Due date">
                📅 {new Date(ticket.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            <span className="priority-badge" title={priorityInfo.label}>
              {priorityInfo.icon}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Ticket Detail Panel Component (Jira-like layout)
const TicketDetailPanel = ({ ticket, projectTickets = [], user, projectKey, members = [], onClose, onUpdate, onDelete, TICKET_TYPES, PRIORITIES, STATUSES }) => {
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [descOpen, setDescOpen] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [showLinkDropdown, setShowLinkDropdown] = useState(false)

  const ticketSubtasks = Array.isArray(ticket.subtasks) ? ticket.subtasks : []
  const ticketLinkedIds = Array.isArray(ticket.linked_ticket_ids) ? ticket.linked_ticket_ids : []

  // Editable fields (sync subtasks/linked from ticket when ticket changes)
  const [editData, setEditData] = useState({
    title: ticket.title || '',
    description: ticket.description || '',
    status: ticket.status || 'todo',
    ticket_type: ticket.ticket_type || 'task',
    priority: ticket.priority || 'medium',
    due_date: ticket.due_date || '',
    assignee: ticket.assignee || '',
    subtasks: ticketSubtasks.length ? ticketSubtasks : [],
    linked_ticket_ids: ticketLinkedIds.length ? [...ticketLinkedIds] : [],
  })

  useEffect(() => {
    setEditData(prev => ({
      ...prev,
      title: ticket.title || '',
      description: ticket.description || '',
      status: ticket.status || 'todo',
      ticket_type: ticket.ticket_type || 'task',
      priority: ticket.priority || 'medium',
      due_date: ticket.due_date || '',
      assignee: ticket.assignee || '',
      subtasks: Array.isArray(ticket.subtasks) ? ticket.subtasks : [],
      linked_ticket_ids: Array.isArray(ticket.linked_ticket_ids) ? [...ticket.linked_ticket_ids] : [],
    }))
  }, [ticket.id])

  const ticketKey = `${projectKey}-${ticket.ticket_number || ticket.id?.substring(0, 4).toUpperCase()}`
  const typeInfo = TICKET_TYPES.find(t => t.value === editData.ticket_type) || TICKET_TYPES[1]
  const statusInfo = STATUSES.find(s => s.value === editData.status) || STATUSES[0]
  const assigneeMember = members.find(m => m.user_id === editData.assignee)
  const isAssigned = !!editData.assignee

  const isTempTicket = String(ticket?.id || '').startsWith('temp-')

  useEffect(() => {
    if (!ticket?.id || isTempTicket) {
      setLoadingComments(false)
      return
    }
    loadComments()
  }, [ticket?.id, isTempTicket])

  useEffect(() => {
    if (!showMoreMenu) return
    const close = (e) => {
      if (e.target.closest('.detail-more-wrap')) return
      setShowMoreMenu(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showMoreMenu])

  // Check for changes
  useEffect(() => {
    const sameSubtasks = JSON.stringify(editData.subtasks || []) === JSON.stringify(ticketSubtasks)
    const sameLinked = (editData.linked_ticket_ids || []).length === ticketLinkedIds.length &&
      (editData.linked_ticket_ids || []).every((id, i) => id === ticketLinkedIds[i])
    const changed = 
      editData.title !== (ticket.title || '') ||
      editData.description !== (ticket.description || '') ||
      editData.status !== (ticket.status || 'todo') ||
      editData.ticket_type !== (ticket.ticket_type || 'task') ||
      editData.priority !== (ticket.priority || 'medium') ||
      editData.due_date !== (ticket.due_date || '') ||
      (editData.assignee || '') !== (ticket.assignee || '') ||
      !sameSubtasks ||
      !sameLinked
    setHasChanges(changed)
  }, [editData, ticket, ticketSubtasks, ticketLinkedIds])

  const loadComments = async () => {
    if (!ticket?.id || String(ticket.id).startsWith('temp-')) return
    setLoadingComments(true)
    try {
      const response = await commentsAPI.getAll(ticket.id)
      setComments(response.data.comments || [])
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    const text = newComment.trim()
    if (!text) return
    const isTempTicket = !ticket?.id || String(ticket.id).startsWith('temp-')
    if (isTempTicket) {
      setCommentError('Save the ticket first to add comments.')
      return
    }

    setCommentError('')
    setAddingComment(true)
    try {
      const response = await commentsAPI.create({
        ticket_id: String(ticket.id),
        text,
      })
      setComments(prev => [...prev, response.data.comment])
      setNewComment('')
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Failed to add comment. Try again.'
      setCommentError(msg)
      console.error('Error adding comment:', error)
    } finally {
      setAddingComment(false)
    }
  }

  const handleSaveChanges = async () => {
    if (!hasChanges) return
    if (!ticket?.id || String(ticket.id).startsWith('temp-')) return
    setSaving(true)
    try {
      await onUpdate(ticket.id, editData)
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleFieldChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  const handleAssignToMe = () => {
    if (user?.id) handleFieldChange('assignee', user.id)
  }

  const addSubtask = () => {
    const title = newSubtaskTitle.trim()
    if (!title) return
    const newSubtask = { id: crypto.randomUUID(), title, completed: false }
    setEditData(prev => ({ ...prev, subtasks: [...(prev.subtasks || []), newSubtask] }))
    setNewSubtaskTitle('')
  }

  const removeSubtask = (subtaskId) => {
    setEditData(prev => ({ ...prev, subtasks: (prev.subtasks || []).filter(s => s.id !== subtaskId) }))
  }

  const toggleSubtask = (subtaskId) => {
    setEditData(prev => ({
      ...prev,
      subtasks: (prev.subtasks || []).map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s),
    }))
  }

  const addLinkedTicket = (linkedId) => {
    if (linkedId === ticket.id) return
    setEditData(prev => ({
      ...prev,
      linked_ticket_ids: [...new Set([...(prev.linked_ticket_ids || []), linkedId])],
    }))
    setShowLinkDropdown(false)
  }

  const removeLinkedTicket = (linkedId) => {
    setEditData(prev => ({
      ...prev,
      linked_ticket_ids: (prev.linked_ticket_ids || []).filter(id => id !== linkedId),
    }))
  }

  const linkedTickets = (editData.linked_ticket_ids || []).map(id => projectTickets.find(t => t.id === id)).filter(Boolean)
  const availableToLink = projectTickets.filter(t => t.id !== ticket.id && !(editData.linked_ticket_ids || []).includes(t.id))

  return (
    <div className="detail-panel-overlay" onClick={onClose}>
      <div className="detail-panel jira-detail-panel" onClick={e => e.stopPropagation()}>
        {/* Header: project key / ticket key + actions */}
        <div className="detail-panel-header">
          <div className="detail-panel-breadcrumb jira-breadcrumb">
            <span className="type-badge-large" style={{ color: typeInfo.color }} title={typeInfo.label}>
              {typeInfo.icon}
            </span>
            <span className="ticket-key-badge">{projectKey}</span>
            <span className="breadcrumb-sep">/</span>
            <span className="ticket-key-badge">{ticketKey}</span>
          </div>
          <div className="detail-panel-actions">
            {hasChanges && (
              <button 
                className="btn btn-success save-btn" 
                onClick={handleSaveChanges}
                disabled={saving}
              >
                {saving ? <><span className="loading-spinner"></span> Saving...</> : <>💾 Save</>}
              </button>
            )}
            <button className="btn btn-icon" title="Share" type="button">⎘</button>
            <div className="detail-more-wrap">
              <button 
                className="btn btn-icon" 
                title="More" 
                type="button"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
              >
                ⋯
              </button>
              {showMoreMenu && (
                <div className="detail-more-menu">
                  <button type="button" className="detail-more-item danger" onClick={() => { setShowMoreMenu(false); setShowDeleteConfirm(true); }}>
                    Delete
                  </button>
                </div>
              )}
            </div>
            <button className="btn btn-icon" title="Close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="detail-panel-content">
          {/* Main content: title, description, subtasks, linked, activity */}
          <div className="detail-panel-main">
            <div className="detail-title-row">
              <input
                type="text"
                className="title-input-large"
                value={editData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Issue title"
              />
              <div className="detail-title-actions">
                <button type="button" className="btn btn-icon" title="Add">+</button>
                <button type="button" className="btn btn-icon">⋯</button>
              </div>
            </div>

            {/* Collapsible Description */}
            <div className="detail-section collapsible">
              <button 
                type="button" 
                className="detail-section-head"
                onClick={() => setDescOpen(!descOpen)}
              >
                <span className={`chevron ${descOpen ? 'open' : ''}`}>▾</span>
                <span>Description</span>
              </button>
              {descOpen && (
                <div className="detail-section-body">
                  <textarea
                    className="form-textarea description-textarea"
                    value={editData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Add a description..."
                    rows={5}
                  />
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div className="detail-section">
              <h3 className="detail-section-title">SUBTASKS</h3>
              <div className="subtasks-list">
                {(editData.subtasks || []).map(sub => (
                  <div key={sub.id} className="subtask-row">
                    <input
                      type="checkbox"
                      checked={!!sub.completed}
                      onChange={() => toggleSubtask(sub.id)}
                      className="subtask-checkbox"
                      aria-label={`Mark "${sub.title}" complete`}
                    />
                    <span className={`subtask-title ${sub.completed ? 'subtask-done' : ''}`}>{sub.title}</span>
                    <button type="button" className="btn btn-icon btn-ghost subtask-remove" onClick={() => removeSubtask(sub.id)} title="Remove subtask">✕</button>
                  </div>
                ))}
              </div>
              <div className="detail-add-inline">
                <input
                  type="text"
                  className="form-input detail-add-input"
                  placeholder="Add subtask"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                />
                <button type="button" className="btn btn-primary btn-sm" onClick={addSubtask} disabled={!newSubtaskTitle.trim()}>
                  Add
                </button>
              </div>
            </div>

            {/* Linked work items */}
            <div className="detail-section detail-linked-wrap">
              <h3 className="detail-section-title">LINKED WORK ITEMS</h3>
              <div className="linked-list">
                {linkedTickets.map(t => (
                  <div key={t.id} className="linked-item-row">
                    <span className="linked-item-key">{projectKey}-{t.ticket_number || t.id?.toString().slice(0, 8)}</span>
                    <span className="linked-item-title">{t.title}</span>
                    <button type="button" className="btn btn-icon btn-ghost" onClick={() => removeLinkedTicket(t.id)} title="Unlink">✕</button>
                  </div>
                ))}
              </div>
              <div className="detail-add-inline relative">
                <input
                  type="text"
                  className="form-input detail-add-input"
                  placeholder="Add linked work item"
                  readOnly
                  onFocus={() => setShowLinkDropdown(true)}
                />
                {showLinkDropdown && (
                  <>
                    <div className="dropdown-backdrop" onClick={() => setShowLinkDropdown(false)} aria-hidden />
                    <div className="linked-dropdown">
                      {availableToLink.length === 0 ? (
                        <div className="linked-dropdown-empty">No other tickets in this project</div>
                      ) : (
                        availableToLink.map(t => (
                          <button key={t.id} type="button" className="linked-dropdown-item" onClick={() => addLinkedTicket(t.id)}>
                            <span className="linked-item-key">{projectKey}-{t.ticket_number || t.id?.toString().slice(0, 8)}</span> {t.title}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Activity / Comments */}
            <div className="detail-section">
              <h3 className="detail-section-title">Activity</h3>
              <form onSubmit={handleAddComment} className="comment-form">
                <div className="comment-input-wrapper">
                  <div className="comment-avatar">{user?.email?.charAt(0).toUpperCase()}</div>
                  <input
                    type="text"
                    className="comment-input"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value)
                      if (commentError) setCommentError('')
                    }}
                    disabled={!ticket?.id || String(ticket.id).startsWith('temp-')}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={!newComment.trim() || addingComment || !ticket?.id || String(ticket.id).startsWith('temp-')}
                  >
                    {addingComment ? '...' : 'Send'}
                  </button>
                </div>
                {commentError && <p className="comment-form-error">{commentError}</p>}
              </form>
              <div className="comments-list">
                {loadingComments ? (
                  <div className="loading-small"><div className="loading-spinner"></div></div>
                ) : comments.length === 0 ? (
                  <p className="no-comments">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-avatar">{user?.email?.charAt(0).toUpperCase()}</div>
                      <div className="comment-body">
                        <div className="comment-header">
                          <span className="comment-author">{user?.email?.split('@')[0]}</span>
                          <span className="comment-time">
                            {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="comment-text">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar: Status prominent, then Details collapsible */}
          <div className="detail-panel-sidebar">
            <div className="detail-status-wrap">
              <select
                className="status-select status-select-prominent"
                value={editData.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Details collapsible */}
            <div className="detail-details-block">
              <button 
                type="button" 
                className="detail-details-head"
                onClick={() => setDetailsOpen(!detailsOpen)}
              >
                <span className={`chevron ${detailsOpen ? 'open' : ''}`}>▾</span>
                <span>Details</span>
                <span className="detail-details-cog">⚙</span>
              </button>
              {detailsOpen && (
                <div className="detail-details-body">
                  <div className="detail-field">
                    <label>Assignee</label>
                    <div className="assignee-block">
                      {isAssigned ? (
                        <div className="assignee-row">
                          <div className="assignee-avatar">
                            {(assigneeMember?.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="assignee-name">
                            {assigneeMember?.email || (editData.assignee?.slice(0, 8) + '…')}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="assignee-unassigned">
                            <span className="assignee-avatar empty">?</span>
                            <span>Unassigned</span>
                          </div>
                          <button type="button" className="link-assign-to-me" onClick={handleAssignToMe}>
                            Assign to me
                          </button>
                        </>
                      )}
                      <select
                        className="form-select assignee-select"
                        value={editData.assignee || ''}
                        onChange={(e) => handleFieldChange('assignee', e.target.value)}
                        title="Change assignee"
                      >
                        <option value="">Unassigned</option>
                        {members.map((m) => (
                          <option key={m.user_id} value={m.user_id}>{m.email || m.user_id}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="detail-field">
                    <label>Priority</label>
                    <select
                      className="form-select"
                      value={editData.priority}
                      onChange={(e) => handleFieldChange('priority', e.target.value)}
                    >
                      {PRIORITIES.map(p => (
                        <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="detail-field">
                    <label>Due date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editData.due_date}
                      onChange={(e) => handleFieldChange('due_date', e.target.value)}
                    />
                  </div>

                  <div className="detail-field">
                    <label>Type</label>
                    <select
                      className="form-select"
                      value={editData.ticket_type}
                      onChange={(e) => handleFieldChange('ticket_type', e.target.value)}
                    >
                      {TICKET_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="detail-field">
                    <label>Created</label>
                    <span className="detail-value">
                      {new Date(ticket.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="detail-field">
                    <label>Reporter</label>
                    <div className="assignee-row">
                      <div className="assignee-avatar">{user?.email?.charAt(0).toUpperCase()}</div>
                      <span className="detail-value">{user?.email?.split('@')[0]}</span>
                    </div>
                  </div>

                  {hasChanges && (
                    <button 
                      className="btn btn-success save-btn-full" 
                      onClick={handleSaveChanges}
                      disabled={saving || isTempTicket}
                      title={isTempTicket ? 'Wait for the ticket to finish creating' : (hasChanges ? 'Save your changes' : '')}
                    >
                      {saving ? <><span className="loading-spinner"></span> Saving...</> : <>💾 Save changes</>}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm">
              <h3>🗑️ Delete Issue</h3>
              <p>Are you sure you want to delete "{ticket.title}"?</p>
              <p className="warning-text">This action cannot be undone.</p>
              <div className="delete-confirm-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => onDelete(ticket.id)}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectDetail
