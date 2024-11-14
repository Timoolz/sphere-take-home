import { body } from 'express-validator';



export const transfersValidator = [
  body('pair', 'Rate Pair ')
    .isLength({
      min: 7,
      max: 7,
    })
    .exists()
    .trim()
    .escape(),
  body('rate', 'Rate')
    .isNumeric()
    .exists()
    .trim()
    .escape(),

  body('timestamp', 'Timestamp ')
    .isDate()
    .exists()
    .trim()
    .escape(),
    
];