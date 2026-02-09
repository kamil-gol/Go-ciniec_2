/**
 * Role-Based Access Control Middleware
 * Restrict access based on user roles
 */
/**
 * Middleware to check if user has required role
 */
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user is authenticated
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }
        // Check if user has required role
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
            return;
        }
        next();
    };
};
/**
 * Shorthand for ADMIN only access
 */
export const requireAdmin = requireRole('ADMIN');
/**
 * Shorthand for ADMIN or EMPLOYEE access
 */
export const requireStaff = requireRole('ADMIN', 'EMPLOYEE');
//# sourceMappingURL=roles.js.map