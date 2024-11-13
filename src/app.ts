import 'reflect-metadata';
import express from 'express';
import * as bodyParser from 'body-parser';
import compression from 'compression';
import helmet from 'helmet';
import methodOverride from 'method-override';
import cors from 'cors';
import morgan from 'morgan';
import { appEnv } from './config';
import routes from './routes';
import { Logger } from './utils/Logger';
import { LoggerFactory } from './utils/Logger/LoggerFactory';
import { Log4js } from './utils/Logger/Log4js';

const app = express();

app.use(cors());

app.use(morgan('combined', {
  skip: (req, res) => res.statusCode < 400 && process.env.NODE_ENV === 'production'
}));
const accessLogger = Logger.log4js().connectLogger(Logger.appLogger(), {
  level: 'auto',
  format: ':method :url - Status::statusCode - :response-time ms',
});

app.use(accessLogger);

app.use(bodyParser.json());

app.set('port', process.env.PORT);
app.set('env', appEnv);

app.use(
  compression({
    filter: (req: express.Request, res: express.Response) => {
      if (req.headers['x-no-compression']) {
        // don't compress responses with this request header
        return false;
      }
      // fallback to standard filter function
      return compression.filter(req, res);
    },
  }),
);

app.use(bodyParser.json());

app.use(helmet());
app.disable('x-powered-by');

app.use(methodOverride());


const router = express.Router();

router.use(routes);
app.use(router);

export default app;
