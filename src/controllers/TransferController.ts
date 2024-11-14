

import { Response } from 'express';
import { transferService } from '../services';

import { HandleErrorResponse } from '../utils/errors/ErrorHandlers';
import { IAuthRequest } from '../interfaces/IRequest';
import { StatusResponse } from '../interfaces/IResponse';
import { TransferDto, TransferRequestDto } from '../interfaces';



export const TransferController = {



  async transfer(request: IAuthRequest, response: Response) {
    try {
    
      const requestBody = request.body as unknown as TransferRequestDto; 
      const idempotenceKey = request.headers['Idempotency-Key'] as string;   
      const transferResponse: TransferDto = await transferService.transfer( idempotenceKey, requestBody);
      return response.status(201).json(transferResponse);
    } catch (error) {
      return HandleErrorResponse(error, response);
    }
  },

};