import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FcTable, FcTableColumn } from './table';

interface Person {
  id: string;
  name: string;
  role: 'client' | 'trainer';
}

const COLUMNS: readonly FcTableColumn<Person>[] = [
  { key: 'name', header: 'Name', value: (p) => p.name },
  {
    key: 'role',
    header: 'Role',
    value: (p) => p.role,
    badge: true,
  },
];

const ROWS: readonly Person[] = [
  { id: 'a', name: 'Casey Client', role: 'client' },
  { id: 'b', name: 'Taylor Trainer', role: 'trainer' },
];

@Component({
  imports: [FcTable],
  template: `
    <fc-table
      [columns]="columns()"
      [rows]="rows()"
      label="People"
      [loading]="loading()"
      [error]="error()"
      [emptyMessage]="emptyMessage()"
      [rowKey]="rowKey"
      (retry)="retries.set(retries() + 1)"
    />
  `,
})
class Host {
  readonly columns = signal(COLUMNS);
  readonly rows = signal<readonly Person[]>(ROWS);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly emptyMessage = signal('No people match this filter.');
  readonly retries = signal(0);
  readonly rowKey = (row: Person) => row.id;
}

describe('FcTable', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const update = async (fn: (host: Host) => void) => {
      fn(fixture.componentInstance);
      await fixture.whenStable();
    };
    return {
      fixture,
      root,
      update,
      host: fixture.componentInstance,
      table: () => root.querySelector('table'),
      headers: () => Array.from(root.querySelectorAll('th')).map((th) => th.textContent?.trim()),
      bodyRows: () => Array.from(root.querySelectorAll('tbody tr, tr[mat-row]')),
      cells: (row: Element) => Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim()),
    };
  }

  describe('with rows', () => {
    it('renders a table named by its label', async () => {
      const { table } = await setup();

      expect(table()?.getAttribute('aria-label')).toBe('People');
    });

    it('renders one column header per column definition', async () => {
      const { headers } = await setup();

      expect(headers()).toEqual(['Name', 'Role']);
    });

    it('renders one row per item with the text of each column', async () => {
      const { bodyRows, cells } = await setup();

      expect(bodyRows()).toHaveLength(2);
      expect(cells(bodyRows()[0])).toEqual(['Casey Client', 'client']);
      expect(cells(bodyRows()[1])).toEqual(['Taylor Trainer', 'trainer']);
    });

    it('shows a column as a badge when it is marked as a badge', async () => {
      const { bodyRows } = await setup();
      const badges = bodyRows().map((row) => row.querySelector('fc-badge > span') as HTMLElement | null);

      expect(badges[0]?.textContent?.trim()).toBe('client');
      expect(badges[1]?.textContent?.trim()).toBe('trainer');
    });

    it('renders plain text, not a badge, for columns that are not marked as a badge', async () => {
      const { bodyRows } = await setup();

      expect(bodyRows()[0].querySelector('td:first-child fc-badge')).toBeNull();
    });

    it('updates when the rows change', async () => {
      const { update, bodyRows, cells } = await setup();

      await update((host) => host.rows.set([{ id: 'c', name: 'Alex Admin', role: 'client' }]));

      expect(bodyRows()).toHaveLength(1);
      expect(cells(bodyRows()[0])[0]).toBe('Alex Admin');
    });

    it('works without a row key by falling back to the row index', async () => {
      const fixture = TestBed.createComponent(FcTable<Person>);
      fixture.componentRef.setInput('columns', COLUMNS);
      fixture.componentRef.setInput('rows', ROWS);
      fixture.componentRef.setInput('label', 'People');
      await fixture.whenStable();

      expect((fixture.nativeElement as HTMLElement).querySelectorAll('td')).toHaveLength(4);
    });

    it('scrolls inside its own container so a wide table does not scroll the page', async () => {
      const { table } = await setup();

      expect((table()?.parentElement as HTMLElement).classList).toContain('overflow-x-auto');
    });
  });

  describe('loading', () => {
    it('shows the loading message as a status and no table', async () => {
      const { update, root, table } = await setup();

      await update((host) => host.loading.set(true));

      expect(table()).toBeNull();
      expect(root.querySelector('[role="status"]')?.textContent).toContain('Loading…');
    });

    it('wins over the error and empty states', async () => {
      const { update, root } = await setup();

      await update((host) => {
        host.loading.set(true);
        host.error.set('Boom');
        host.rows.set([]);
      });

      expect(root.querySelector('[role="alert"]')).toBeNull();
      expect(root.textContent).not.toContain('No people match this filter.');
    });

    it('returns to the rows when loading ends', async () => {
      const { update, bodyRows } = await setup();

      await update((host) => host.loading.set(true));
      await update((host) => host.loading.set(false));

      expect(bodyRows()).toHaveLength(2);
    });
  });

  describe('error', () => {
    it('shows the error message as an alert and no table', async () => {
      const { update, root, table } = await setup();

      await update((host) => host.error.set('We could not load the users.'));

      expect(table()).toBeNull();
      expect(root.querySelector('[role="alert"]')?.textContent).toContain('We could not load the users.');
    });

    it('emits retry when the retry button is pressed', async () => {
      const { update, host, root } = await setup();
      await update((h) => h.error.set('Boom'));

      const button = root.querySelector('fc-button button') as HTMLButtonElement;
      expect(button.textContent).toContain('Try again');
      button.click();

      expect(host.retries()).toBe(1);
    });

    it('wins over the empty state', async () => {
      const { update, root } = await setup();

      await update((host) => {
        host.error.set('Boom');
        host.rows.set([]);
      });

      expect(root.querySelector('[role="alert"]')).not.toBeNull();
      expect(root.textContent).not.toContain('No people match this filter.');
    });
  });

  describe('empty', () => {
    it('shows the empty message as a status and no table', async () => {
      const { update, root, table } = await setup();

      await update((host) => host.rows.set([]));

      expect(table()).toBeNull();
      expect(root.querySelector('[role="status"]')?.textContent).toContain('No people match this filter.');
    });
  });
});
