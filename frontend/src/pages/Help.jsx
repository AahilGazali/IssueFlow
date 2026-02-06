import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import '../App.css'

const Help = () => {
  const navigate = useNavigate()

  return (
    <>
      <Sidebar />
      <main className="main-content help-page">
        <header className="help-header">
          <h1 className="help-title">Help & Support</h1>
          <p className="help-subtitle">Find answers and get support for IssueFlow.</p>
        </header>

        <div className="help-sections">
          <section className="help-section">
            <h2 className="help-section-title">Getting started</h2>
            <div className="help-card">
              <h3>Create a project</h3>
              <p>From the Dashboard, click <strong>New Project</strong> or use the quick action. Give your project a title and optional description.</p>
              <h3>Add issues (tasks)</h3>
              <p>Open a project, then use <strong>Create</strong> on the board to add issues. You can drag issues between columns to update status.</p>
              <h3>Invite team members</h3>
              <p>As project creator (admin), open a project and click <strong>Team</strong> in the top bar. Enter a teammate&apos;s email to invite them.</p>
            </div>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Keyboard & shortcuts</h2>
            <div className="help-card">
              <p>Use the sidebar to jump to <strong>Dashboard</strong>, <strong>Projects</strong>, <strong>My Tasks</strong>, or <strong>Members</strong>. Click your profile for Settings and account options.</p>
            </div>
          </section>

          <section className="help-section">
            <h2 className="help-section-title">Contact support</h2>
            <div className="help-card">
              <p>For technical issues or feature requests, contact your administrator or use your organization&apos;s support channel.</p>
              <button type="button" className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default Help
