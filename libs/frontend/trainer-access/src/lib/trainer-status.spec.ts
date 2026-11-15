import type { Role, TrainerStatus, User } from '@fitness-connect/data-access';
import { trainerStatusOf } from './trainer-status';

function userWith(role: Role, extra: Partial<User> = {}): User {
  return {
    id: '6f1c1d4e-7a52-4a39-9d52-1f3c2f6f5a10',
    email: `${role}@example.com`,
    displayName: role,
    role,
    ...extra,
  };
}

describe('trainerStatusOf', () => {
  it.each<TrainerStatus>(['incomplete', 'submitted', 'changes_requested', 'approved'])(
    'returns %s for a trainer with that status',
    (status) => {
      expect(trainerStatusOf(userWith('trainer', { trainerStatus: status }))).toBe(status);
    },
  );

  it('returns null for a signed-out user', () => {
    expect(trainerStatusOf(null)).toBeNull();
  });

  it('returns null for an undefined user', () => {
    expect(trainerStatusOf(undefined)).toBeNull();
  });

  it('returns null for a trainer without the field', () => {
    expect(trainerStatusOf(userWith('trainer'))).toBeNull();
  });

  it('returns null for a trainer whose status is null', () => {
    expect(trainerStatusOf(userWith('trainer', { trainerStatus: null }))).toBeNull();
  });

  it.each<Role>(['client', 'admin'])('returns null for a %s', (role) => {
    expect(trainerStatusOf(userWith(role))).toBeNull();
  });

  it('returns null for a non-trainer even if the field is set', () => {
    expect(trainerStatusOf(userWith('client', { trainerStatus: 'approved' }))).toBeNull();
  });
});
