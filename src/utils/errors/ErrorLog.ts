import {Logger} from '../Logger';

export const ErrorLog = {
  log(err: Error | string) {
    'string' === typeof err ? Logger.Error('ERROR: ', err) : Logger.Error(err, err.message, err.stack);
  },
};
