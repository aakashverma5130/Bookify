/**
 * Role-based access control middleware factory.
 *
 * Usage:
 *   router.post('/sensitive', authenticate, requireRole('HEAD_LIBRARIAN'), handler);
 *   router.get('/shared',     authenticate, requireRole('HEAD_LIBRARIAN', 'ASSISTANT_LIBRARIAN'), handler);
 *
 * @param {...string} roles - Allowed roles
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`
    });
  }
  next();
};

// Convenience role groups
const LIBRARIAN_ROLES = ['HEAD_LIBRARIAN', 'ASSISTANT_LIBRARIAN'];
const HEAD_ONLY = ['HEAD_LIBRARIAN'];
const STUDENT_ONLY = ['STUDENT'];

module.exports = { requireRole, LIBRARIAN_ROLES, HEAD_ONLY, STUDENT_ONLY };
