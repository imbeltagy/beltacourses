import type { Provider } from '@nestjs/common';
import {
  AccessTokenGuard,
  PermissionsGuard,
  PermissionsRepository,
  RolesGuard,
  SessionService as CoreSessionService,
  TokenService as CoreTokenService,
} from '@repo/backend/core';
import { SessionRepository } from './session.repository';
import { SessionService } from './session.service';
import { TokensUtil } from './tokens.util';

/**
 * TEMPORARY (removed with `packages/backend/core` when the global AuthGuard
 * lands). The core guards still inject core's `TokenService`/`SessionService`;
 * these providers answer those tokens from the new `TokensUtil` and Redis
 * session model, so `@Auth()` keeps working on the new tokens.
 */
export const LEGACY_GUARD_PROVIDERS: Provider[] = [
  TokensUtil,
  SessionService,
  SessionRepository,
  {
    provide: CoreTokenService,
    inject: [TokensUtil],
    useFactory: (tokens: TokensUtil) => ({
      verifyAccessToken: (token: string) => ({
        ...tokens.verifyAccess(token),
        typ: 'access' as const,
      }),
    }),
  },
  {
    provide: CoreSessionService,
    inject: [SessionService],
    useFactory: (sessions: SessionService) => ({
      hasSession: async (userId: string, sid: string) => {
        const session = await sessions.get(sid);
        return session?.userId === userId;
      },
    }),
  },
  PermissionsRepository,
  AccessTokenGuard,
  RolesGuard,
  PermissionsGuard,
];
