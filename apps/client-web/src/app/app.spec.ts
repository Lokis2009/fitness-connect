import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@fitness-connect/auth';
import { App } from './app';
import { appRoutes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(appRoutes),
        {
          provide: AuthService,
          useValue: {
            user: () => null,
            isAuthenticated: computed(() => false),
            signIn: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  });

  it('renders the routed page inside the root component', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/login');
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('router-outlet + fc-login-page')).not.toBeNull();
    expect(root.textContent).toContain('Sign in to Fitness Connect');
  });
});
