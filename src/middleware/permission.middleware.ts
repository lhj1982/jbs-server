import logger from '../utils/logger';
import { pp } from '../utils/stringUtil';
// middleware for doing role-based permissions
export default function permit(...allowed) {
  /**
   * If any of requested permission is not found in allowedPermissions, return false, otherwise, return true
   * @type {[type]}
   */
  const matchPermission = (requestedPermissions, allowedPermissions) => {
    for (let i = 0; i < requestedPermissions.length; i++) {
      const requestedPermission = requestedPermissions[i];
      if (allowedPermissions.indexOf(requestedPermission) == -1) {
        return false;
      }
    }
    return true;
  };

  /**
   * Normalize permission data into a flat array
   * Example indata
   * [ { domain: 'user', operations: [ 'read' ] },
  { domain: 'event', operations: [ 'read' ] } ]

   * @type {[type]}
   */
  const normalizePermissions = data => {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      const permission = data[i];
      const { domain, operations } = permission;
      for (let j = 0; j < operations.length; j++) {
        result.push(domain + '_' + operations[j]);
      }
    }
    return result;
  };

  const getAllowedPermissions = roles => {
    try {
      const result = [];

      for (let i = 0; i < roles.length; i++) {
        const permissions = roles[i].permissions;
        for (let j = 0; j < permissions.length; j++) {
          result.push(permissions[j]);
        }
      }
      const allowedPermissions = [];
      for (let i = 0; i < result.length; i++) {
        const permission = result[i];
        const { domain, operations } = permission;
        for (let j = 0; j < operations.length; j++) {
          allowedPermissions.push(domain + '_' + operations[j]);
        }
      }
      return allowedPermissions;
    } catch (err) {
      console.error(err);
    }
  };

  const isAllowed = allowedPermissions => {
    const requestedPermissions = normalizePermissions(allowed);
    return matchPermission(requestedPermissions, allowedPermissions);
  };

  // return a middleware
  return (req, res, next) => {
    const loggedInUser = res.locals.loggedInUser;
    const { roles } = loggedInUser;
    const allowedPermissions = getAllowedPermissions(roles);
    if (loggedInUser && isAllowed(allowedPermissions)) {
      next(); // role is allowed, so continue on the next middleware
    } else {
      logger.warn(`You are not allowed to perform action ${pp(allowed)}`);
      res.status(403).json({ message: 'Forbidden' }); // user is forbidden
    }
  };
}
