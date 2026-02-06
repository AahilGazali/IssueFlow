const supabase = require('../config/supabaseClient');
const { createNotification } = require('./notificationController');

// Create a new ticket
const createTicket = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      priority, 
      status, 
      assignee, 
      project_id,
      ticket_type,
      labels,
      due_date,
      story_points
    } = req.body;
    const userId = req.user.id;

    if (!title || !project_id) {
      return res.status(400).json({ error: 'Title and project_id are required' });
    }

    const validPriorities = ['lowest', 'low', 'medium', 'high', 'highest'];
    const safePriority = priority && validPriorities.includes(priority) ? priority : 'medium';

    // Validate status
    const validStatuses = ['todo', 'in_progress', 'in_review', 'done'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Validate ticket type
    const validTypes = ['bug', 'task', 'feature', 'improvement', 'epic'];
    if (ticket_type && !validTypes.includes(ticket_type)) {
      return res.status(400).json({ error: 'Invalid ticket type' });
    }

    // Check if user is a member of the project
    const { data: member, error: memberError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('project_id', project_id)
      .eq('user_id', userId)
      .single();

    if (memberError || !member) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    // Get ticket count for project to generate ticket number
    const { count } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', project_id);

    const ticketNumber = (count || 0) + 1;

    const { data, error } = await supabase
      .from('tickets')
      .insert([
        {
          title,
          description: description || null,
          priority: safePriority,
          status: status || 'todo',
          assignee: assignee || null,
          project_id,
          ticket_type: ticket_type || 'task',
          labels: labels || [],
          due_date: due_date || null,
          story_points: story_points || null,
          ticket_number: ticketNumber,
          created_by: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      // If column doesn't exist, try without new fields (skip notification)
      if (error.message.includes('column')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('tickets')
          .insert([
            {
              title,
              description: description || null,
              priority: safePriority,
              status: status || 'todo',
              assignee: assignee || null,
              project_id,
            },
          ])
          .select()
          .single();

        if (fallbackError) {
          return res.status(400).json({ error: fallbackError.message });
        }

        return res.status(201).json({
          message: 'Ticket created successfully',
          ticket: fallbackData,
        });
      }
      return res.status(400).json({ error: error.message });
    }

    if (assignee && assignee !== userId) {
      const { data: proj } = await supabase.from('projects').select('title').eq('id', project_id).single();
      const projectTitle = proj?.title || 'Project';
      await createNotification({
        recipient_id: assignee,
        type: 'assigned',
        title: `You were assigned to "${data.title}" in ${projectTitle}`,
        ticket_id: data.id,
        project_id,
        actor_id: userId,
      });
    }

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket: data,
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
};

// Get all tickets for a project
const getTickets = async (req, res) => {
  try {
    const { project_id, status, priority, ticket_type, assignee } = req.query;
    const userId = req.user.id;

    if (!project_id) {
      return res.status(400).json({ error: 'project_id query parameter is required' });
    }

    // Check if user is a member of the project
    const { data: member, error: memberError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('project_id', project_id)
      .eq('user_id', userId)
      .single();

    if (memberError || !member) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    let query = supabase
      .from('tickets')
      .select('*')
      .eq('project_id', project_id);

    // Apply filters
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (ticket_type) query = query.eq('ticket_type', ticket_type);
    if (assignee) query = query.eq('assignee', assignee);

    const { data: tickets, error: ticketsError } = await query.order('created_at', { ascending: false });

    if (ticketsError) {
      return res.status(400).json({ error: ticketsError.message });
    }

    res.status(200).json({ tickets });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to get tickets' });
  }
};

// Get a single ticket by ID
const getTicket = async (req, res) => {
  try {
    const id = (req.params.id || '').toString().trim();
    const userId = req.user.id;

    if (!id || id.length < 10) {
      return res.status(400).json({ error: 'Invalid ticket id' });
    }

    // Get the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (ticketError) {
      console.error('Get ticket DB error:', ticketError);
      return res.status(500).json({ error: 'Failed to get ticket' });
    }
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if user is a member of the project
    const { data: member, error: memberError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('project_id', ticket.project_id)
      .eq('user_id', userId)
      .single();

    if (memberError || !member) {
      return res.status(403).json({ error: 'Access denied to this ticket' });
    }

    res.status(200).json({ ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
};

// Update a ticket
const updateTicket = async (req, res) => {
  try {
    const id = (req.params.id || '').toString().trim();
    const { 
      title, 
      description, 
      priority, 
      status, 
      assignee,
      ticket_type,
      labels,
      due_date,
      story_points,
      subtasks,
      linked_ticket_ids
    } = req.body;
    const userId = req.user.id;

    if (!id || id.length < 10) {
      return res.status(400).json({ error: 'Invalid ticket id' });
    }

    // Get the ticket first to check project access (and title/assignee for notifications)
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('project_id, title, assignee')
      .eq('id', id)
      .maybeSingle();

    if (ticketError) {
      console.error('Update ticket lookup error:', ticketError);
      return res.status(500).json({ error: 'Failed to update ticket' });
    }
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if user is a member of the project
    const { data: member, error: memberError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('project_id', ticket.project_id)
      .eq('user_id', userId)
      .single();

    if (memberError || !member) {
      return res.status(403).json({ error: 'Access denied to this ticket' });
    }

    const validPriorities = ['lowest', 'low', 'medium', 'high', 'highest'];
    const safePriority = priority !== undefined && validPriorities.includes(priority) ? priority : (priority !== undefined ? 'medium' : undefined);

    // Validate status if provided
    const validStatuses = ['todo', 'in_progress', 'in_review', 'done'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (safePriority !== undefined) updateData.priority = safePriority;
    if (status !== undefined) updateData.status = status;
    if (assignee !== undefined) updateData.assignee = assignee;
    if (ticket_type !== undefined) updateData.ticket_type = ticket_type;
    if (labels !== undefined) updateData.labels = labels;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (story_points !== undefined) updateData.story_points = story_points;
    if (subtasks !== undefined && Array.isArray(subtasks)) updateData.subtasks = subtasks;
    if (linked_ticket_ids !== undefined && Array.isArray(linked_ticket_ids)) updateData.linked_ticket_ids = linked_ticket_ids;
    updateData.updated_at = new Date().toISOString();

    let { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    // If a column is missing (e.g. ticket_type, due_date, assignee), retry with core columns only
    if (updateError && updateError.message && (
      updateError.message.includes('column') || updateError.message.includes('schema cache')
    )) {
      const fallbackData = {};
      if (title !== undefined) fallbackData.title = title;
      if (description !== undefined) fallbackData.description = description;
      if (safePriority !== undefined) fallbackData.priority = safePriority;
      if (status !== undefined) fallbackData.status = status;
      if (Object.keys(fallbackData).length > 0) {
        const result = await supabase
          .from('tickets')
          .update(fallbackData)
          .eq('id', id)
          .select()
          .single();
        updatedTicket = result.data;
        updateError = result.error;
      }
    }

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    if (assignee !== undefined && assignee !== ticket.assignee && assignee && assignee !== userId) {
      const ticketTitle = updatedTicket?.title ?? ticket.title;
      const { data: proj } = await supabase.from('projects').select('title').eq('id', ticket.project_id).single();
      const projectTitle = proj?.title || 'Project';
      await createNotification({
        recipient_id: assignee,
        type: 'assigned',
        title: `You were assigned to "${ticketTitle}" in ${projectTitle}`,
        ticket_id: id,
        project_id: ticket.project_id,
        actor_id: userId,
      });
    }

    res.status(200).json({
      message: 'Ticket updated successfully',
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
};

// Delete a ticket
const deleteTicket = async (req, res) => {
  try {
    const id = (req.params.id || '').toString().trim();
    const userId = req.user.id;

    if (!id || id.length < 10) {
      return res.status(400).json({ error: 'Invalid ticket id' });
    }

    // Get the ticket first to check project access
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('project_id')
      .eq('id', id)
      .maybeSingle();

    if (ticketError || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check if user is a member of the project
    const { data: member, error: memberError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('project_id', ticket.project_id)
      .eq('user_id', userId)
      .single();

    if (memberError || !member) {
      return res.status(403).json({ error: 'Access denied to this ticket' });
    }

    // Delete comments first (cascade)
    await supabase.from('comments').delete().eq('ticket_id', id);

    // Delete the ticket
    const { error: deleteError } = await supabase.from('tickets').delete().eq('id', id);

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
};

// Get ticket statistics for a project
const getTicketStats = async (req, res) => {
  try {
    const { project_id } = req.query;
    const userId = req.user.id;

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    // Check if user is a member
    const { data: member } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('project_id', project_id)
      .eq('user_id', userId)
      .single();

    if (!member) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: tickets } = await supabase
      .from('tickets')
      .select('status, priority, ticket_type')
      .eq('project_id', project_id);

    const stats = {
      total: tickets?.length || 0,
      byStatus: {
        todo: tickets?.filter(t => t.status === 'todo').length || 0,
        in_progress: tickets?.filter(t => t.status === 'in_progress').length || 0,
        in_review: tickets?.filter(t => t.status === 'in_review').length || 0,
        done: tickets?.filter(t => t.status === 'done').length || 0,
      },
      byPriority: {
        highest: tickets?.filter(t => t.priority === 'highest').length || 0,
        high: tickets?.filter(t => t.priority === 'high').length || 0,
        medium: tickets?.filter(t => t.priority === 'medium').length || 0,
        low: tickets?.filter(t => t.priority === 'low').length || 0,
        lowest: tickets?.filter(t => t.priority === 'lowest').length || 0,
      },
      byType: {
        bug: tickets?.filter(t => t.ticket_type === 'bug').length || 0,
        task: tickets?.filter(t => t.ticket_type === 'task').length || 0,
        feature: tickets?.filter(t => t.ticket_type === 'feature').length || 0,
        improvement: tickets?.filter(t => t.ticket_type === 'improvement').length || 0,
        epic: tickets?.filter(t => t.ticket_type === 'epic').length || 0,
      }
    };

    res.status(200).json({ stats });
  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({ error: 'Failed to get ticket statistics' });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  getTicketStats,
};
