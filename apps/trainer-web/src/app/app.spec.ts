import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService, type User } from '@fitness-connect/auth';
import { ApiClient } from '@fitness-connect/data-access';
import { of } from 'rxjs';
import { App } from './app';
import { appRoutes } from './app.routes';

const trainer: User = {
  id: '5b1e6c2e-0f5e-4a3b-9d6f-0a6c1d2e3f40',
  email: 'trainer@example.com',
  displayName: 'Tina Trainer',
  role: 'trainer',
  trainerStatus: 'approved',
  trainerStatusNote: null,
  trainerVenueTimeZone: 'Europe/Warsaw',
};

describe('App', () => {
  beforeEach(async () => {
    const user = signal<User | null>(trainer);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(appRoutes),
        {
          provide: AuthService,
          useValue: { user, isAuthenticated: computed(() => user() !== null) },
        },
        {
          provide: ApiClient,
          useValue: {
            getMe: () => of(trainer),
            getBookingRequests: () =>
              of({ serverTime: new Date().toISOString(), items: [] }),
            getSessions: () =>
              of({ serverTime: new Date().toISOString(), items: [] }),
          },
        },
      ],
    }).compileComponents();
  });

  it('renders the trainer home from the shared UI library', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(
      compiled.querySelector('fc-trainer-home h1')?.textContent,
    ).toContain('Trainer home');
  });
});
