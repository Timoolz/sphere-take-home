import {Logger} from '../Logger';

export const ErrorLog = {
  log(err: Error | string) {
    if (process.env.NODE_ENV !== 'test') {
      'string' === typeof err ? Logger.Error('SERVER_ERROR: ', err) : Logger.Error('SERVER_ERROR: ', err.message, err.stack);
    }
  },
};
