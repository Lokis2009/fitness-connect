import { CodedHttpException } from './coded-http-exception';

describe('CodedHttpException', () => {
  it('is not implemented yet', () => {
    expect(
      () => new CodedHttpException(409, 'booking-expired', 'Expired'),
    ).toThrow('not implemented');
  });
});
