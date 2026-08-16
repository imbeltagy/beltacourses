import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

/**
 * Runs a payload through the same transform-then-validate pass the global pipe
 * in `main.ts` performs, without standing up HTTP. Returns the transformed DTO
 * and the names of the properties that failed, which is all these specs assert
 * on.
 */
export const check = async <T extends object>(
  cls: ClassConstructor<T>,
  payload: Record<string, unknown>,
) => {
  const dto = plainToInstance(cls, payload);
  const errors = await validate(dto, { whitelist: true });

  return {
    dto: dto as Record<string, unknown>,
    failed: errors.map((error) => error.property),
  };
};
