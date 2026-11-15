import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import {
  ApiClient,
  ApiError,
  type Booking,
  type BookingRequest,
  type BookingRequestList,
  type User,
} from '@fitness-connect/data-access';
import { type Observable, Subject, of, throwError } from 'rxjs';
import { ClockService } from './clock.service';
import { REFRESH_INTERVAL_MS } from './refresh-trigger';
import type { CardState } from './request-card-state';
import { RequestsStore } from './requests-store';

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

function request(id: string, minutesLeft: number): BookingRequest {
  return {
    id,
    clientName: `Client ${id}`,
    startsAt: '2026-11-16T10:00:00Z',
    durationMinutes: 60,
    priceMinor: 12000,
    currency: 'PLN',
    venue: { name: 'Iron Hall Gym', area: 'Powisle', timeZone: 'Europe/Warsaw' },
    requestedAt: new Date(NOW - 10 * MINUTE_MS).toISOString(),
    expiresAt: new Date(NOW + minutesLeft * MINUTE_MS).toISOString(),
  };
}

function list(items: BookingRequest[], serverTime = new Date(Date.now()).toISOString()): BookingRequestList {
  return { serverTime, items };
}

function booking(id: string, status: Booking['status']): Booking {
  return { id, status, startsAt: '2026-11-16T10:00:00Z', decidedAt: new Date(NOW).toISOString() };
}

function problem(status: number, code?: string): ApiError {
  return new ApiError(status, { type: 'about:blank', title: 'Problem', status, code });
}

