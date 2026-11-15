import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import { ApiClient, ApiError, type Session, type SessionList, type User } from '@fitness-connect/data-access';
import { type Observable, Subject, of, throwError } from 'rxjs';
import { ClockService } from './clock.service';
import { REFRESH_INTERVAL_MS } from './refresh-trigger';
import { SessionsStore } from './sessions-store';

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

function session(id: string, startsAt: string, durationMinutes = 60): Session {
  return {
    id,
    clientName: `Client ${id}`,
    startsAt,
    durationMinutes,
    venue: { name: 'Iron Hall Gym', area: 'Powisle', timeZone: 'Europe/Warsaw' },
  };
}

function list(items: Session[], serverTime = new Date(Date.now()).toISOString()): SessionList {
  return { serverTime, items };
}

function problem(status: number, code?: string): ApiError {
  return new ApiError(status, { type: 'about:blank', title: 'Problem', status, code });
}

describe('SessionsStore', () => {
  const user = signal<User | null>(trainer);
  const refreshUser = vi.fn<() => Promise<void>>();
  const getSessions = vi.fn<(from: string, to: string) => Observable<SessionList>>();

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        SessionsStore,
        provideRouter([]),
        { provide: ApiClient, useValue: { getSessions } },
        { provide: AuthService, useValue: { user, refreshUser } },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    return { store: TestBed.inject(SessionsStore), clock: TestBed.inject(ClockService), navigate };
  }

  function ids(sessions: Session[]): string[] {
    return sessions.map((item) => item.id);
  }

  async function flush(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    user.set(trainer);
    refreshUser.mockReset();
    getSessions.mockReset().mockReturnValue(of(list([])));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('loading', () => {
    it('asks for the start of today to the end of tomorrow in the venue zone', () => {
      setup();

      // Warsaw midnight of 15 Nov and of 17 Nov, one hour behind UTC in winter.
      expect(getSessions).toHaveBeenCalledWith('2026-11-14T23:00:00.000Z', '2026-11-16T23:00:00.000Z');
    });

    it('is loading until the first response, then ready', () => {
      const response = new Subject<SessionList>();
      getSessions.mockReturnValue(response);
      const { store } = setup();

      expect(store.loadState()).toBe('loading');

      response.next(list([]));

      expect(store.loadState()).toBe('ready');
    });

    it('is empty and ready when there are no sessions', () => {
      const { store } = setup();

      expect(store.loadState()).toBe('ready');
      expect(store.today()).toEqual([]);
      expect(store.tomorrow()).toEqual([]);
    });

    it('shows an error, not an empty list, when the first load fails', () => {
      getSessions.mockReturnValue(throwError(() => problem(500)));
      const { store } = setup();

      expect(store.loadState()).toBe('error');
      expect(store.today()).toEqual([]);
    });

    it('retry shows loading and then the list', () => {
      getSessions.mockReturnValueOnce(throwError(() => problem(0)));
      const { store } = setup();
      const second = new Subject<SessionList>();
      getSessions.mockReturnValue(second);

      store.retry();

      expect(store.loadState()).toBe('loading');
      second.next(list([session('s1', '2026-11-15T14:00:00Z')]));
      expect(store.loadState()).toBe('ready');
      expect(ids(store.today())).toEqual(['s1']);
    });

    it('corrects the clock with the middle of the round trip, not the arrival time', () => {
      const response = new Subject<SessionList>();
      getSessions.mockReturnValue(response);
      const { clock } = setup();
      vi.advanceTimersByTime(2000);

      response.next(list([], new Date(NOW + 1000).toISOString()));

      expect(clock.now()).toBe(NOW + 2000);
    });

    it('records the time of the last successful load', () => {
      const serverTime = new Date(NOW + 3 * MINUTE_MS).toISOString();
      getSessions.mockReturnValue(of(list([], serverTime)));
      const { store } = setup();

      expect(store.lastUpdated()).toBe(NOW + 3 * MINUTE_MS);
    });

    it('is an error and makes no request while the venue zone is unknown', () => {
      user.set({ ...trainer, trainerVenueTimeZone: null });
      const { store } = setup();

      expect(getSessions).not.toHaveBeenCalled();
      expect(store.loadState()).toBe('error');
    });

    it('treats a venue zone that is not valid like an unknown one, and keeps refreshing', () => {
      user.set({ ...trainer, trainerVenueTimeZone: 'Europe/Warsw' });
      const { store } = setup();

      expect(getSessions).not.toHaveBeenCalled();
      expect(store.loadState()).toBe('error');
      expect(store.today()).toEqual([]);
      expect(store.tomorrow()).toEqual([]);

      // The pipeline is still alive: once the zone is corrected, a retry and the poll both work.
      user.set(trainer);
      store.retry();
      expect(getSessions).toHaveBeenCalledTimes(1);
      expect(store.loadState()).toBe('ready');
      vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
      expect(getSessions).toHaveBeenCalledTimes(2);
    });

    it('loads once the zone is known after a retry', () => {
      user.set({ ...trainer, trainerVenueTimeZone: null });
      const { store } = setup();
      user.set(trainer);

      store.retry();

      expect(getSessions).toHaveBeenCalledTimes(1);
      expect(store.loadState()).toBe('ready');
    });
  });

  describe('refresh', () => {
    it('polls every 30 seconds while visible', () => {
      setup();

      vi.advanceTimersByTime(REFRESH_INTERVAL_MS);

      expect(getSessions).toHaveBeenCalledTimes(2);
    });

    it('ignores a trigger while a request is in flight', () => {
      getSessions.mockReturnValue(new Subject<SessionList>());
      const { store } = setup();

      store.refresh();

      expect(getSessions).toHaveBeenCalledTimes(1);
    });

    it('refreshAfterAccept fetches at once when nothing is in flight', () => {
      getSessions.mockReturnValueOnce(of(list([])));
      getSessions.mockReturnValueOnce(of(list([session('s1', '2026-11-15T14:00:00Z')])));
      const { store } = setup();

      store.refreshAfterAccept();

      expect(getSessions).toHaveBeenCalledTimes(2);
      expect(ids(store.today())).toEqual(['s1']);
    });

    it('refreshAfterAccept waits for a request in flight and then fetches again', () => {
      const first = new Subject<SessionList>();
      getSessions.mockReturnValueOnce(first);
      getSessions.mockReturnValueOnce(of(list([session('s1', '2026-11-15T14:00:00Z')])));
      const { store } = setup();

      store.refreshAfterAccept();
      expect(getSessions).toHaveBeenCalledTimes(1);

      first.next(list([]));
      first.complete();

      expect(getSessions).toHaveBeenCalledTimes(2);
      expect(ids(store.today())).toEqual(['s1']);
    });

    it('still ignores a poll or a manual refresh while an after-accept fetch is waiting', () => {
      const first = new Subject<SessionList>();
      getSessions.mockReturnValueOnce(first);
      getSessions.mockReturnValue(of(list([])));
      const { store } = setup();
      store.refreshAfterAccept();

      store.refresh();
      vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
      expect(getSessions).toHaveBeenCalledTimes(1);

      first.next(list([]));
      first.complete();
      expect(getSessions).toHaveBeenCalledTimes(2);
    });

    it('keeps the last list and flags the failure when a refresh fails', () => {
      getSessions.mockReturnValue(of(list([session('s1', '2026-11-15T14:00:00Z')])));
      const { store } = setup();
      const updated = store.lastUpdated();
      getSessions.mockReturnValue(throwError(() => problem(503)));

      store.refresh();

      expect(store.loadState()).toBe('ready');
      expect(ids(store.today())).toEqual(['s1']);
      expect(store.refreshFailed()).toBe(true);
      expect(store.lastUpdated()).toBe(updated);

      getSessions.mockReturnValue(of(list([session('s1', '2026-11-15T14:00:00Z')])));
      store.refresh();
      expect(store.refreshFailed()).toBe(false);
    });
  });

  describe('grouping', () => {
    it('splits sessions into today and tomorrow in the venue zone, soonest first', () => {
      getSessions.mockReturnValue(
        of(
          list([
            session('tomorrow-noon', '2026-11-16T11:00:00Z'),
            session('today-late', '2026-11-15T17:00:00Z'),
            session('today-early', '2026-11-15T12:00:00Z'),
          ]),
        ),
      );
      const { store } = setup();

      expect(ids(store.today())).toEqual(['today-early', 'today-late']);
      expect(ids(store.tomorrow())).toEqual(['tomorrow-noon']);
    });

    it('keeps the same lists while the sessions on show do not change, as the clock ticks', () => {
      getSessions.mockReturnValue(
        of(list([session('s1', '2026-11-15T14:00:00Z'), session('s2', '2026-11-16T11:00:00Z')])),
      );
      const { store } = setup();
      const today = store.today();
      const tomorrow = store.tomorrow();

      vi.advanceTimersByTime(5_000);

      expect(store.today()).toBe(today);
      expect(store.tomorrow()).toBe(tomorrow);
    });

    it('gives a new list when a session ends or a poll brings new data', () => {
      getSessions.mockReturnValueOnce(of(list([session('s1', '2026-11-15T10:30:00Z', 30)])));
      const { store } = setup();
      const before = store.today();
      expect(ids(before)).toEqual(['s1']);

      vi.advanceTimersByTime(31 * MINUTE_MS);
      expect(store.today()).toEqual([]);

      getSessions.mockReturnValue(of(list([session('s9', '2026-11-15T14:00:00Z')])));
      store.refresh();
      expect(ids(store.today())).toEqual(['s9']);
    });

    it('puts a 00:30 local session on the local day, not the UTC day', () => {
      // 23:30 UTC on the 15th is 00:30 on the 16th in Warsaw.
      getSessions.mockReturnValue(of(list([session('after-midnight', '2026-11-15T23:30:00Z')])));
      const { store } = setup();

      expect(store.today()).toEqual([]);
      expect(ids(store.tomorrow())).toEqual(['after-midnight']);
    });

    it('shows a session that started before today and is still running under today', () => {
      // Started 23:30 local on the 14th, runs until 00:30 local on the 15th. "Now" is 11:00.
      vi.setSystemTime(Date.parse('2026-11-14T23:45:00Z'));
      const { store } = setup();
      getSessions.mockReturnValue(
        of(
          list(
            [session('overnight', '2026-11-14T22:30:00Z', 120)],
            '2026-11-14T23:45:00Z',
          ),
        ),
      );

      store.refresh();

      expect(ids(store.today())).toEqual(['overnight']);
    });

    it('drops a session that falls on neither day', () => {
      getSessions.mockReturnValue(of(list([session('far', '2026-11-18T10:00:00Z')])));
      const { store } = setup();

      expect(store.today()).toEqual([]);
      expect(store.tomorrow()).toEqual([]);
    });
  });

  describe('ended sessions', () => {
    it('hides a session as the clock passes its end', () => {
      const items = [
        session('ending', '2026-11-15T09:30:00Z', 60),
        session('later', '2026-11-15T14:00:00Z', 60),
      ];
      // A server that answers every poll with the same list and its current time.
      getSessions.mockImplementation(() => of(list(items)));
      const { store } = setup();
      expect(ids(store.today())).toEqual(['ending', 'later']);

      vi.advanceTimersByTime(30 * MINUTE_MS - 1000);
      expect(ids(store.today())).toEqual(['ending', 'later']);

      vi.advanceTimersByTime(1000);
      expect(ids(store.today())).toEqual(['later']);
    });

    it('keeps a session in progress', () => {
      getSessions.mockReturnValue(of(list([session('running', '2026-11-15T09:45:00Z', 60)])));
      const { store } = setup();

      expect(ids(store.today())).toEqual(['running']);
    });

    it('hides a session that ended before the list arrived', () => {
      getSessions.mockReturnValue(of(list([session('over', '2026-11-15T08:00:00Z', 60)])));
      const { store } = setup();

      expect(store.today()).toEqual([]);
    });
  });

  describe('403 trainer-not-approved', () => {
    beforeEach(() => {
      getSessions.mockReturnValue(throwError(() => problem(403, 'trainer-not-approved')));
    });

    it('refreshes the user and goes to /setup when the status is no longer approved', async () => {
      refreshUser.mockImplementation(() => {
        user.set({ ...trainer, trainerStatus: 'incomplete' });
        return Promise.resolve();
      });
      const { navigate } = setup();
      await flush();

      expect(refreshUser).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(['/setup']);
    });

    it('shows the error when the status is still approved', async () => {
      refreshUser.mockResolvedValue();
      const { store, navigate } = setup();
      await flush();

      expect(navigate).not.toHaveBeenCalled();
      expect(store.loadState()).toBe('error');
    });

    it('shows the error when the status refresh fails', async () => {
      refreshUser.mockRejectedValue(problem(0));
      const { store, navigate } = setup();
      await flush();

      expect(navigate).not.toHaveBeenCalled();
      expect(store.loadState()).toBe('error');
    });
  });
});
