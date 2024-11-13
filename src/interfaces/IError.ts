export type IErrorData = string|(string|{[key: string]: string})[]|{[key: string]: string}|Error;
export interface IError {
  code: string;
  message: string;
  data: IErrorData;
}


