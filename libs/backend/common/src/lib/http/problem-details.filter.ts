import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { STATUS_CODES } from 'node:http';

/** RFC 9457 problem details, matching the `Problem` schema of the API contract. */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

/** The slice of the HTTP response the filter uses, independent of the HTTP platform. */
interface ProblemResponse {
  status(code: number): ProblemResponse;
  type(contentType: string): ProblemResponse;
  json(body: unknown): unknown;
}

/** Turns every exception into an `application/problem+json` response. */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<ProblemResponse>();
    const request = http.getRequest<{ url?: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const problem: ProblemDetails = {
      type: 'about:blank',
      title: STATUS_CODES[status] ?? 'Error',
      status,
    };
    // Unexpected errors never expose their message.
    if (exception instanceof HttpException) {
      problem.detail = detailOf(exception);
    }
    if (request.url) {
      problem.instance = request.url;
    }

    response.status(status).type(PROBLEM_CONTENT_TYPE).json(problem);
  }
}

function detailOf(exception: HttpException): string {
  const body = exception.getResponse();
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const { message } = body as { message: unknown };
    return Array.isArray(message) ? message.join('; ') : String(message);
  }
  return exception.message;
}
