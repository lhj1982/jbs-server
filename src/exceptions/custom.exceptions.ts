import HttpException from './http.exception';

class AuthorizationException extends HttpException {
  constructor(token: string) {
    super(401, 'unauthorized', `Authorization failed, token: ${token}`);
  }
}

class WrongCredentialException extends HttpException {
  constructor(username: string, password: string) {
    super(401, 'unauthorized', `Wrong login credential, ${username}, ${password}`);
  }
}

class AccessDeinedException extends HttpException {
  constructor(id: string, message = '') {
    if (message) {
      super(403, 'access_denied', `${message}, id: ${id}`);
    } else {
      super(403, 'access_denied', `You are not allowed to perform this action, id: ${id}`);
    }
  }
}

class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id: string) {
    super(404, `${resource.toLowerCase()}_not_found`, `${resource} is not found, id: ${id}`);
  }
}

class InvalidRequestException extends HttpException {
  constructor(service: string, attributes: string[]) {
    super(400, `invalid_request`, `Invalid request for attribute(s) ${attributes} in ${service}`);
  }
}

class ResourceAlreadyExist extends HttpException {
  constructor(resource: string, key: string) {
    super(500, '${resource.toLowerCase()}_already_exist', `Resource ${resource} with key ${key} is already exist`);
  }
}

class UserIsBlacklistedException extends HttpException {
  constructor(eventId: string, userId: string) {
    super(500, 'user_is_blacklisted', `User ${userId} is blacklisted in event ${eventId}`);
  }
}

class EventIsFullBookedException extends HttpException {
  constructor(key: string) {
    super(500, 'event_fully_booked', `Event ${key} is fully booked`);
  }
}

class EventCannotCompleteException extends HttpException {
  constructor(key: string) {
    super(500, 'event_cannot_complete', `Event ${key} cannot complete, it's either not fully booked or paid`);
  }
}

class EventCannotCancelException extends HttpException {
  constructor(id: string) {
    super(500, 'event_cannot_cancel', `Event ${id} cannot cancel`);
  }
}

export {
  AuthorizationException,
  WrongCredentialException,
  AccessDeinedException,
  ResourceNotFoundException,
  InvalidRequestException,
  ResourceAlreadyExist,
  EventIsFullBookedException,
  EventCannotCompleteException,
  EventCannotCancelException,
  UserIsBlacklistedException
};
