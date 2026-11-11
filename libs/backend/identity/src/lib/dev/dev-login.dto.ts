import type { components } from '@fitness-connect/api-contract';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

type DevLoginRequest = components['schemas']['DevLoginRequest'];

/** Request body of `POST /dev/login`, the `DevLoginRequest` schema of the contract. */
export class DevLoginDto implements DevLoginRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export type DevLoginResponseDto = components['schemas']['DevLoginResponse'];
