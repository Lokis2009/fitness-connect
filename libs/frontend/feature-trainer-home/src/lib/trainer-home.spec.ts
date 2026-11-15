import { signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import {
  ApiClient,
  ApiError,
  type Booking,
  type BookingRequest,
  type BookingRequestList,
  type Session,
  type SessionList,
  type User,
} from '@fitness-connect/data-access';
import { type Observable, Subject, of, throwError } from 'rxjs';
import { TrainerHome } from './trainer-home';

// Sunday 15 Nov 2026, 11:00 in Warsaw (UTC+1).
const NOW = Date.parse('2026-11-15T10:00:00Z');
const MINUTE_MS = 60_000;

const trainer: User = {
  id: 't1',
  email: 'taylor@example.com',
  displayName: 'Taylor Trainer',
  role: 'trainer',
  trainerStatus: 'approved',
  trainerStatusNote: null,
  trainerVenueTimeZone: 'Europe/Warsaw',
};

function request(id: string, minutesLeft: number, startsAt = '2026-11-16T10:00:00Z', priceMinor = 12000): BookingRequest {
  return {
    id,
    clientName: `Client ${id}`,
    startsAt,
    durationMinutes: 60,
    priceMinor,
    currency: 'PLN',
    venue: { name: 'Iron Hall Gym', area: 'Powisle', timeZone: 'Europe/Warsaw' },
    requestedAt: new Date(NOW - 10 * MINUTE_MS).toISOString(),
    expiresAt: new Date(NOW + minutesLeft * MINUTE_MS).toISOString(),
  };
}

function session(id: string, startsAt: string, durationMinutes = 60): Session {
  return {
    id,
    clientName: `Trainee ${id}`,
    startsAt,
    durationMinutes,
    venue: { name: 'Studio One', area: 'Mokotow', timeZone: 'Europe/Warsaw' },
  };
}

function requestList(items: BookingRequest[]): BookingRequestList {
  return { serverTime: new Date(Date.now()).toISOString(), items };
}

function sessionList(items: Session[]): SessionList {
  return { serverTime: new Date(Date.now()).toISOString(), items };
}

function booking(id: string, status: Booking['status']): Booking {
  return { id, status, startsAt: '2026-11-16T10:00:00Z', decidedAt: new Date(Date.now()).toISOString() };
}

function problem(status: number, code?: string): ApiError {
  return new ApiError(status, { type: 'about:blank', title: 'Problem', status, code });
}

const REQUESTS_EMPTY = 'No requests waiting';
const SESSIONS_EMPTY = 'No sessions today or tomorrow';

describe('TrainerHome', () => {
  const user = signal<User | null>(trainer);
  const signOut = vi.fn<() => void>();
  const refreshUser = vi.fn<() => Promise<void>>();
  const getBookingRequests = vi.fn<() => Observable<BookingRequestList>>();
  const getSessions = vi.fn<(from: string, to: string) => Observable<SessionList>>();
  const acceptBooking = vi.fn<(id: string) => Observable<Booking>>();
  const declineBooking = vi.fn<(id: string) => Observable<Booking>>();
  let queryParams: Record<string, string>;

  function setup(): { fixture: ComponentFixture<TrainerHome>; root: HTMLElement; router: Router } {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user, signOut, refreshUser } },
        { provide: ApiClient, useValue: { getBookingRequests, getSessions, acceptBooking, declineBooking } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(queryParams) },
            queryParamMap: of(convertToParamMap(queryParams)),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(TrainerHome);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement, router: TestBed.inject(Router) };
  }

  function text(root: HTMLElement): string {
    return (root.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  function buttons(root: HTMLElement): HTMLButtonElement[] {
    return Array.from(root.querySelectorAll<HTMLButtonElement>('fc-button button'));
  }

  function button(root: HTMLElement, label: string, within?: Element): HTMLButtonElement {
    const found = buttons(within instanceof HTMLElement ? within : root).find(
      (candidate) => candidate.querySelector('[data-fc-label]')?.textContent?.trim() === label,
    );
    if (!found) {
      throw new Error(`No button "${label}"`);
    }
    return found;
  }

  function cards(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>('fc-card')).filter((card) =>
      card.querySelector('h3'),
    );
  }

  function requestCard(root: HTMLElement, clientName: string): HTMLElement {
    const found = cards(root).find((card) => card.querySelector('h3')?.textContent?.includes(clientName));
    if (!found) {
      throw new Error(`No card for ${clientName}`);
    }
    return found;
  }

  function click(fixture: ComponentFixture<TrainerHome>, target: HTMLElement): void {
    target.click();
    fixture.detectChanges();
  }

  async function flush(fixture: ComponentFixture<TrainerHome>): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    user.set(trainer);
    queryParams = {};
    signOut.mockReset();
    refreshUser.mockReset();
    getBookingRequests.mockReset().mockImplementation(() => of(requestList([])));
    getSessions.mockReset().mockImplementation(() => of(sessionList([])));
    acceptBooking.mockReset();
    declineBooking.mockReset();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('header', () => {
    it('shows the h1 and the zone subtitle', () => {
      const { root } = setup();

      expect(root.querySelectorAll('h1')).toHaveLength(1);
      expect(root.querySelector('h1')?.textContent).toContain('Trainer home');
      expect(text(root)).toContain('Times are shown in Warsaw time.');
    });

    it('hides the subtitle while the venue zone is unknown', () => {
      user.set({ ...trainer, trainerVenueTimeZone: null });
      const { root } = setup();

      expect(text(root)).not.toContain('Times are shown in');
    });

    it('does not show the trainer name or email', () => {
      const { root } = setup();

      expect(text(root)).not.toContain('Taylor');
      expect(text(root)).not.toContain('taylor@example.com');
    });

    it('signs out and goes to the login page', async () => {
      const { fixture, root, router } = setup();
      const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

      click(fixture, button(root, 'Sign out'));
      await flush(fixture);

      expect(signOut).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('layout', () => {
    it('puts the title block on the left and Sign out at the right end of the same row', () => {
      const { root } = setup();

      const row = root.querySelector<HTMLElement>('fc-stack[justify="between"]');
      expect(row).not.toBeNull();
      expect(row?.classList.contains('justify-between')).toBe(true);
      expect(row?.classList.contains('flex-row')).toBe(true);
      const [title, signOutButton] = Array.from(row?.children ?? []);
      expect(title.querySelector('h1')?.textContent).toContain('Trainer home');
      expect(signOutButton.tagName.toLowerCase()).toBe('fc-button');
      expect(signOutButton.textContent).toContain('Sign out');
    });

    it('puts Accept and Decline in one row at equal width', () => {
      getBookingRequests.mockImplementation(() => of(requestList([request('b1', 30)])));
      const { root } = setup();

      const card = requestCard(root, 'b1');
      const [accept, decline] = Array.from(card.querySelectorAll<HTMLElement>('fc-button')).filter((host) =>
        ['Accept', 'Decline'].includes(host.textContent?.trim() ?? ''),
      );
      expect(accept.parentElement).toBe(decline.parentElement);
      expect(accept.parentElement?.classList.contains('flex-row')).toBe(true);
      expect(accept.classList.contains('w-full')).toBe(true);
      expect(decline.classList.contains('w-full')).toBe(true);
    });

    it('puts the time range on the left and the client and venue right aligned on a session row', () => {
      getSessions.mockImplementation(() => of(sessionList([session('s1', '2026-11-15T14:00:00Z')])));
      const { root } = setup();

      const client = Array.from(root.querySelectorAll<HTMLElement>('fc-text')).find((el) =>
        el.textContent?.includes('Trainee s1'),
      );
      const right = client?.parentElement as HTMLElement;
      const row = right.parentElement as HTMLElement;
      expect(right.classList.contains('items-end')).toBe(true);
      expect(right.textContent).toContain('Studio One');
      expect(row.classList.contains('justify-between')).toBe(true);
      expect(row.firstElementChild?.tagName.toLowerCase()).toBe('fc-time');
      expect(row.lastElementChild).toBe(right);
    });
  });

  describe('booking requests', () => {
    it('shows loading skeletons while the list loads', () => {
      getBookingRequests.mockReturnValue(new Subject<BookingRequestList>());
      const { root } = setup();

      expect(root.querySelectorAll('fc-skeleton').length).toBeGreaterThan(0);
      expect(text(root)).not.toContain(REQUESTS_EMPTY);
      expect(text(root)).not.toContain('Could not load requests');
    });

    it('shows the empty state with its copy', () => {
      const { root } = setup();

      expect(text(root)).toContain(REQUESTS_EMPTY);
      expect(text(root)).toContain('New booking requests appear here as soon as a client books you.');
    });

    it('shows the error state with its copy, not the empty state', () => {
      getBookingRequests.mockReturnValue(throwError(() => problem(500)));
      const { root } = setup();

      expect(text(root)).toContain('Could not load requests');
      expect(text(root)).toContain('Requests may be waiting for you. Check your connection and try again.');
      expect(text(root)).not.toContain(REQUESTS_EMPTY);
    });

    it('"Try again" loads the list again', () => {
      getBookingRequests.mockReturnValueOnce(throwError(() => problem(0)));
      const { fixture, root } = setup();
      getBookingRequests.mockImplementation(() => of(requestList([request('b1', 30)])));

      click(fixture, button(root, 'Try again', root.querySelector('fc-state') ?? undefined));

      expect(text(root)).toContain('Client b1');
      expect(text(root)).not.toContain('Could not load requests');
    });

    it('shows the heading with a count of the open cards', () => {
      getBookingRequests.mockImplementation(() => of(requestList([request('b1', 30), request('b2', 40)])));
      const { fixture, root } = setup();

      const headings = Array.from(root.querySelectorAll('h2')).map((h) => h.textContent?.trim());
      expect(headings).toContain('Booking requests');
      const countBadge = root.querySelector('fc-badge');
      expect(countBadge?.textContent?.trim()).toBe('2');

      acceptBooking.mockReturnValue(of(booking('b1', 'confirmed')));
      click(fixture, button(root, 'Accept', requestCard(root, 'b1')));

      expect(root.querySelector('fc-badge')?.textContent?.trim()).toBe('1');
    });

    it('shows a card with the client, time, price, venue and deadline', () => {
      getBookingRequests.mockImplementation(() => of(requestList([request('b1', 37)])));
      const { root } = setup();

      const card = requestCard(root, 'b1');
      expect(card.querySelector('h3')?.textContent).toContain('Client b1');
      expect(card.textContent).toContain('Tomorrow, 11:00 Warsaw time');
      expect(card.textContent).toContain('120 PLN');
      expect(card.textContent).toContain('Iron Hall Gym');
      expect(card.textContent).toContain('Respond by 11:37 (Warsaw)');
      expect(card.textContent).toContain('37 min left');
      expect(button(root, 'Accept', card)).toBeTruthy();
      expect(button(root, 'Decline', card)).toBeTruthy();
    });

    it('formats a price that is not whole', () => {
      getBookingRequests.mockImplementation(() => of(requestList([request('b1', 37, undefined, 12050)])));
      const { root } = setup();

      expect(requestCard(root, 'b1').textContent).toContain('120.50 PLN');
    });

    it('lists the soonest deadline first', () => {
      getBookingRequests.mockImplementation(() => of(requestList([request('late', 50), request('soon', 10)])));
      const { root } = setup();

      expect(cards(root).map((card) => card.querySelector('h3')?.textContent?.trim())).toEqual([
        'Client soon',
        'Client late',
      ]);
    });

    it('shows the late caption only on a request that starts within 3 hours', () => {
      getBookingRequests.mockImplementation(() =>
        of(
          requestList([
            request('near', 10, '2026-11-15T12:00:00Z'),
            request('far', 20, '2026-11-15T14:00:00Z'),
          ]),
        ),
      );
      const { root } = setup();

      const caption = 'Session starts within 3 hours. Cancelling later will be flagged.';
      expect(requestCard(root, 'near').textContent).toContain(caption);
      expect(requestCard(root, 'far').textContent).not.toContain(caption);
    });

    it('refreshes the failed-refresh note with the time of the last update', () => {
      getBookingRequests.mockImplementation(() => of(requestList([request('b1', 30)])));
      const { fixture, root } = setup();
      getBookingRequests.mockReturnValue(throwError(() => problem(500)));

      vi.advanceTimersByTime(30_000);
      fixture.detectChanges();

      expect(text(root)).toContain('Could not refresh. Showing the update from 11:00.');
      expect(text(root)).toContain('Client b1');
    });
  });

  describe('answering', () => {
    beforeEach(() => {
      getBookingRequests.mockImplementation(() => of(requestList([request('b1', 30), request('b2', 40)])));
    });

    it('shows a spinner label on the pressed button and disables the other', () => {
      acceptBooking.mockReturnValue(new Subject<Booking>());
      const { fixture, root } = setup();
      const card = requestCard(root, 'b1');

      click(fixture, button(root, 'Accept', card));

      expect(card.textContent).toContain('Accepting');
      expect(button(root, 'Decline', card).disabled).toBe(true);
      expect(acceptBooking).toHaveBeenCalledWith('b1');
    });

    it('shows "Declining" while a decline is in flight', () => {
      declineBooking.mockReturnValue(new Subject<Booking>());
      const { fixture, root } = setup();
      const card = requestCard(root, 'b1');

      click(fixture, button(root, 'Decline', card));

      expect(card.textContent).toContain('Declining');
      expect(button(root, 'Accept', card).disabled).toBe(true);
    });

    it('loads the sessions again after an accept, so the new session shows without a reload', async () => {
      acceptBooking.mockReturnValue(of(booking('b1', 'confirmed')));
      const { fixture, root } = setup();
      expect(getSessions).toHaveBeenCalledTimes(1);
      expect(text(root)).not.toContain('Trainee s9');
      getSessions.mockImplementation(() => of(sessionList([session('s9', '2026-11-16T10:00:00Z')])));

      click(fixture, button(root, 'Accept', requestCard(root, 'b1')));
      await flush(fixture);

      expect(getSessions).toHaveBeenCalledTimes(2);
      expect(text(root)).toContain('Trainee s9');
    });

    it('does not load the sessions again after a decline', async () => {
      declineBooking.mockReturnValue(of(booking('b1', 'declined')));
      const { fixture, root } = setup();

      click(fixture, button(root, 'Decline', requestCard(root, 'b1')));
      await flush(fixture);

      expect(getSessions).toHaveBeenCalledTimes(1);
    });

    it('shows a compact accepted card with the session time', () => {
      acceptBooking.mockReturnValue(of(booking('b1', 'confirmed')));
      const { fixture, root } = setup();

      click(fixture, button(root, 'Accept', requestCard(root, 'b1')));

      const card = requestCard(root, 'b1');
      expect(card.textContent).toContain('Accepted');
      expect(card.textContent).toContain('Mon 16 Nov, 11:00 Warsaw time');
      // One sentence in one line of text, as in the mockup.
      const sentences = Array.from(card.querySelectorAll<HTMLElement>('fc-text')).map((el) =>
        (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
      );
      expect(sentences).toContain('Accepted. Mon 16 Nov, 11:00 Warsaw time.');
      expect(card.textContent).not.toContain('Respond by');
      expect(buttons(card)).toHaveLength(0);
    });

    it('shows a compact declined card with its sentence', () => {
      declineBooking.mockReturnValue(of(booking('b1', 'declined')));
      const { fixture, root } = setup();

      click(fixture, button(root, 'Decline', requestCard(root, 'b1')));

      const card = requestCard(root, 'b1');
      expect(card.textContent).toContain('Declined');
      expect(card.textContent).toContain('Declined. No reason was sent.');
      expect(buttons(card)).toHaveLength(0);
    });

    it.each([
      ['booking-expired', 'This request expired before you answered.'],
      ['booking-withdrawn', 'The client withdrew this request.'],
      ['booking-not-pending', 'This request was already answered.'],
    ])('shows "No longer available" for %s', (code, sentence) => {
      acceptBooking.mockReturnValue(throwError(() => problem(409, code)));
      const { fixture, root } = setup();

      click(fixture, button(root, 'Accept', requestCard(root, 'b1')));

      const card = requestCard(root, 'b1');
      expect(card.textContent).toContain('No longer available');
      expect(card.textContent).toContain(sentence);
      expect(buttons(card)).toHaveLength(0);
    });

    it('shows "already answered" for a 404', () => {
      acceptBooking.mockReturnValue(throwError(() => problem(404)));
      const { fixture, root } = setup();

      click(fixture, button(root, 'Accept', requestCard(root, 'b1')));

      expect(requestCard(root, 'b1').textContent).toContain('This request was already answered.');
    });

    it('shows the failed card with Retry, keeping the details and both buttons', () => {
      acceptBooking.mockReturnValue(throwError(() => problem(0)));
      const { fixture, root } = setup();

      click(fixture, button(root, 'Accept', requestCard(root, 'b1')));

      const card = requestCard(root, 'b1');
      expect(card.textContent).toContain('We could not reach the server. Your answer may not have been saved.');
      expect(card.textContent).toContain('120 PLN');
      expect(card.textContent).toContain('30 min left');
      expect(button(root, 'Accept', card).disabled).toBe(false);
      expect(button(root, 'Decline', card).disabled).toBe(false);
      expect(card.querySelector('[role="alert"]')).not.toBeNull();
    });

    it('Retry sends the kept action again', () => {
      acceptBooking.mockReturnValueOnce(throwError(() => problem(500)));
      const { fixture, root } = setup();
      click(fixture, button(root, 'Accept', requestCard(root, 'b1')));
      acceptBooking.mockReturnValue(of(booking('b1', 'confirmed')));

      click(fixture, button(root, 'Retry', requestCard(root, 'b1')));

      expect(acceptBooking).toHaveBeenCalledTimes(2);
      expect(requestCard(root, 'b1').textContent).toContain('Accepted');
    });

    it('moves to /setup on a 403 when the status changed', async () => {
      acceptBooking.mockReturnValue(throwError(() => problem(403, 'trainer-not-approved')));
      refreshUser.mockImplementation(() => {
        user.set({ ...trainer, trainerStatus: 'changes_requested' });
        return Promise.resolve();
      });
      const { fixture, root, router } = setup();
      const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      click(fixture, button(root, 'Accept', requestCard(root, 'b1')));
      await flush(fixture);

      expect(navigate).toHaveBeenCalledWith(['/setup']);
    });
  });

  describe('expiry', () => {
    it('turns a card into "Expired" with disabled buttons when the deadline passes', () => {
      getBookingRequests.mockImplementation(() => of(requestList([request('b1', 1.25)])));
      const { fixture, root } = setup();
      expect(requestCard(root, 'b1').textContent).toContain('min left');

      vi.advanceTimersByTime(75_000);
      TestBed.tick();
      fixture.detectChanges();

      const card = requestCard(root, 'b1');
      expect(card.textContent).toContain('Expired');
      expect(card.textContent).toContain('The 1-hour response window has ended.');
      expect(card.textContent).not.toContain('min left');
      expect(button(root, 'Accept', card).disabled).toBe(true);
      expect(button(root, 'Decline', card).disabled).toBe(true);
    });
  });

  describe('deep link', () => {
    beforeEach(() => {
      getBookingRequests.mockImplementation(() => of(requestList([request('b1', 30), request('b2', 40)])));
    });

    it('highlights the linked request, with a badge, focus and scroll', () => {
      queryParams = { request: 'b2' };
      const scroll = vi.fn();
      Element.prototype.scrollIntoView = scroll;
      const { fixture, root } = setup();
      fixture.detectChanges();

      const linked = requestCard(root, 'b2');
      expect(linked.textContent).toContain('Opened from email');
      expect(requestCard(root, 'b1').textContent).not.toContain('Opened from email');
      expect(document.activeElement).toBe(linked);
      expect(scroll).toHaveBeenCalled();
      expect(text(root)).not.toContain('That request is no longer available');
    });

    it('ends the highlight when the trainer answers that card', () => {
      queryParams = { request: 'b2' };
      acceptBooking.mockReturnValue(new Subject<Booking>());
      const { fixture, root } = setup();

      click(fixture, button(root, 'Accept', requestCard(root, 'b2')));

      expect(requestCard(root, 'b2').textContent).not.toContain('Opened from email');
    });

    it('does not highlight a request that arrives in a later poll', () => {
      queryParams = { request: 'b3' };
      const { fixture, root } = setup();
      expect(text(root)).toContain('That request is no longer available.');
      getBookingRequests.mockImplementation(() =>
        of(requestList([request('b1', 30), request('b2', 40), request('b3', 50)])),
      );

      vi.advanceTimersByTime(30_000);
      fixture.detectChanges();

      expect(requestCard(root, 'b3').textContent).not.toContain('Opened from email');
    });

    it('shows a notice for an id that is not in the list', () => {
      queryParams = { request: 'gone' };
      const { root } = setup();

      expect(text(root)).toContain(
        'That request is no longer available. It may have expired, been answered, or belong to another trainer.',
      );
      expect(root.querySelector('fc-state [role="status"]')).not.toBeNull();
      expect(cards(root)).toHaveLength(2);
    });

    it('shows no notice without a link', () => {
      const { root } = setup();

      expect(text(root)).not.toContain('That request is no longer available');
    });

    it('waits for the first successful load before judging the link', () => {
      queryParams = { request: 'b1' };
      getBookingRequests.mockReturnValueOnce(throwError(() => problem(500)));
      const { fixture, root } = setup();
      expect(text(root)).not.toContain('That request is no longer available');

      click(fixture, button(root, 'Try again', root.querySelector('fc-state') ?? undefined));

      expect(requestCard(root, 'b1').textContent).toContain('Opened from email');
    });

    it('dismisses the notice when the trainer answers any card', () => {
      queryParams = { request: 'gone' };
      acceptBooking.mockReturnValue(of(booking('b1', 'confirmed')));
      const { fixture, root } = setup();
      expect(text(root)).toContain('That request is no longer available.');

      click(fixture, button(root, 'Accept', requestCard(root, 'b1')));

      expect(text(root)).not.toContain('That request is no longer available');
    });
  });

  describe('sessions', () => {
    it('shows loading skeletons', () => {
      getSessions.mockReturnValue(new Subject<SessionList>());
      const { root } = setup();

      expect(root.querySelectorAll('fc-skeleton').length).toBeGreaterThan(0);
      expect(text(root)).not.toContain(SESSIONS_EMPTY);
    });

    it('shows the empty state with its copy', () => {
      const { root } = setup();

      const headings = Array.from(root.querySelectorAll('h2')).map((h) => h.textContent?.trim());
      expect(headings).toContain('Today and tomorrow');
      expect(text(root)).toContain(SESSIONS_EMPTY);
      expect(text(root)).toContain('Confirmed sessions show up here.');
    });

    it('shows the error state with its copy, not the empty state', () => {
      getSessions.mockReturnValue(throwError(() => problem(500)));
      const { root } = setup();

      expect(text(root)).toContain('Could not load sessions');
      expect(text(root)).toContain('Your schedule may not be empty. Check your connection and try again.');
      expect(text(root)).not.toContain(SESSIONS_EMPTY);
    });

    it('shows the error state when the venue zone is unknown', () => {
      user.set({ ...trainer, trainerVenueTimeZone: null });
      const { root } = setup();

      expect(text(root)).toContain('Could not load sessions');
      expect(text(root)).not.toContain(SESSIONS_EMPTY);
    });

    it('shows the error state and no subtitle when the venue zone is not valid, without breaking the page', () => {
      user.set({ ...trainer, trainerVenueTimeZone: 'Europe/Warsw' });
      const badZone = { ...request('b1', 30), venue: { ...request('b1', 30).venue, timeZone: 'Europe/Warsw' } };
      getBookingRequests.mockImplementation(() => of(requestList([badZone])));
      const { root } = setup();

      expect(text(root)).toContain('Could not load sessions');
      expect(text(root)).not.toContain('Times are shown in');
      expect(root.querySelector('h1')?.textContent).toContain('Trainer home');
      // The request card still renders; its zone is shown in UTC.
      expect(requestCard(root, 'b1').textContent).toContain('UTC');
    });

    it('"Try again" loads the sessions again', () => {
      getSessions.mockReturnValueOnce(throwError(() => problem(0)));
      const { fixture, root } = setup();
      getSessions.mockImplementation(() => of(sessionList([session('s1', '2026-11-15T14:00:00Z')])));
      const panels = Array.from(root.querySelectorAll('fc-state'));
      const panel = panels.find((candidate) => candidate.textContent?.includes('Could not load sessions'));

      click(fixture, button(root, 'Try again', panel));

      expect(text(root)).toContain('Trainee s1');
    });

    it('groups sessions by day with the time range, client and venue', () => {
      getSessions.mockImplementation(() =>
        of(
          sessionList([
            session('s1', '2026-11-15T09:45:00Z'),
            session('s2', '2026-11-16T11:00:00Z'),
          ]),
        ),
      );
      const { root } = setup();

      const dayHeadings = Array.from(root.querySelectorAll('h3')).map((h) => h.textContent?.trim());
      expect(dayHeadings).toContain('Today, Sun 15 Nov');
      expect(dayHeadings).toContain('Tomorrow, Mon 16 Nov');
      const body = text(root);
      expect(body).toContain('10:45–11:45');
      expect(body).toContain('12:00–13:00');
      expect(body).toContain('Warsaw time');
      expect(body).toContain('Trainee s1');
      expect(body).toContain('Studio One');
      expect(body).not.toContain(SESSIONS_EMPTY);
    });

    it('uses the start of the venue day for the Today heading, so it does not change as the clock ticks', () => {
      getSessions.mockImplementation(() => of(sessionList([session('s1', '2026-11-15T14:00:00Z')])));
      const { fixture, root } = setup();
      const heading = () => root.querySelector('h3 time')?.getAttribute('datetime');

      // 15 Nov 2026 starts at 23:00 UTC on the 14th in Warsaw.
      expect(heading()).toBe('2026-11-14T23:00:00.000Z');

      vi.advanceTimersByTime(5_000);
      fixture.detectChanges();

      expect(heading()).toBe('2026-11-14T23:00:00.000Z');
    });

    it('omits a day with no sessions', () => {
      getSessions.mockImplementation(() => of(sessionList([session('s2', '2026-11-16T11:00:00Z')])));
      const { root } = setup();

      const dayHeadings = Array.from(root.querySelectorAll('h3')).map((h) => h.textContent?.trim());
      expect(dayHeadings).toEqual(['Tomorrow, Mon 16 Nov']);
    });

    it('drops a session when it ends', () => {
      getSessions.mockImplementation(() => of(sessionList([session('s1', '2026-11-15T09:30:00Z', 60)])));
      const { fixture, root } = setup();
      expect(text(root)).toContain('Trainee s1');

      vi.advanceTimersByTime(30 * MINUTE_MS);
      fixture.detectChanges();

      expect(text(root)).not.toContain('Trainee s1');
      expect(text(root)).toContain(SESSIONS_EMPTY);
    });

    it('keeps the list and notes the failure when a refresh fails', () => {
      getSessions.mockImplementation(() => of(sessionList([session('s1', '2026-11-15T14:00:00Z')])));
      const { fixture, root } = setup();
      getSessions.mockReturnValue(throwError(() => problem(500)));

      vi.advanceTimersByTime(30_000);
      fixture.detectChanges();

      expect(text(root)).toContain('Could not refresh. Showing the update from 11:00.');
      expect(text(root)).toContain('Trainee s1');
    });
  });
});
