import { Pipe, PipeTransform } from '@angular/core';

/** Formats an amount in minor units and a currency code, for example "120 PLN" or "120.50 PLN". */
@Pipe({ name: 'fcMoney' })
export class FcMoneyPipe implements PipeTransform {
  transform(priceMinor: number, currency: string): string {
    void [priceMinor, currency];
    throw new Error('not implemented');
  }
}