describe('RequestsStore', () => {
  const user = signal<User | null>(trainer);
  const refreshUser = vi.fn<() => Promise<void>>();
  const getBookingRequests = vi.fn<() => Observable<BookingRequestList>>();
  const acceptBooking = vi.fn<(id: string) => Observable<Booking>>();
  const declineBooking = vi.fn<(id: string) => Observable<Booking>>();
  let visibility: 'visible' | 'hidden';

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        RequestsStore,
        provideRouter([]),
        { provide: ApiClient, useValue: { getBookingRequests, acceptBooking, declineBooking } },
        { provide: AuthService, useValue: { user, refreshUser } },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const store = TestBed.inject(RequestsStore);
    const clock = TestBed.inject(ClockService);
    return { store, clock, navigate };
  }

  function stateOf(store: RequestsStore, id: string): CardState | undefined {
    return store.cards().find((card) => card.request.id === id)?.state;
  }

  function ids(store: RequestsStore): string[] {
    return store.cards().map((card) => card.request.id);
  }

  async function flush(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    visibility = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
    user.set(trainer);
    refreshUser.mockReset();
    getBookingRequests.mockReset().mockReturnValue(of(list([])));
    acceptBooking.mockReset();
    declineBooking.mockReset();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('loading', () => {
    it('is loading until the first response, then ready', () => {
      const response = new Subject<BookingRequestList>();
      getBookingRequests.mockReturnValue(response);
      const { store } = setup();

      expect(store.loadState()).toBe('loading');
      expect(store.cards()).toEqual([]);

      response.next(list([request('b1', 30)]));

      expect(store.loadState()).toBe('ready');
      expect(ids(store)).toEqual(['b1']);
    });

    it('adds new requests as idle cards', () => {
      getBookingRequests.mockReturnValue(of(list([request('b1', 30)])));
      const { store } = setup();

      expect(stateOf(store, 'b1')).toEqual({ kind: 'idle' });
    });

    it('corrects the clock with the server time and records the update time', () => {
      const serverTime = new Date(NOW + 5 * MINUTE_MS).toISOString();
      getBookingRequests.mockReturnValue(of(list([], serverTime)));
      const { store, clock } = setup();

      expect(clock.now()).toBe(NOW + 5 * MINUTE_MS);
      expect(store.lastUpdated()).toBe(NOW + 5 * MINUTE_MS);
    });

    it('has no update time before the first response', () => {
      getBookingRequests.mockReturnValue(new Subject<BookingRequestList>());
      const { store } = setup();

      expect(store.lastUpdated()).toBeNull();
    });

    it('is in the error state, not empty, when the first load fails', () => {
      getBookingRequests.mockReturnValue(throwError(() => problem(500)));
      const { store } = setup();

      expect(store.loadState()).toBe('error');
      expect(store.cards()).toEqual([]);
      expect(store.lastUpdated()).toBeNull();
    });

    it('retry shows loading again and then the list', () => {
      getBookingRequests.mockReturnValueOnce(throwError(() => problem(0)));
      const { store } = setup();
      const second = new Subject<BookingRequestList>();
      getBookingRequests.mockReturnValue(second);

      store.retry();

      expect(store.loadState()).toBe('loading');
      second.next(list([request('b1', 30)]));
      expect(store.loadState()).toBe('ready');
      expect(ids(store)).toEqual(['b1']);
    });

    it('remembers which requests the first load returned, and keeps that set', () => {
      getBookingRequests.mockReturnValue(of(list([request('b1', 30)])));
      const { store } = setup();
      expect(store.firstLoadIds()).toEqual(new Set(['b1']));

      getBookingRequests.mockReturnValue(of(list([request('b1', 30), request('b2', 40)])));
      store.refresh();

      expect(store.firstLoadIds()).toEqual(new Set(['b1']));
    });

    it('has no first-load ids before the first success', () => {
      getBookingRequests.mockReturnValue(throwError(() => problem(500)));
      const { store } = setup();

      expect(store.firstLoadIds()).toBeNull();
    });
  });

  describe('refresh', () => {
    it('polls every 30 seconds while visible', () => {
      setup();
      expect(getBookingRequests).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(REFRESH_INTERVAL_MS);

      expect(getBookingRequests).toHaveBeenCalledTimes(2);
    });

    it('ignores a trigger while a request is in flight (exhaustMap)', () => {
      const response = new Subject<BookingRequestList>();
      getBookingRequests.mockReturnValue(response);
      const { store } = setup();

      store.refresh();
      store.refresh();

      expect(getBookingRequests).toHaveBeenCalledTimes(1);
    });

    it('accepts a new trigger once the request finished', () => {
      const { store } = setup();

      store.refresh();

      expect(getBookingRequests).toHaveBeenCalledTimes(2);
    });

    it('keeps the last list and flags the failure when a refresh fails', () => {
      getBookingRequests.mockReturnValue(of(list([request('b1', 30)])));
      const { store } = setup();
      const updated = store.lastUpdated();
      getBookingRequests.mockReturnValue(throwError(() => problem(500)));

      store.refresh();

      expect(store.loadState()).toBe('ready');
      expect(ids(store)).toEqual(['b1']);
      expect(store.refreshFailed()).toBe(true);
      expect(store.lastUpdated()).toBe(updated);
    });

    it('clears the failure flag on the next success', () => {
      getBookingRequests.mockReturnValue(of(list([request('b1', 30)])));
      const { store } = setup();
      getBookingRequests.mockReturnValue(throwError(() => problem(500)));
      store.refresh();
      getBookingRequests.mockReturnValue(of(list([request('b1', 30)])));

      store.refresh();

      expect(store.refreshFailed()).toBe(false);
    });

    it('is not flagged as a failed refresh when there was never data', () => {
      getBookingRequests.mockReturnValue(throwError(() => problem(500)));
      const { store } = setup();

      expect(store.refreshFailed()).toBe(false);
    });

    it('does not poll while the tab is hidden', () => {
      visibility = 'hidden';
      setup();
      expect(getBookingRequests).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 3);

      expect(getBookingRequests).toHaveBeenCalledTimes(1);
    });

    it('refetches when the tab becomes visible again', () => {
      const { store } = setup();
      expect(store.loadState()).toBe('ready');
      visibility = 'hidden';
      document.dispatchEvent(new Event('visibilitychange'));
      expect(getBookingRequests).toHaveBeenCalledTimes(1);

      visibility = 'visible';
      document.dispatchEvent(new Event('visibilitychange'));

      expect(getBookingRequests).toHaveBeenCalledTimes(2);
    });
  });

  describe('merging a poll', () => {
    it('removes an idle card the server no longer lists', () => {
      getBookingRequests.mockReturnValue(of(list([request('b1', 30), request('b2', 40)])));
      const { store } = setup();
      getBookingRequests.mockReturnValue(of(list([request('b2', 40)])));

      store.refresh();

      expect(ids(store)).toEqual(['b2']);
    });

    it('adds a new request that arrives in a later poll', () => {
      getBookingRequests.mockReturnValue(of(list([request('b1', 30)])));
      const { store } = setup();
      getBookingRequests.mockReturnValue(of(list([request('b1', 30), request('b2', 20)])));

      store.refresh();

      expect(ids(store)).toEqual(['b2', 'b1']);
      expect(stateOf(store, 'b2')).toEqual({ kind: 'idle' });
    });

    it('never applies a response to a card in submitting', () => {
      getBookingRequests.mockReturnValue(of(list([request('b1', 30)])));
      const { store } = setup();
      acceptBooking.mockReturnValue(new Subject<Booking>());
      store.accept('b1');
      const before = store.cards()[0];
      getBookingRequests.mockReturnValue(of(list([{ ...request('b1', 30), clientName: 'Changed' }])));

      store.refresh();

      expect(store.cards()[0]).toEqual(before);
      expect(stateOf(store, 'b1')).toEqual({ kind: 'submitting', action: 'accept' });
    });

    it('keeps a submitting card even when the server drops it', () => {
      getBookingRequests.mockReturnValue(of(list([request('b1', 30)])));
      const { store } = setup();
      acceptBooking.mockReturnValue(new Subject<Booking>());
      store.accept('b1');
      getBookingRequests.mockReturnValue(of(list([])));

      store.refresh();

      expect(ids(store)).toEqual(['b1']);
    });

    it('keeps resolved cards in place after the server list drops them', () => {
      getBookingRequests.mockReturnValue(of(list([request('b1', 30), request('b2', 40)])));
      const { store } = setup();
      acceptBooking.mockReturnValue(of(booking('b1', 'confirmed')));
      store.accept('b1');
      getBookingRequests.mockReturnValue(of(list([request('b2', 40)])));

      store.refresh();

      expect(ids(store)).toContain('b1');
      expect(stateOf(store, 'b1')?.kind).toBe('accepted');
    });

    it('keeps a card whose answer failed, so the trainer can retry', () => {
      getBookingRequests.mockReturnValue(of(list([request('b1', 30)])));
      const { store } = setup();
      acceptBooking.mockReturnValue(throwError(() => problem(0)));
      store.accept('b1');
      getBookingRequests.mockReturnValue(of(list([])));

      store.refresh();

      expect(stateOf(store, 'b1')?.kind).toBe('failed');
    });

    it('keeps the state of an idle card and takes the fresh request data', () => {
      getBookingRequests.mockReturnValue(of(list([request('b1', 30)])));
      const { store } = setup();
      getBookingRequests.mockReturnValue(of(list([{ ...request('b1', 30), clientName: 'Renamed' }])));

      store.refresh();

      expect(store.cards()[0].request.clientName).toBe('Renamed');
      expect(stateOf(store, 'b1')).toEqual({ kind: 'idle' });
    });

    it('sorts open cards by deadline, with resolved cards after them', () => {
      getBookingRequests.mockReturnValue(
        of(list([request('late', 50), request('soon', 10), request('middle', 30)])),
      );
      const { store } = setup();
      expect(ids(store)).toEqual(['soon', 'middle', 'late']);
      declineBooking.mockReturnValue(of(booking('soon', 'declined')));

      store.decline('soon');

      expect(ids(store)).toEqual(['middle', 'late', 'soon']);
    });

    it('orders resolved cards by deadline among themselves', () => {
      getBookingRequests.mockReturnValue(
        of(list([request('a', 10), request('b', 20), request('c', 30)])),
      );
      const { store } = setup();
      declineBooking.mockReturnValue(of(booking('b', 'declined')));
      acceptBooking.mockReturnValue(of(booking('a', 'confirmed')));

      store.decline('b');
      store.accept('a');

      expect(ids(store)).toEqual(['c', 'a', 'b']);
    });
  });

  describe('answering a request', () => {
    beforeEach(() => {
      getBookingRequests.mockReturnValue(of(list([request('b1', 30), request('b2', 40)])));
    });

    it('moves to submitting while the call is in flight, then to accepted', () => {
      const response = new Subject<Booking>();
      acceptBooking.mockReturnValue(response);
      const { store } = setup();

      store.accept('b1');

      expect(acceptBooking).toHaveBeenCalledWith('b1');
      expect(stateOf(store, 'b1')).toEqual({ kind: 'submitting', action: 'accept' });
      expect(stateOf(store, 'b2')).toEqual({ kind: 'idle' });

      const result = booking('b1', 'confirmed');
      response.next(result);
      expect(stateOf(store, 'b1')).toEqual({ kind: 'accepted', booking: result });
    });

    it('counts accepted answers, and only those', () => {
      acceptBooking.mockReturnValue(of(booking('b1', 'confirmed')));
      declineBooking.mockReturnValue(of(booking('b2', 'declined')));
      const { store } = setup();
      expect(store.acceptedCount()).toBe(0);

      store.decline('b2');
      expect(store.acceptedCount()).toBe(0);

      store.accept('b1');
      expect(store.acceptedCount()).toBe(1);
    });

    it('does not count an accept that failed or came back as unavailable', () => {
      acceptBooking.mockReturnValueOnce(throwError(() => problem(0)));
      acceptBooking.mockReturnValueOnce(throwError(() => problem(409, 'booking-expired')));
      const { store } = setup();

      store.accept('b1');
      store.accept('b2');

      expect(acceptBooking).toHaveBeenCalledTimes(2);
      expect(store.acceptedCount()).toBe(0);
    });

    it('moves to declined on a decline', () => {
      const result = booking('b1', 'declined');
      declineBooking.mockReturnValue(of(result));
      const { store } = setup();

      store.decline('b1');

      expect(declineBooking).toHaveBeenCalledWith('b1');
      expect(stateOf(store, 'b1')).toEqual({ kind: 'declined', booking: result });
    });

    it('ignores a second tap while submitting', () => {
      acceptBooking.mockReturnValue(new Subject<Booking>());
      const { store } = setup();

      store.accept('b1');
      store.decline('b1');
      store.accept('b1');

      expect(acceptBooking).toHaveBeenCalledTimes(1);
      expect(declineBooking).not.toHaveBeenCalled();
    });

    it('ignores an id that is not on the page', () => {
      const { store } = setup();

      store.accept('missing');
      store.decline('missing');

      expect(acceptBooking).not.toHaveBeenCalled();
      expect(declineBooking).not.toHaveBeenCalled();
    });

    it('ignores a tap on a resolved card', () => {
      acceptBooking.mockReturnValue(of(booking('b1', 'confirmed')));
      const { store } = setup();
      store.accept('b1');

      store.decline('b1');

      expect(declineBooking).not.toHaveBeenCalled();
    });

    it.each([
      ['expired', 409, 'booking-expired'],
      ['withdrawn', 409, 'booking-withdrawn'],
      ['answered', 409, 'booking-not-pending'],
      ['answered', 404, undefined],
    ] as const)('shows unavailable (%s) on %i %s and refetches once', (reason, status, code) => {
      acceptBooking.mockReturnValue(throwError(() => problem(status, code)));
      const { store } = setup();
      const before = getBookingRequests.mock.calls.length;

      store.accept('b1');

      expect(stateOf(store, 'b1')).toEqual({ kind: 'unavailable', reason });
      expect(getBookingRequests).toHaveBeenCalledTimes(before + 1);
    });

    it.each([
      ['a network error', 0],
      ['a server error', 500],
    ])('shows failed on %s, keeps the action and does not refetch', (_label, status) => {
      declineBooking.mockReturnValue(throwError(() => problem(status)));
      const { store } = setup();
      const before = getBookingRequests.mock.calls.length;

      store.decline('b1');

      expect(stateOf(store, 'b1')).toEqual({ kind: 'failed', action: 'decline' });
      expect(getBookingRequests).toHaveBeenCalledTimes(before);
    });

    it('shows failed on an error that is not an ApiError', () => {
      acceptBooking.mockReturnValue(throwError(() => new Error('boom')));
      const { store } = setup();

      store.accept('b1');

      expect(stateOf(store, 'b1')).toEqual({ kind: 'failed', action: 'accept' });
    });

    it('retries the kept action from failed', () => {
      acceptBooking.mockReturnValueOnce(throwError(() => problem(500)));
      const { store } = setup();
      store.accept('b1');
      const result = booking('b1', 'confirmed');
      acceptBooking.mockReturnValue(of(result));

      store.retryAnswer('b1');

      expect(acceptBooking).toHaveBeenCalledTimes(2);
      expect(stateOf(store, 'b1')).toEqual({ kind: 'accepted', booking: result });
    });

    it('lets the trainer pick the other action from failed', () => {
      acceptBooking.mockReturnValue(throwError(() => problem(500)));
      declineBooking.mockReturnValue(new Subject<Booking>());
      const { store } = setup();
      store.accept('b1');

      store.decline('b1');

      expect(stateOf(store, 'b1')).toEqual({ kind: 'submitting', action: 'decline' });
    });

    it('retryAnswer does nothing on a card that has not failed', () => {
      const { store } = setup();

      store.retryAnswer('b1');
      store.retryAnswer('missing');

      expect(acceptBooking).not.toHaveBeenCalled();
      expect(declineBooking).not.toHaveBeenCalled();
    });

    it('treats a 401 like a failed answer and keeps the card visible', () => {
      acceptBooking.mockReturnValue(throwError(() => problem(401)));
      const { store } = setup();

      store.accept('b1');

      expect(ids(store)).toContain('b1');
      expect(stateOf(store, 'b1')?.kind).toBe('failed');
    });
  });

  describe('403 trainer-not-approved', () => {
    beforeEach(() => {
      getBookingRequests.mockReturnValue(of(list([request('b1', 30)])));
      acceptBooking.mockReturnValue(throwError(() => problem(403, 'trainer-not-approved')));
    });

    it('refreshes the user and goes to /setup when the status is no longer approved', async () => {
      refreshUser.mockImplementation(() => {
        user.set({ ...trainer, trainerStatus: 'changes_requested' });
        return Promise.resolve();
      });
      const { store, navigate } = setup();

      store.accept('b1');
      await flush();

      expect(refreshUser).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(['/setup']);
    });

    it('shows the failed card when the status is still approved', async () => {
      refreshUser.mockResolvedValue();
      const { store, navigate } = setup();

      store.accept('b1');
      await flush();

      expect(navigate).not.toHaveBeenCalled();
      expect(stateOf(store, 'b1')).toEqual({ kind: 'failed', action: 'accept' });
    });

    it('shows the failed card when the status refresh fails', async () => {
      refreshUser.mockRejectedValue(problem(0));
      const { store, navigate } = setup();

      store.accept('b1');
      await flush();

      expect(navigate).not.toHaveBeenCalled();
      expect(stateOf(store, 'b1')).toEqual({ kind: 'failed', action: 'accept' });
    });

    it('treats a 403 on the list the same way', async () => {
      refreshUser.mockImplementation(() => {
        user.set({ ...trainer, trainerStatus: 'submitted' });
        return Promise.resolve();
      });
      getBookingRequests.mockReturnValue(throwError(() => problem(403, 'trainer-not-approved')));
      const { navigate } = setup();
      await flush();

      expect(navigate).toHaveBeenCalledWith(['/setup']);
    });

    it('shows the list error when a 403 on the list does not change the status', async () => {
      refreshUser.mockResolvedValue();
      getBookingRequests.mockReturnValue(throwError(() => problem(403, 'trainer-not-approved')));
      const { store, navigate } = setup();
      await flush();

      expect(navigate).not.toHaveBeenCalled();
      expect(store.loadState()).toBe('error');
    });
  });

  describe('a refresh that follows a change on the server', () => {
    it('waits for a poll in flight and then fetches again after an unavailable answer', () => {
      const poll = new Subject<BookingRequestList>();
      getBookingRequests.mockReturnValueOnce(of(list([request('b1', 30)])));
      getBookingRequests.mockReturnValueOnce(poll);
      getBookingRequests.mockReturnValue(of(list([])));
      acceptBooking.mockReturnValue(throwError(() => problem(409, 'booking-expired')));
      const { store } = setup();
      vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
      expect(getBookingRequests).toHaveBeenCalledTimes(2);

      store.accept('b1');
      expect(stateOf(store, 'b1')).toEqual({ kind: 'unavailable', reason: 'expired' });
      expect(getBookingRequests).toHaveBeenCalledTimes(2);

      // The poll started before the 409 was known, so its list may still show the request.
      poll.next(list([request('b1', 30)]));
      poll.complete();

      expect(getBookingRequests).toHaveBeenCalledTimes(3);
    });

    it('waits for a poll in flight and then fetches again when a card reaches its deadline', () => {
      const poll = new Subject<BookingRequestList>();
      getBookingRequests.mockReturnValueOnce(of(list([request('b1', 1)])));
      getBookingRequests.mockReturnValueOnce(poll);
      getBookingRequests.mockReturnValue(of(list([])));
      const { store } = setup();

      vi.advanceTimersByTime(60_000);
      TestBed.tick();
      expect(stateOf(store, 'b1')).toEqual({ kind: 'expired' });
      expect(getBookingRequests).toHaveBeenCalledTimes(2);

      poll.next(list([request('b1', 0.5)]));
      poll.complete();

      expect(getBookingRequests).toHaveBeenCalledTimes(3);
    });

    it('still drops a poll or a manual refresh while a fetch is in flight or waiting', () => {
      const poll = new Subject<BookingRequestList>();
      getBookingRequests.mockReturnValueOnce(poll);
      getBookingRequests.mockReturnValue(of(list([])));
      const { store } = setup();

      store.refresh();
      vi.advanceTimersByTime(REFRESH_INTERVAL_MS);

      expect(getBookingRequests).toHaveBeenCalledTimes(1);
    });
  });

  describe('deadline', () => {
    /** A server that answers every poll with the same list and its current time. */
    function serve(items: BookingRequest[]): void {
      getBookingRequests.mockImplementation(() => of(list(items)));
    }

    it('expires an idle card when the clock reaches its deadline and refetches once', () => {
      serve([request('b1', 1.25), request('b2', 30)]);
      const { store } = setup();

      vi.advanceTimersByTime(75_000 - 1000);
      TestBed.tick();
      expect(stateOf(store, 'b1')).toEqual({ kind: 'idle' });
      const before = getBookingRequests.mock.calls.length;

      vi.advanceTimersByTime(1000);
      TestBed.tick();

      expect(stateOf(store, 'b1')).toEqual({ kind: 'expired' });
      expect(stateOf(store, 'b2')).toEqual({ kind: 'idle' });
      expect(getBookingRequests).toHaveBeenCalledTimes(before + 1);
    });

    it('does not refetch again for a card that already expired', () => {
      serve([request('b1', 1.25)]);
      const { store } = setup();

      vi.advanceTimersByTime(75_000);
      TestBed.tick();
      const afterExpiry = getBookingRequests.mock.calls.length;
      vi.advanceTimersByTime(5000);
      TestBed.tick();

      expect(stateOf(store, 'b1')?.kind).toBe('expired');
      expect(getBookingRequests).toHaveBeenCalledTimes(afterExpiry);
    });

    it('keeps an expired card in place when the server drops it', () => {
      serve([request('b1', 1.25)]);
      const { store } = setup();
      vi.advanceTimersByTime(75_000);
      TestBed.tick();

      serve([]);
      store.refresh();

      expect(ids(store)).toEqual(['b1']);
      expect(stateOf(store, 'b1')?.kind).toBe('expired');
    });

    it('does not expire a card that is submitting', () => {
      serve([request('b1', 1)]);
      acceptBooking.mockReturnValue(new Subject<Booking>());
      const { store } = setup();
      store.accept('b1');

      vi.advanceTimersByTime(2 * MINUTE_MS);
      TestBed.tick();

      expect(stateOf(store, 'b1')).toEqual({ kind: 'submitting', action: 'accept' });
    });

    it('uses the server clock, not the device clock', () => {
      const serverTime = new Date(NOW + 10 * MINUTE_MS).toISOString();
      getBookingRequests.mockReturnValue(of(list([request('b1', 5)], serverTime)));
      const { store } = setup();
      TestBed.tick();

      // The server says it is already 10 minutes later, so the 5 minute request has passed.
      expect(stateOf(store, 'b1')?.kind).toBe('expired');
    });
  });
});
