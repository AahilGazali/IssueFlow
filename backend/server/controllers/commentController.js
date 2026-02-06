const supabase = require('../config/supabaseClient');
const { createNotification } = require('./notificationController');

// Create a new comment
const createComment = async (req, res) => {
  try {
    const rawTicketId = req.body.ticket_id;
    const text = req.body.text;
    const userId = req.user.id;

    const ticket_id = rawTicketId != null ? String(rawTicketId).trim() : '';
    if (!ticket_id || !text) {
      return res.status(400).json({ error: 'ticket_id and text are required' });
    }

    // Reject client-only temp ids
    if (ticket_id.startsWith('temp-')) {
      return res.status(400).json({ error: 'Save the ticket first, then add a comment.' });
    }

    // Get the ticket to check project access and for notifications
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('project_id, title, assignee, created_by')
      .eq('id', ticket_id)
      .maybeSingle();

    if (ticketError) {
      console.error('Comment create: ticket lookup error', ticketError);
      const msg = ticketError.message || String(ticketError);
      return res.status(500).json({ error: `Could not load the ticket: ${msg}` });
    }

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found. It may have been deleted, or the backend cannot read the tickets table (try setting SUPABASE_SERVICE_ROLE_KEY in .env).',
      });
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

    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          ticket_id,
          user_id: userId,
          text,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const { data: proj } = await supabase.from('projects').select('title').eq('id', ticket.project_id).single();
    const projectTitle = proj?.title || 'Project';
    const notifyTitle = `New comment on "${ticket.title}" in ${projectTitle}`;
    const recipients = new Set([ticket.assignee, ticket.created_by].filter(Boolean));
    recipients.delete(userId);
    for (const recipientId of recipients) {
      await createNotification({
        recipient_id: recipientId,
        type: 'comment',
        title: notifyTitle,
        ticket_id,
        project_id: ticket.project_id,
        actor_id: userId,
      });
    }

    res.status(201).json({
      message: 'Comment created successfully',
      comment: data,
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

// Get all comments for a ticket
const getComments = async (req, res) => {
  try {
    const { ticket_id } = req.query;
    const userId = req.user.id;

    if (!ticket_id) {
      return res.status(400).json({ error: 'ticket_id query parameter is required' });
    }

    // Get the ticket to check project access
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('project_id')
      .eq('id', ticket_id)
      .single();

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

    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('ticket_id', ticket_id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      return res.status(400).json({ error: commentsError.message });
    }

    res.status(200).json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
};

// Get a single comment by ID
const getComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get the comment
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', id)
      .single();

    if (commentError || !comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Get the ticket to check project access
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('project_id')
      .eq('id', comment.ticket_id)
      .single();

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
      return res.status(403).json({ error: 'Access denied to this comment' });
    }

    res.status(200).json({ comment });
  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({ error: 'Failed to get comment' });
  }
};

// Update a comment
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    // Get the comment
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', id)
      .single();

    if (commentError || !comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user is the owner of the comment
    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'You can only update your own comments' });
    }

    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({ text })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.status(200).json({
      message: 'Comment updated successfully',
      comment: updatedComment,
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get the comment
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', id)
      .single();

    if (commentError || !comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user is the owner of the comment
    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    const { error: deleteError } = await supabase.from('comments').delete().eq('id', id);

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

module.exports = {
  createComment,
  getComments,
  getComment,
  updateComment,
  deleteComment,
};
