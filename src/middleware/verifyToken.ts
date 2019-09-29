import { AuthorizationException, ResourceNotFoundException } from '../exceptions/custom.exceptions';
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
    const userId = decoded.sub;
    // console.log(decoded);
    // check if a user exists
    try {
      const user = await UsersRepo.findById(userId);
      res.locals.loggedInUser = user;
      return next();
    } catch (err) {
      next(new ResourceNotFoundException(`User`, `${userId}`));
      return;
    }
  });
};

export { verifyToken };
