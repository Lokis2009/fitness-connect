import { Component, input, model } from '@angular/core';
import { MatPaginator, type PageEvent } from '@angular/material/paginator';

/**
 * Previous and next controls with the visible range and the total, on the Material paginator.
 * Pages are numbered from 1. Changing the page size returns to page 1.
 */
@Component({
  selector: 'fc-pagination',
  imports: [MatPaginator],
  template: `
    <mat-paginator
      [attr.aria-label]="label()"
      [length]="total()"
      [pageIndex]="page() - 1"
      [pageSize]="pageSize()"
      [pageSizeOptions]="pageSizeOptions()"
      [hidePageSize]="pageSizeOptions().length === 0"
      (page)="onPage($event)"
    />
  `,
  host: { class: 'block' },
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

  protected onPage(event: PageEvent): void {
    if (event.pageSize !== this.pageSize()) {
      this.pageSize.set(event.pageSize);
      this.page.set(1);
      return;
    }
    this.page.set(event.pageIndex + 1);
  }
}
