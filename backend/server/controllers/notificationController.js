const supabase = require('../config/supabaseClient');

/**
 * Create a notification (call from ticket/comment controllers).
 * @param {object} opts - { recipient_id, type: 'assigned'|'comment', title, ticket_id?, project_id?, actor_id? }
 */
const createNotification = async (opts) => {
  const { recipient_id, type, title, ticket_id, project_id, actor_id } = opts;
  if (!recipient_id || !type || !title) return;
  try {
    await supabase.from('notifications').insert([
      {
        user_id: recipient_id,
        type,
        title,
        metadata: { ticket_id: ticket_id || null, project_id: project_id || null, actor_id: actor_id || null },
      },
    ]);
  } catch (err) {
    console.error('Create notification error:', err);
  }
};

// List notifications for current user
const list = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, read, created_at, metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(Math.min(Number(limit) || 50, 100));

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const unreadCount = (data || []).filter((n) => !n.read).length;
    res.status(200).json({ notifications: data || [], unread_count: unreadCount });
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json({ error: 'Failed to list notifications' });
  }
};

// Unread count only (lightweight)
const unreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(200).json({ unread_count: count ?? 0 });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

const markRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(200).json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

const markAllRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(200).json({ message: 'All marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
};

module.exports = {
  createNotification,
  list,
  unreadCount,
  markRead,
  markAllRead,
};
