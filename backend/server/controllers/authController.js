const supabase = require('../config/supabaseClient');

// Register a new user
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Reject email if the part before @ is only numbers
    const localPart = email.split('@')[0] || '';
    if (/^\d+$/.test(localPart)) {
      return res.status(400).json({
        error: 'Email must contain at least one letter before @ (e.g. user1@example.com, not numbers only).',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable email confirmation redirect for now
      }
    });

    if (error) {
      console.error('Supabase registration error:', error);
      // Handle specific Supabase errors
      if (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('too many')) {
        return res.status(429).json({ 
          error: 'Too many registration attempts. Please wait 5-10 minutes before trying again, or try a different email address.' 
        });
      }
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
        return res.status(409).json({ 
          error: 'This email is already registered. Please login instead.' 
        });
      }
      return res.status(400).json({ error: error.message });
    }

    // Check if user was created (Supabase might require email confirmation)
    if (!data.user) {
      return res.status(400).json({ 
        error: 'Registration failed. Please check your email for confirmation or try again.' 
      });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again later.' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.status(200).json({
      message: 'Login successful',
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get current user (fetch from DB when service role is available so user_metadata is up to date)
const getCurrentUser = async (req, res) => {
  try {
    let user = req.user;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && req.user?.id) {
      const { data: { user: freshUser }, error } = await supabase.auth.admin.getUserById(req.user.id);
      if (!error && freshUser) user = freshUser;
    }
    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Update password (requires current password; uses service role for update)
const updatePassword = async (req, res) => {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(503).json({
        error: 'Changing password is not configured. Add SUPABASE_SERVICE_ROLE_KEY to your backend .env file (Supabase Dashboard → Settings → API → service_role key), then restart the server.',
      });
    }

    const { current_password, new_password } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Verify current password by signing in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: current_password,
    });

    if (signInError) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update to new password (requires service role key)
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: new_password,
    });

    if (updateError) {
      console.error('Update password error:', updateError);
      const msg = updateError.message || '';
      const needsServiceRole = /user not allowed|forbidden|insufficient|service_role|admin/i.test(msg);
      return res.status(400).json({
        error: needsServiceRole
          ? 'Changing password requires the Supabase service role key. Add SUPABASE_SERVICE_ROLE_KEY to your backend .env (Supabase Dashboard → Settings → API → service_role), then restart the server.'
          : (msg || 'Failed to update password.'),
      });
    }

    res.status(200).json({ message: 'Password updated successfully. Please sign in again with your new password.' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
};

// Allowed notification preference keys (boolean only)
const NOTIFICATION_KEYS = [
  'email_on_assign',
  'email_on_comment',
  'email_digest',
];

// Update profile (display name + notification_preferences in user_metadata; requires service role)
const updateProfile = async (req, res) => {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(503).json({
        error: 'Changing profile is not configured. Add SUPABASE_SERVICE_ROLE_KEY to your backend .env file (Supabase Dashboard → Settings → API → service_role key), then restart the server.',
      });
    }

    const { display_name, notification_preferences } = req.body;
    const userId = req.user.id;
    const existingMeta = req.user.user_metadata || {};
    const updates = { ...existingMeta };

    if (display_name !== undefined) {
      const name = typeof display_name === 'string' ? display_name.trim() : '';
      if (name.length > 100) {
        return res.status(400).json({ error: 'Display name must be 100 characters or less' });
      }
      updates.display_name = name || undefined;
    }

    if (notification_preferences !== undefined) {
      if (typeof notification_preferences !== 'object' || notification_preferences === null) {
        return res.status(400).json({ error: 'notification_preferences must be an object' });
      }
      const prefs = {};
      for (const key of NOTIFICATION_KEYS) {
        if (key in notification_preferences) {
          prefs[key] = Boolean(notification_preferences[key]);
        }
      }
      updates.notification_preferences = { ...(existingMeta.notification_preferences || {}), ...prefs };
    }

    if (Object.keys(updates).length === Object.keys(existingMeta).length &&
        JSON.stringify(updates) === JSON.stringify(existingMeta)) {
      return res.status(400).json({ error: 'Nothing to update. Send display_name and/or notification_preferences.' });
    }

    const { data: updatedUser, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: updates,
    });

    if (error) {
      console.error('Update profile error:', error);
      const msg = error.message || '';
      const needsServiceRole = /user not allowed|forbidden|insufficient|service_role|admin/i.test(msg);
      return res.status(400).json({
        error: needsServiceRole
          ? 'Updating profile requires the Supabase service role key. Add SUPABASE_SERVICE_ROLE_KEY to your backend .env (Supabase Dashboard → Settings → API → service_role), then restart the server.'
          : (msg || 'Failed to update profile.'),
      });
    }

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser?.user || req.user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
  updatePassword,
  updateProfile,
};
