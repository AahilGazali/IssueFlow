const supabase = require('../config/supabaseClient');

// Create a new project
const createProject = async (req, res) => {
  try {
    const { title, description, project_key } = req.body;
    const userId = req.user.id;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Generate project key if not provided
    const key = project_key || title.substring(0, 3).toUpperCase();

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          title,
          description: description || null,
          created_by: userId,
          project_key: key,
        },
      ])
      .select()
      .single();

    if (error) {
      // Fallback without project_key if column doesn't exist
      if (error.message.includes('column')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('projects')
          .insert([
            {
              title,
              description: description || null,
              created_by: userId,
            },
          ])
          .select()
          .single();

        if (fallbackError) {
          return res.status(400).json({ error: fallbackError.message });
        }

        // Add creator as a project member (required for access)
        const { error: memberErr } = await supabase.from('project_members').insert([
          { project_id: fallbackData.id, user_id: userId },
        ]);
        if (memberErr) {
          await supabase.from('projects').delete().eq('id', fallbackData.id);
          return res.status(500).json({ error: 'Project created but failed to add you as member. Please try again.' });
        }
        return res.status(201).json({
          message: 'Project created successfully',
          project: fallbackData,
        });
      }
      return res.status(400).json({ error: error.message });
    }

    // Add creator as a project member (required for access)
    const { error: memberErr } = await supabase.from('project_members').insert([
      { project_id: data.id, user_id: userId },
    ]);
    if (memberErr) {
      await supabase.from('projects').delete().eq('id', data.id);
      return res.status(500).json({ error: 'Project created but failed to add you as member. Please try again.' });
    }
    res.status(201).json({
      message: 'Project created successfully',
      project: data,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

// Get all projects for the authenticated user
const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get projects where user is a member
    const { data: memberProjects, error: memberError } = await supabase
      .from('project_members')
      .select('project_id, is_starred')
      .eq('user_id', userId);

    if (memberError) {
      return res.status(400).json({ error: memberError.message });
    }

    const projectIds = memberProjects.map((mp) => mp.project_id);

    if (projectIds.length === 0) {
      return res.status(200).json({ projects: [] });
    }

    let { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (projectsError && projectsError.message && (projectsError.message.includes('column') || projectsError.message.includes('deleted_at'))) {
      const fallback = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .order('created_at', { ascending: false });
      projects = fallback.data || [];
      projectsError = fallback.error;
    }

    if (projectsError) {
      return res.status(400).json({ error: projectsError.message });
    }

    projects = projects || [];

    // Add starred status to projects
    const projectsWithStarred = projects.map(project => {
      const memberInfo = memberProjects.find(mp => mp.project_id === project.id);
      return {
        ...project,
        is_starred: memberInfo?.is_starred || false
      };
    });

    res.status(200).json({ projects: projectsWithStarred });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
};

// Get a single project by ID
const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Fetch project first (to allow creator access even if not in project_members)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.deleted_at) {
      return res.status(404).json({ error: 'Project is in trash. Restore it from Trash first.' });
    }

    // Check if user is a member of the project
    let { data: member, error: memberError } = await supabase
      .from('project_members')
      .select('project_id, is_starred')
      .eq('project_id', id)
      .eq('user_id', userId)
      .single();

    // If not a member but user is the creator, add them as member (fixes legacy or failed inserts)
    if ((memberError || !member) && project.created_by === userId) {
      await supabase.from('project_members').insert([
        { project_id: id, user_id: userId },
      ]);
      member = { project_id: id, is_starred: false };
    }

    if (!member) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    // Get project members count
    const { count: memberCount } = await supabase
      .from('project_members')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id);

    // Get ticket count
    const { count: ticketCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id);

    res.status(200).json({
      project: {
        ...project,
        is_starred: member.is_starred || false,
        member_count: memberCount || 1,
        ticket_count: ticketCount || 0
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
};

// Update a project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, project_key } = req.body;
    const userId = req.user.id;

    // Check if user is a member of the project
    const { data: member, error: memberError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('project_id', id)
      .eq('user_id', userId)
      .single();

    if (memberError || !member) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (project_key !== undefined) updateData.project_key = project_key;

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (projectError) {
      return res.status(400).json({ error: projectError.message });
    }

    res.status(200).json({
      message: 'Project updated successfully',
      project,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

// Soft delete a project (move to trash; creator can restore later)
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('created_by')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.created_by !== userId) {
      return res.status(403).json({ error: 'Only the project creator can delete the project' });
    }

    const deletedAt = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from('projects')
      .update({ deleted_at: deletedAt })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.message && (updateError.message.includes('column') || updateError.message.includes('deleted_at'))) {
        return res.status(400).json({
          error: 'Trash is not set up. Run in Supabase SQL: ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;',
        });
      }
      return res.status(400).json({ error: updateError.message });
    }

    res.status(200).json({ message: 'Project moved to trash', project: updated });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

// Get deleted projects (creator only)
const getDeletedProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: allByCreator, error } = await supabase
      .from('projects')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const projects = (allByCreator || []).filter((p) => p.deleted_at != null);
    projects.sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));

    res.status(200).json({ projects });
  } catch (error) {
    console.error('Get deleted projects error:', error);
    res.status(500).json({ error: 'Failed to get deleted projects' });
  }
};

