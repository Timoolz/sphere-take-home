import { body } from 'express-validator';



export const ratesValidator = [
  body('pair', 'Rate Pair ')
    .isLength({
      min: 7,
      max: 7,
    })
    .exists()
    .trim(),
    // .escape(),
  body('rate', 'Rate')
    .isNumeric()
    .exists()
    .trim()
    .escape(),

  body('timestamp', 'Timestamp ')
    .exists()
    .trim()
    .escape(),
    
];