import express from 'express';

import {Request, Response} from 'express';

import { handleUnhandledError, unknownRouteError } from '../utils/errors/ErrorHandlers';
import { Validator } from '../middlewares';
import { ratesValidator } from '../validators';
import { RateController } from '../controllers/RateController';


const router: express.Router = express.Router();

router.use('/health', (req, res) => {
  res.send({status: 'OK'});
});

router.post(
  '/fx-rate',
  Validator.validate(ratesValidator),
  RateController.updateRate
);


router.use(unknownRouteError);

router.use(handleUnhandledError);

export default router;
