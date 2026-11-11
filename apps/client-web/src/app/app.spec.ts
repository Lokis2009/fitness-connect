import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import type { User } from '@fitness-connect/data-access';
import { App } from './app';
import { appRoutes } from './app.routes';

const client: User = {
  id: '6f1c1d4e-7a52-4a39-9d52-1f3c2f6f5a10',
  email: 'client@example.com',
  displayName: 'Casey Client',
  role: 'client',
};

describe('App', () => {
  const user = signal<User | null>(null);

  beforeEach(async () => {
    user.set(null);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(appRoutes),
        {
          provide: AuthService,
          useValue: { user, isAuthenticated: computed(() => user() !== null) },
        },
      ],
    }).compileComponents();
  });

  async function open(url: string) {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    await fixture.whenStable();
    return { fixture, router };
  }

  it('sends a visitor who is not signed in to the login page', async () => {
    const { router } = await open('/');
    expect(router.url).toContain('/login');
  });

  it('opens the home page for a signed-in client', async () => {
    user.set(client);
    const { fixture, router } = await open('/');
    expect(router.url).toBe('/');
    expect(fixture.nativeElement.querySelector('fc-home')).not.toBeNull();
  });
});
