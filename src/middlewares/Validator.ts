import { ContextRunner, validationResult } from 'express-validator';
import { NextFunction, Request, Response } from 'express';
import { BadRequest } from '../utils/errors/ErrorHandlers';

export const Validator = {
  validate: (validations: ContextRunner[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      await Promise.all(
        validations.map((validation: ContextRunner) => validation.run(req)),
      );

      const errors = validationResult(req);

      if (errors.isEmpty()) return next();

      return res.status(400).json(
        new BadRequest({
          data: errors.array().map(({ type, msg }) => ({
            type,
            message: msg,
          })),
        }),
      );
    };
  },
};
