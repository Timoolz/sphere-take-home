import { Request } from 'express';

export interface IAuthRequest extends Request {
  pricipal?: any;

}