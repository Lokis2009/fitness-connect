import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

/** RFC 9457 problem details, matching the `Problem` schema of the API contract. */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

/** Turns every exception into an `application/problem+json` response. */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    void exception;
    void host;
    throw new Error('not implemented');
  }
}
