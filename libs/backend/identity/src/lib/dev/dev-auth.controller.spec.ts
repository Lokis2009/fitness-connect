import { IS_PUBLIC_KEY } from '@fitness-connect/common';
import { DevAuthController } from './dev-auth.controller';
import type { DevAuthService } from './dev-auth.service';

describe('DevAuthController', () => {
  const response = {
    accessToken: 'token',
    user: {
      id: '6f3d9a0e-1b0f-4a43-9d8a-2f5a3e0d9c11',
      email: 'client@example.com',
      displayName: 'Casey Client',
      role: 'client' as const,
    },
  };

  it('delegates the credentials to the dev auth service', async () => {
    const login = jest.fn().mockResolvedValue(response);
    const controller = new DevAuthController({
      login,
    } as unknown as DevAuthService);
    const body = { email: 'client@example.com', password: 'password' };

    await expect(controller.login(body)).resolves.toBe(response);
    expect(login).toHaveBeenCalledWith(body);
  });

  it('is public, because the caller has no token yet', () => {
    expect(
      Reflect.getMetadata(IS_PUBLIC_KEY, DevAuthController.prototype.login),
    ).toBe(true);
  });
});
