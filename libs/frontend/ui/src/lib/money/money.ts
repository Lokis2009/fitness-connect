import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats an amount in minor units and a currency code: "120 PLN" for 12000, "120.50 PLN" for 12050.
 * It assumes two decimals for every currency (open question O7; PLN is the only one in view).
 */
@Pipe({ name: 'fcMoney' })
export class FcMoneyPipe implements PipeTransform {
  transform(priceMinor: number, currency: string): string {
    const amount = priceMinor / 100;
    const text = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
    return `${text} ${currency}`;
  }
}
