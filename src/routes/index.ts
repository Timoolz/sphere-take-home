import express from 'express';

import {Request, Response} from 'express';

import { handleUnhandledError, unknownRouteError } from '../utils/errors/ErrorHandlers';


const router: express.Router = express.Router();

router.use('/health', (req, res) => {
  res.send({status: 'OK'});
});


router.use(unknownRouteError);

router.use(handleUnhandledError);

export default router;
