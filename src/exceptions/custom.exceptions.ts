import HttpException from './http.exception';

class AuthorizationException extends HttpException {
  constructor(token: string) {
    super(401, `Authorization failed, token: ${token}`);
  }
}

class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id: string) {
    super(404, `${resource} is not found, id: ${id}`);
  }
}

class InvalidRequestException extends HttpException {
  constructor(service: string, attributes: string[]) {
    super(404, `Invalid request for attribute(s) ${attributes} in ${service}`);
  }
}

class ResourceAlreadyExist extends HttpException {
  constructor(resource: string, key: string) {
    super(500, `Resource ${resource} with key ${key} is already exist`);
  }
}

export { AuthorizationException, ResourceNotFoundException, InvalidRequestException, ResourceAlreadyExist };
