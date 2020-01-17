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

class AccessDeniedException extends HttpException {
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
  constructor(resource: string, ...keys) {
    super(500, `${resource.toLowerCase()}_already_exist`, `Resource ${resource} with key ${keys} is already exist`);
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

class EventCannotCreateException extends HttpException {
  constructor(...params: any[]) {
    super(500, 'event_cannot_create', `Event ${params} cannot be created`);
  }
}

class EventCannotUpdateException extends HttpException {
  constructor(key: string) {
    super(500, 'event_cannot_update', `Event ${key} cannot be updated`);
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

class OrderCannotPayException extends HttpException {
  constructor(id: string) {
    super(500, 'order_cannot_pay', `Order ${id} cannot be paid`);
  }
}

class OrderAlreadyPaidException extends HttpException {
  constructor(id: string) {
    super(500, 'order_already_paid', `Order ${id} is already paid`);
  }
}

class RefundAlreadyPerformedException extends HttpException {
  constructor(id: string, status: string) {
    super(500, 'refund_already_performed', `Refund ${id}, status: ${status} is already performed`);
  }
}

class InvalidPaymentSignatureException extends HttpException {
  constructor() {
    super(400, 'invalid_payment_signature', `Invalid payment signature`);
  }
}

class CannotRefundException extends HttpException {
  constructor(id: string, message: string) {
    super(400, 'cannot_refund', `Order ${id}, ${message}`);
  }
}

class InsufficientCreditsException extends HttpException {
  constructor(id: string, message: string) {
    super(500, 'insufficient_credits', `User ${id}, ${message}`);
  }
}

class InsufficientRedemptionsException extends HttpException {
  constructor(id: string, message: string) {
    super(500, 'insufficient_redemption', `Redemption ${id}, ${message}`);
  }
}

export {
  AuthorizationException,
  WrongCredentialException,
  AccessDeniedException,
  ResourceNotFoundException,
  InvalidRequestException,
  ResourceAlreadyExist,
  EventIsFullBookedException,
  EventCannotCreateException,
  EventCannotUpdateException,
  EventCannotCompleteException,
  EventCannotCancelException,
  UserIsBlacklistedException,
  OrderCannotPayException,
  OrderAlreadyPaidException,
  RefundAlreadyPerformedException,
  InvalidPaymentSignatureException,
  CannotRefundException,
  InsufficientCreditsException,
  InsufficientRedemptionsException
};
