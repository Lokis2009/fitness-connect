import { Component, input, output } from '@angular/core';
import type { FcBadgeVariant } from '../badge/badge';

export interface FcTableColumn<T> {
  /** Unique within the table. */
  readonly key: string;
  readonly header: string;
  /** Text of the cell. Format dates and numbers here. */
  readonly value: (row: T) => string;
  /** When set, the cell text is shown as a badge with this variant. */
  readonly badge?: (row: T) => FcBadgeVariant;
}

/**
 * Read-only table of typed rows. Shows one of four states: loading, error (with a retry button),
 * empty, or the rows. Loading wins over error, and error wins over empty and rows.
 */
@Component({
  selector: 'fc-table',
  template: '',
})
export class FcTable<T> {
  readonly columns = input.required<readonly FcTableColumn<T>[]>();
  readonly rows = input<readonly T[]>([]);
  /** Accessible name of the table. */
  readonly label = input.required<string>();
  readonly loading = input(false);
  readonly loadingMessage = input('Loading…');
  /** Error message; a non-empty value switches the table to its error state. */
  readonly error = input('');
  readonly emptyMessage = input('No results.');
  readonly retryLabel = input('Try again');
  /** Identity of a row, for stable rendering when the rows change. Defaults to the row index. */
  readonly rowKey = input<(row: T, index: number) => unknown>((_row, index) => index);
  /** Emits when the user presses the retry button of the error state. */
  readonly retry = output<void>();

  constructor() {
    throw new Error('not implemented');
  }
}
