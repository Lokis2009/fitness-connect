export interface AppUnderTest {
  name: 'client-web' | 'trainer-web' | 'admin-web';
  port: number;
  role: 'client' | 'trainer' | 'admin';
  landingTitle: string;
  homeHeading: string;
  account: { email: string; displayName: string };
  otherRoleAccount: { email: string };
}

const CLIENT = { email: 'client@example.com', displayName: 'Casey Client' };
const TRAINER = { email: 'trainer@example.com', displayName: 'Taylor Trainer' };
const ADMIN = { email: 'admin@example.com', displayName: 'Alex Admin' };

export const DEV_PASSWORD = 'password';

export const APPS: readonly AppUnderTest[] = [
  {
    name: 'client-web',
    port: 4200,
    role: 'client',
    landingTitle: 'Sign in to Fitness Connect',
    homeHeading: `Welcome, ${CLIENT.displayName}`,
    account: CLIENT,
    otherRoleAccount: TRAINER,
  },
  {
    name: 'trainer-web',
    port: 4201,
    role: 'trainer',
    landingTitle: 'Trainer sign in',
    homeHeading: `Welcome, ${TRAINER.displayName}`,
    account: TRAINER,
    otherRoleAccount: CLIENT,
  },
  {
    name: 'admin-web',
    port: 4202,
    role: 'admin',
    landingTitle: 'Admin sign in',
    homeHeading: `Welcome, ${ADMIN.displayName}`,
    account: ADMIN,
    otherRoleAccount: CLIENT,
  },
];
