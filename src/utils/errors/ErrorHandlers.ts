import { NextFunction, Request, Response } from 'express';
import { IError, IErrorData } from '../../interfaces';
import { ErrorCode } from './ErrorCodes';
import { ErrorLog } from './ErrorLog';

/**
 * Handles unknown route errors
 */
export async function unknownRouteError(
  req: Request,
  res: Response,
): Promise<Response> {
  return res.status(404).json(<IError>{
    code: ErrorCode.ROUTE_NOT_FOUND,
    message: `Route ${req.originalUrl} not found.`,
    data: {}
  });
}


/**
 * Handles unhandled errors
 */
export async function handleUnhandledError(
  err: Error,
  req: Request,
  res: Response,
): Promise<Response> {
  ErrorLog.log(err);
  return res.status(500).json(new ServerError(err));
}

export class UnauthorizedAccess implements IError {
  code: string;
  message: string;
  data: Error;

  constructor(error: Partial<IError>) {
    this.code = ErrorCode.UNAUTHORIZED_ACCESS;
    this.message = error.message || 'Unauthorized access';
    this.data = error.data as Error;
  }
}

export class ForbiddenAccess implements IError {
  code: string;
  message: string;
  data: Error;

  constructor(error: Partial<IError>) {
    this.code = ErrorCode.FORBIDDEN;
    this.message = error.message || 'Not permitted';
    this.data = error.data as Error;
  }
}

export class ServerError implements IError {
  code: string;
  message: string;
  data: Error;

  constructor(error: Partial<IError>) {
    this.code = ErrorCode.SERVER_ERROR;
    this.message = error.message || 'An unexpected internal server error occurred';
    this.data = error.data as Error;
  }
}

export class BadRequest implements IError {
  code: string;
  message: string;
  data: IErrorData;

  constructor(error: Partial<IError>) {
    this.code = ErrorCode.BAD_REQUEST;
    this.message = error.message || 'Some important parameters are missing or invalid. See documentation';
    this.data = error.data || {};
  }
}

export class UnprocessableRequest implements IError {
  code: string;
  message: string;
  data: IErrorData;

  constructor(error: Partial<IError>) {
    this.code = ErrorCode.UNPROCESSABLE_ENTITY;
    this.message = error.message || 'Server cannot process request at this time';
    this.data = error.data || {};
  }
}

export class ResourceNotFoundError implements IError {
  code: string;
  message: string;
  data: IErrorData;

  constructor(error: Partial<IError>) {
    this.code = ErrorCode.RESOURCE_NOT_FOUND;
    this.message = error.message || 'Resource not found';
    this.data = error.data || {};
  }
}

export class ConflictError implements IError {
  code: string;
  message: string;
  data: any;

  constructor(error?: any) {
    this.code = ErrorCode.CONFLICT;
    this.message = error.message || 'Duplicate request';
    this.data = error.data;
  }
}

export const HandleErrorResponse = (
  err: any,
  res: Response,
): Response => {
  ErrorLog.log(err);
  switch (err.code) {
    case ErrorCode.FORBIDDEN:
      return res.status(403).json(new ForbiddenAccess(err));
    case ErrorCode.BAD_REQUEST:
      return res.status(400).json(new BadRequest(err));
    case ErrorCode.UNPROCESSABLE_ENTITY:
      return res.status(422).json(new UnprocessableRequest(err));
    case ErrorCode.RESOURCE_NOT_FOUND:
      return res.status(404).json(new ResourceNotFoundError(err));
    case ErrorCode.UNAUTHORIZED_ACCESS:
      return res.status(401).json(new UnauthorizedAccess(err));
    case ErrorCode.CONFLICT:
      return res.status(409).json(new ConflictError(err));
    default: {
      return res.status(500).json(new ServerError(err));
    }
  }
};
