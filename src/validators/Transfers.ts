import { body } from 'express-validator';
import { SupportedCurrency } from '../interfaces';



export const transfersValidator = [
  body('sourceCurrency', 'sourceCurrency')

    .exists()
    .isIn(Object.values(SupportedCurrency))
    .trim()
    .escape(),
  body('destinationCurrency', 'destinationCurrency')

    .exists()
    .isIn(Object.values(SupportedCurrency))
    .trim()
    .escape(),
  body('narration', 'narration')
    .exists()
    .trim()
    .escape(),
  body('source', 'source')
    .exists()
    .trim()
    .escape(),
  body('destination', 'destination')
    .exists()
    .trim()
    .escape(),
  body('reference', 'reference')
    .exists()
    .trim()
    .escape(),

  body('sourceAmount', 'sourceAmount ')
    .isFloat({ gt: 0 })
    .exists()
    .escape(),
    
];