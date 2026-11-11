import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService, type User } from '@fitness-connect/auth';
import { App } from './app';
import { appRoutes } from './app.routes';

const admin: User = {
  id: '6f1c1d4e-7a52-4a39-9d52-1f3c2f6f5a10',
  email: 'admin@example.com',
  displayName: 'Test admin',
  role: 'admin',
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

  it('renders the sign in landing page at /login', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/login');
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Admin sign in');
  });

  it('renders the home page for a signed-in admin', async () => {
    user.set(admin);
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('fc-signed-in-home')).not.toBeNull();
  });
});
