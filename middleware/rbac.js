import { ForbiddenError } from '../util/errors.util';

/**
 * Middleware factory to check if user has required privileges
 * @param requiredPrivileges - Array of privilege descriptions required to access the route
 * @returns Express middleware function
 */
export const requirePrivileges = (requiredPrivileges) => {
  return (req, res, next) => {
    try {
      // User should be attached by auth.middleware
      if (!req.user) {
        throw new ForbiddenError('User not authenticated');
      }

      const userPrivileges = req.user.privileges;

      // Check if user has all required privileges
      const hasAllPrivileges = requiredPrivileges.every((privilege) =>
        userPrivileges.includes(privilege)
      );

      if (!hasAllPrivileges) {
        throw new ForbiddenError('Insufficient privileges to access this resource');
      }

      next();
    } catch (error) {
      // Pass error to the next middleware
      next(error instanceof ForbiddenError ? error : new ForbiddenError('Access denied'));
    }
  };
};

/**
 * Middleware to check if user has at least one of the required privileges
 * @param requiredPrivileges - Array of privilege descriptions (user needs at least one)
 * @returns Express middleware function
 */
export const requireAnyPrivilege = (requiredPrivileges) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('User not authenticated');
      }

      const userPrivileges = req.user.privileges;

      // Check if user has at least one required privilege
      const hasAnyPrivilege = requiredPrivileges.some((privilege) =>
        userPrivileges.includes(privilege)
      );

      if (!hasAnyPrivilege) {
        throw new ForbiddenError('Insufficient privileges to access this resource');
      }

      next();
    } catch (error) {
      // Pass error to the next middleware
      next(error instanceof ForbiddenError ? error : new ForbiddenError('Access denied'));
    }
  };
};

/**
 * Middleware to check if user has the role
 * @param requiredRole - Role required to access the route
 * @returns Express middleware function
 */

export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('User not authenticated');
      }

      if (req.user.role !== requiredRole) {
        throw new ForbiddenError('Insufficient role to access this resource');
      }

      next();
    } catch (error) {
      next(error instanceof ForbiddenError ? error : new ForbiddenError('Access denied'));
      }
    }
  };