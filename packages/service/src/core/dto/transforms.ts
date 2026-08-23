import type { TransformFnParams } from 'class-transformer';

/** Multipart forms send booleans as the strings "true"/"false". */
export function toBoolean({ value }: TransformFnParams): unknown {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

/** A blank form field means "not provided" on create. */
export function blankToUndefined({ value }: TransformFnParams): unknown {
  return value === '' ? undefined : value;
}

/** A blank form field means "clear this" on update — forms can't send JSON null. */
export function blankToNull({ value }: TransformFnParams): unknown {
  return value === '' ? null : value;
}
