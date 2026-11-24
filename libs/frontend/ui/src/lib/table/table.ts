import { Component, computed, input, output } from '@angular/core';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { FcAlert } from '../alert/alert';
import { FcBadge } from '../badge/badge';
import { FcButton } from '../button/button';

export interface FcTableColumn<T> {
  /** Unique within the table. */
  readonly key: string;
  readonly header: string;
  /** Text of the cell. Format dates and numbers here. */
  readonly value: (row: T) => string;
  /** When true, the cell text is shown as a badge. */
  readonly badge?: boolean;
}

/**
 * Read-only table of typed rows. Shows one of four states: loading, error (with a retry button),
 * empty, or the rows. Loading wins over error, and error wins over empty and rows.
 */
@Component({
  selector: 'fc-table',
  imports: [
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatProgressSpinner,
    FcAlert,
    FcBadge,
    FcButton,
  ],
  template: `
    @if (loading()) {
      <div role="status" class="flex items-center gap-text p-4 text-body text-ink-muted">
        <mat-progress-spinner mode="indeterminate" aria-hidden="true" [diameter]="24" />
        <span>{{ loadingMessage() }}</span>
      </div>
    } @else if (error()) {
      <div class="flex flex-col items-start gap-4">
        <fc-alert variant="error" class="w-full">{{ error() }}</fc-alert>
        <fc-button variant="secondary" (click)="retry.emit()">{{ retryLabel() }}</fc-button>
      </div>
    } @else if (rows().length === 0) {
      <p role="status" class="p-4 text-body text-ink-muted">{{ emptyMessage() }}</p>
    } @else {
      <!-- Focusable and named so a keyboard user can scroll a table wider than the screen. -->
      <div
        class="overflow-x-auto rounded-card border border-line-card bg-surface"
        tabindex="0"
        role="region"
        [attr.aria-label]="label()"
      >
        <table mat-table class="w-full" [dataSource]="rows()" [trackBy]="trackBy()" [attr.aria-label]="label()">
          @for (column of columns(); track column.key) {
            <ng-container [matColumnDef]="column.key">
              <th mat-header-cell *matHeaderCellDef>{{ column.header }}</th>
              <td mat-cell *matCellDef="let row">
                @if (column.badge) {
                  <fc-badge>{{ column.value(row) }}</fc-badge>
                } @else {
                  {{ column.value(row) }}
                }
              </td>
            </ng-container>
          }
          <tr mat-header-row *matHeaderRowDef="columnKeys()"></tr>
          <tr mat-row *matRowDef="let row; columns: columnKeys()"></tr>
        </table>
      </div>
    }
  `,
  host: { class: 'block' },
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

  protected readonly columnKeys = computed(() => this.columns().map((column) => column.key));
  protected readonly trackBy = computed(() => {
    const rowKey = this.rowKey();
    return (index: number, row: T) => rowKey(row, index);
  });
}
