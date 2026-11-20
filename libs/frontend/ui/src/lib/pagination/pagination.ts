import { Component, input, model } from '@angular/core';

/**
 * Previous and next controls with the visible range and the total, on the Material paginator.
 * Pages are numbered from 1. Changing the page size returns to page 1.
 */
@Component({
  selector: 'fc-pagination',
  template: '',
})
export class FcPagination {
  /** Number of items over all pages. */
  readonly total = input.required<number>();
  /** Current page, starting at 1. */
  readonly page = model(1);
  readonly pageSize = model(25);
  /** Sizes the user can choose from; empty hides the size selector. */
  readonly pageSizeOptions = input<readonly number[]>([]);
  /** Accessible name of the navigation. */
  readonly label = input('Pagination');

  constructor() {
    throw new Error('not implemented');
  }
}
