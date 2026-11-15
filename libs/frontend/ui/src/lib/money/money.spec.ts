import { FcMoneyPipe } from './money';

describe('FcMoneyPipe', () => {
  const pipe = new FcMoneyPipe();

  it('shows a whole amount without decimals', () => {
    expect(pipe.transform(12000, 'PLN')).toBe('120 PLN');
  });

  it('shows two decimals when the amount is not whole', () => {
    expect(pipe.transform(12050, 'PLN')).toBe('120.50 PLN');
    expect(pipe.transform(12005, 'PLN')).toBe('120.05 PLN');
  });

  it('handles zero and amounts under one unit', () => {
    expect(pipe.transform(0, 'PLN')).toBe('0 PLN');
    expect(pipe.transform(5, 'PLN')).toBe('0.05 PLN');
  });

  it('prints the currency code it is given', () => {
    expect(pipe.transform(2500, 'EUR')).toBe('25 EUR');
  });
});
