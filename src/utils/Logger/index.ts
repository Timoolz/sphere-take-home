import { LoggerFactory } from './LoggerFactory';

const Logger = LoggerFactory.configure({
  id: '',
  level: 'all',
});

export { Logger };
