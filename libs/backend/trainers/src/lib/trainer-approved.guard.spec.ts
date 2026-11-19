import { CodedHttpException } from '@fitness-connect/common';
import { Logger, type ExecutionContext } from '@nestjs/common';
import { TrainerApprovedGuard } from './trainer-approved.guard';
import type { TrainersService } from './trainers.service';

function contextFor(user?: { id: string }): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers: {}, user }) }),
  } as unknown as ExecutionContext;
}

describe('TrainerApprovedGuard', () => {
  function guardFor(approved: boolean) {
    const isApproved = jest.fn().mockResolvedValue(approved);
    return {
      isApproved,
      guard: new TrainerApprovedGuard({
        isApproved,
      } as unknown as TrainersService),
    };
  }

  it('lets an approved trainer through, checking the caller from the request', async () => {
    const { guard, isApproved } = guardFor(true);

    await expect(guard.canActivate(contextFor({ id: 'u-1' }))).resolves.toBe(
      true,
    );
    expect(isApproved).toHaveBeenCalledWith('u-1');
  });

  it('answers 403 trainer-not-approved for a trainer who is not approved', async () => {
    const { guard } = guardFor(false);

    const error = await guard
      .canActivate(contextFor({ id: 'u-1' }))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CodedHttpException);
    expect(error).toMatchObject({ code: 'trainer-not-approved' });
    expect((error as CodedHttpException).getStatus()).toBe(403);
  });

  it('answers 403 trainer-not-approved when the request has no user', async () => {
    const { guard, isApproved } = guardFor(true);

    await expect(guard.canActivate(contextFor())).rejects.toMatchObject({
      code: 'trainer-not-approved',
    });
    expect(isApproved).not.toHaveBeenCalled();
  });

  describe('logging a rejection', () => {
    let log: jest.SpyInstance;

    beforeEach(() => {
      log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const logged = () =>
      log.mock.calls.map(([message]) => JSON.parse(message as string));

    it('logs one line at log level when a trainer is not approved', async () => {
      const { guard } = guardFor(false);

      await expect(guard.canActivate(contextFor({ id: 'u-1' }))).rejects.toThrow();

      expect(logged()).toEqual([
        { event: 'trainer.rejected', trainerId: 'u-1', code: 'trainer-not-approved' },
      ]);
    });

    it('logs a request with no user with a null trainer id', async () => {
      const { guard } = guardFor(true);

      await expect(guard.canActivate(contextFor())).rejects.toThrow();

      expect(logged()).toEqual([
        { event: 'trainer.rejected', trainerId: null, code: 'trainer-not-approved' },
      ]);
    });

    it('logs nothing for an approved trainer', async () => {
      const { guard } = guardFor(true);

      await guard.canActivate(contextFor({ id: 'u-1' }));

      expect(log).not.toHaveBeenCalled();
    });
  });
});
