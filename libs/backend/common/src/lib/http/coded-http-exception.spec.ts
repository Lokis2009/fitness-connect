import { HttpException } from '@nestjs/common';
import { CodedHttpException } from './coded-http-exception';

describe('CodedHttpException', () => {
  it('is an HttpException that keeps the status', () => {
    const exception = new CodedHttpException(409, 'booking-expired', 'Expired');

    expect(exception).toBeInstanceOf(HttpException);
    expect(exception.getStatus()).toBe(409);
  });

  it('keeps the message and the code', () => {
    const exception = new CodedHttpException(
      403,
      'trainer-not-approved',
      'Trainer is not approved',
    );

    expect(exception.message).toBe('Trainer is not approved');
    expect(exception.code).toBe('trainer-not-approved');
  });

  it('answers a body with statusCode, message and code', () => {
    const exception = new CodedHttpException(409, 'booking-expired', 'Expired');

    expect(exception.getResponse()).toEqual({
      statusCode: 409,
      message: 'Expired',
      code: 'booking-expired',
    });
  });
});
