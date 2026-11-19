import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import type { User } from '@fitness-connect/data-access';
import { TrainerSetup } from './trainer-setup';

const trainer: User = {
  id: '6f1c1d4e-7a52-4a39-9d52-1f3c2f6f5a10',
  email: 'tess@example.com',
  displayName: 'Tess Trainer',
  role: 'trainer',
  trainerStatus: 'submitted',
  trainerStatusNote: null,
};

describe('TrainerSetup', () => {
  const user = signal<User | null>(trainer);
  const refreshUser = vi.fn<() => Promise<void>>();
  const signOut = vi.fn<() => void>();

  async function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { user, isAuthenticated: computed(() => user() !== null), refreshUser, signOut },
        },
      ],
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(TrainerSetup);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const button = (label: string) =>
      Array.from(root.querySelectorAll<HTMLButtonElement>('fc-button button')).find((b) =>
        b.textContent?.includes(label),
      );
    return { fixture, root, navigate, button };
  }

  function withStatus(
    trainerStatus: User['trainerStatus'],
    trainerStatusNote: User['trainerStatusNote'] = null,
  ) {
    user.set({ ...trainer, trainerStatus, trainerStatusNote });
  }

  beforeEach(() => {
    user.set(trainer);
    refreshUser.mockReset().mockResolvedValue(undefined);
    signOut.mockReset();
  });

  it('refreshes the user once on entry', async () => {
    await setup();

    expect(refreshUser).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      'incomplete',
      'Your profile is not ready yet',
      'Profile setup is not available yet. Your account is waiting for it.',
    ],
    [
      'submitted',
      'Your profile is under review',
      'An admin is reviewing your profile. Check again later.',
    ],
    ['changes_requested', 'Changes needed', 'An admin asked for changes.'],
  ] as const)('shows the heading and body for status %s', async (status, heading, body) => {
    withStatus(status);
    const { root } = await setup();

    expect(root.querySelector('h1')?.textContent).toContain(heading);
    expect(root.textContent).toContain(body);
  });

  it('shows the admin note when changes were requested', async () => {
    withStatus('changes_requested', 'Please add a photo of your venue.');
    const { root } = await setup();

    expect(root.textContent).toContain('Please add a photo of your venue.');
  });

  it.each([null, '', '   '])('shows a fallback line when the admin note is %j', async (note) => {
    withStatus('changes_requested', note);
    const { root } = await setup();

    expect(root.textContent).toContain('No reason was given.');
  });

  it('does not show the admin note for other statuses', async () => {
    withStatus('submitted', 'Leftover note');
    const { root } = await setup();

    expect(root.textContent).not.toContain('Leftover note');
    expect(root.textContent).not.toContain('No reason was given.');
  });

  it('shows a fallback when the status is null', async () => {
    withStatus(null);
    const { root } = await setup();

    expect(root.querySelector('h1')?.textContent).toContain('We could not read your status');
    expect(root.textContent).toContain('Check again to update it.');
  });

  it('shows the new status after Check again', async () => {
    const { fixture, root, button } = await setup();
    expect(root.querySelector('h1')?.textContent).toContain('under review');

    refreshUser.mockImplementation(async () => withStatus('changes_requested', 'Fix the venue.'));
    button('Check again')?.click();
    await fixture.whenStable();

    expect(refreshUser).toHaveBeenCalledTimes(2);
    expect(root.querySelector('h1')?.textContent).toContain('Changes needed');
    expect(root.textContent).toContain('Fix the venue.');
  });

  it('does not navigate while the status is not approved', async () => {
    const { fixture, navigate, button } = await setup();

    button('Check again')?.click();
    await fixture.whenStable();

    expect(navigate).not.toHaveBeenCalled();
  });

  it('navigates to / when the refresh on entry returns approved', async () => {
    refreshUser.mockImplementation(async () => withStatus('approved'));
    const { navigate } = await setup();

    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('navigates to / when Check again returns approved', async () => {
    const { fixture, navigate, button } = await setup();
    expect(navigate).not.toHaveBeenCalled();

    refreshUser.mockImplementation(async () => withStatus('approved'));
    button('Check again')?.click();
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('shows an error with a retry when the refresh fails and keeps the last status', async () => {
    refreshUser.mockRejectedValue(new Error('offline'));
    const { root } = await setup();

    const alert = root.querySelector('fc-state [role="alert"]');
    expect(alert?.textContent).toContain('Could not check your status');
    expect(root.querySelector('h1')?.textContent).toContain('under review');
  });

  it('retries the refresh and clears the error on success', async () => {
    refreshUser.mockRejectedValueOnce(new Error('offline'));
    const { fixture, root, button } = await setup();
    expect(root.querySelector('fc-state')).not.toBeNull();

    button('Try again')?.click();
    await fixture.whenStable();

    expect(refreshUser).toHaveBeenCalledTimes(2);
    expect(root.querySelector('fc-state')).toBeNull();
  });

  it('shows no error before the refresh fails', async () => {
    const { root } = await setup();

    expect(root.querySelector('fc-state')).toBeNull();
  });

  it('signs out and goes to the login page', async () => {
    const { fixture, navigate, button } = await setup();

    button('Sign out')?.click();
    await fixture.whenStable();

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