// Restore a project from trash
const restoreProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('created_by, deleted_at')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.created_by !== userId) {
      return res.status(403).json({ error: 'Only the project creator can restore the project' });
    }

    if (!project.deleted_at) {
      return res.status(400).json({ error: 'Project is not in trash' });
    }

    const { error: updateError } = await supabase
      .from('projects')
      .update({ deleted_at: null })
      .eq('id', id);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.status(200).json({ message: 'Project restored' });
  } catch (error) {
    console.error('Restore project error:', error);
    res.status(500).json({ error: 'Failed to restore project' });
  }
};

// Permanently delete a project (only when already in trash)
const permanentDeleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('created_by, deleted_at')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.created_by !== userId) {
      return res.status(403).json({ error: 'Only the project creator can permanently delete the project' });
    }

    if (!project.deleted_at) {
      return res.status(400).json({ error: 'Move project to trash first, then you can delete it permanently.' });
    }

    const { data: tickets } = await supabase
      .from('tickets')
      .select('id')
      .eq('project_id', id);

    if (tickets && tickets.length > 0) {
      for (const ticket of tickets) {
        await supabase.from('comments').delete().eq('ticket_id', ticket.id);
      }
      await supabase.from('tickets').delete().eq('project_id', id);
    }

    await supabase.from('project_members').delete().eq('project_id', id);

    const { error: deleteError } = await supabase.from('projects').delete().eq('id', id);

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    res.status(200).json({ message: 'Project permanently deleted' });
  } catch (error) {
    console.error('Permanent delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

// Invite a member to a project by email (admin/creator only)
const inviteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const userId = req.user.id;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Check project exists and current user is the creator (admin)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.created_by !== userId) {
      return res.status(403).json({ error: 'Only the project creator (admin) can invite members' });
    }

    // Look up user by email via Auth Admin API (requires SUPABASE_SERVICE_ROLE_KEY)
    let foundUser = null;
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
        page,
        per_page: perPage,
      });
      if (listError) {
        console.error('Auth admin listUsers error:', listError);
        return res.status(500).json({ error: 'Could not look up user by email. Ensure SUPABASE_SERVICE_ROLE_KEY is set.' });
      }
      const users = listData?.users || [];
      foundUser = users.find((u) => u.email && u.email.toLowerCase() === normalizedEmail);
      if (foundUser || users.length < perPage) break;
      page++;
    }

    if (!foundUser) {
      return res.status(404).json({ error: 'No user found with this email. They must register first.' });
    }

    const inviteUserId = foundUser.id;

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', id)
      .eq('user_id', inviteUserId)
      .single();

    if (existingMember) {
      return res.status(400).json({ error: 'This user is already a member of the project' });
    }

    const { data, error } = await supabase
      .from('project_members')
      .insert([{ project_id: id, user_id: inviteUserId }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Member invited successfully',
      member: { ...data, email: foundUser.email },
    });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ error: 'Failed to invite member' });
  }
};

// Add a member to a project (admin/creator only when adding by user_id)
const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    const userId = req.user.id;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Check project and that current user is the creator (admin)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.created_by !== userId) {
      return res.status(403).json({ error: 'Only the project creator (admin) can add members' });
    }

    // Check if current user is a member of the project (creator is auto-added)
    const { data: member, error: memberError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('project_id', id)
      .eq('user_id', userId)
      .single();

    if (memberError || !member) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', id)
      .eq('user_id', user_id)
      .single();

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }

    const { data, error } = await supabase
      .from('project_members')
      .insert([
        {
          project_id: id,
          user_id,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Member added successfully',
      member: data,
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

// Toggle star/favorite for a project
const toggleStar = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get current star status
    const { data: member, error: memberError } = await supabase
      .from('project_members')
      .select('id, is_starred')
      .eq('project_id', id)
      .eq('user_id', userId)
      .single();

    if (memberError || !member) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    const newStarred = !member.is_starred;

    const { error: updateError } = await supabase
      .from('project_members')
      .update({ is_starred: newStarred })
      .eq('id', member.id);

    if (updateError) {
      // If column doesn't exist, return success anyway
      if (updateError.message.includes('column')) {
        return res.status(200).json({ 
          message: 'Star status updated',
          is_starred: newStarred 
        });
      }
      return res.status(400).json({ error: updateError.message });
    }

    res.status(200).json({ 
      message: newStarred ? 'Project starred' : 'Project unstarred',
      is_starred: newStarred 
    });
  } catch (error) {
    console.error('Toggle star error:', error);
    res.status(500).json({ error: 'Failed to update star status' });
  }
};

// Get project members (with email from Auth when using service role)
const getMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is a member
    const { data: member } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('project_id', id)
      .eq('user_id', userId)
      .single();

    if (!member) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: rows, error } = await supabase
      .from('project_members')
      .select('user_id, is_starred, created_at')
      .eq('project_id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Enrich with email from Auth (requires service role key)
    const members = await Promise.all(
      (rows || []).map(async (row) => {
        let email = null;
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(row.user_id);
          if (userData?.user) {
            email = userData.user.email || undefined;
          }
        } catch (_) {
          // ignore; email stays null if no service role or user not found
        }
        return { ...row, email };
      })
    );

    res.status(200).json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to get project members' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getDeletedProjects,
  restoreProject,
  permanentDeleteProject,
  addMember,
  inviteMember,
  toggleStar,
  getMembers,
};
