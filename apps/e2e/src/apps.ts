export interface AppUnderTest {
  name: 'client-web' | 'trainer-web' | 'admin-web';
  port: number;
  role: 'client' | 'trainer' | 'admin';
  landingTitle: string;
  homeHeading: string;
  /** Whether the signed-in home shows the account email. The trainer home shows neither name nor email. */
  showsEmail: boolean;
  account: { email: string; displayName: string };
  otherRoleAccount: { email: string };
  /** A trainer an admin has not approved yet. Only the trainer app has one. */
  unapprovedTrainer?: { email: string; displayName: string };
}

const CLIENT = { email: 'client@example.com', displayName: 'Casey Client' };
const TRAINER = { email: 'trainer@example.com', displayName: 'Taylor Trainer' };
const UNAPPROVED_TRAINER = { email: 'pat.pending@example.com', displayName: 'Pat Pending' };
const ADMIN = { email: 'admin@example.com', displayName: 'Alex Admin' };

export const DEV_PASSWORD = 'password';

export const APPS: readonly AppUnderTest[] = [
  {
    name: 'client-web',
    port: 4200,
    role: 'client',
    landingTitle: 'Sign in to Fitness Connect',
    homeHeading: `Welcome, ${CLIENT.displayName}`,
    showsEmail: true,
    account: CLIENT,
    otherRoleAccount: TRAINER,
  },
  {
    name: 'trainer-web',
    port: 4201,
    role: 'trainer',
    landingTitle: 'Trainer sign in',
    homeHeading: 'Trainer home',
    showsEmail: false,
    account: TRAINER,
    otherRoleAccount: CLIENT,
    unapprovedTrainer: UNAPPROVED_TRAINER,
  },
  {
    name: 'admin-web',
    port: 4202,
    role: 'admin',
    landingTitle: 'Admin sign in',
    homeHeading: `Welcome, ${ADMIN.displayName}`,
    showsEmail: true,
    account: ADMIN,
    otherRoleAccount: CLIENT,
  },
];
