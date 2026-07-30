import { Response } from 'express';

export interface ApiResponseBody<T> {
  status: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  error: unknown;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T | null = null,
  error: unknown = []
): Response<ApiResponseBody<T>> => {
  return res.status(statusCode).json({
    status: statusCode < 400,
    statusCode,
    message,
    data,
    error,
  });
};

export default { sendResponse };
