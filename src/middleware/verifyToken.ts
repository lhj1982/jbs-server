import { AuthorizationException, ResourceNotFoundException, AccessDeinedException } from '../exceptions/custom.exceptions';
import UsersRepo from '../repositories/users.repository';
import config from '../config';
const jwt = require('jsonwebtoken');

/**
 *  The Auth Checker middleware function.
 */
const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    next(new AuthorizationException(`${req.headers.authorization}`));
    return;
    // return res.status(401).end();
  }
  // get the last part from a authorization header string like "bearer token-value"
  const token = req.headers.authorization.split(' ')[1];
  // decode the token using a secret key-phrase
  return jwt.verify(token, config.jwt.secret, async (err, decoded) => {
    // the 401 code is for unauthorized status
    if (err) {
      next(new AuthorizationException(`${token}`));
      return;
      // return res.status(401).end();
    }
    const { sub: userId, iat: issuedAt, exp: expiredAt } = decoded;
    // console.log(decoded);
    // check if a user exists
    res.locals.tokenIssuedAt = issuedAt;
    res.locals.tokenExpiredAt = expiredAt;
    try {
      const user = await UsersRepo.findById(userId);
      const { status } = user;
      if (status === 'blocked') {
        next(new AccessDeinedException(userId, `User is blocked`));
        return;
      }
      if (status != 'active') {
        next(new AccessDeinedException(userId, `User is not active`));
        return;
      }
      res.locals.loggedInUser = user;
      return next();
    } catch (err) {
      next(new ResourceNotFoundException(`User`, `${userId}`));
      return;
    }
  });
};

export { verifyToken };
