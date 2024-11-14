import { Result, ValidationError } from "express-validator";

export type IErrorData = string|(string|{[key: string]: string})[]|{[key: string]: string}|Error| Result<ValidationError>;
export interface IError {
  code: string;
  message: string;
  data: IErrorData;
}


