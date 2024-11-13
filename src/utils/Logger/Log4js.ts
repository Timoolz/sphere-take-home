import log4js from 'log4js';
import { ILogger, ILoggerOptions } from '../../interfaces';

export class Log4js implements ILogger {
  logger: log4js.Logger;

  constructor(options: ILoggerOptions) {
    log4js.configure({
      appenders: { [options.id]: { type: 'console', layout: { type: 'colored' } } },
      categories: { default: { appenders: [options.id], level: options.level || 'error' } },
    });

    this.logger = log4js.getLogger(options.id);
  }

  Info(...info: any): void {
    this.logger.info(info);
  }

  Error(...error: any): void {
    this.logger.error(error);
  }

  Warn(...message: any): void {
    this.logger.warn(message);
  }
}
