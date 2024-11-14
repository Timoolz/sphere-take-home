

import { Response } from 'express';
import { rateService } from '../services';

import { HandleErrorResponse } from '../utils/errors/ErrorHandlers';
import { IAuthRequest } from '../interfaces/IRequest';
import { StatusResponse } from '../interfaces/IResponse';
import RateDto from '../interfaces/IRateDto';



export const RateController = {



  async updateRate(request: IAuthRequest, response: Response) {
    try {
    
      const requestBody = request.body as unknown as RateDto;    
      const rateResponse: StatusResponse = await rateService.upsertRate( requestBody);
      return response.status(201).json(rateResponse);
    } catch (error) {
      return HandleErrorResponse(error, response);
    }
  },

};