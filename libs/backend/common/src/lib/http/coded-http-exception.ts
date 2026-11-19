import { HttpException } from '@nestjs/common';

/**
 * An `HttpException` that carries a machine-readable `code`, so services can
 * raise `booking-expired` and similar problems without building responses.
 * The body is `{ statusCode, message, code }`.
 */
export class CodedHttpException extends HttpException {
  constructor(
    status: number,
    readonly code: string,
    message: string,
  ) {
    super({ statusCode: status, message, code }, status);
  }
}
