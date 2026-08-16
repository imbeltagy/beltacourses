import { Transform } from 'class-transformer';

/**
 * `multipart/form-data` carries every field as a string, so `confirmed=false`
 * arrives as the *truthy* string `"false"`. This coerces the two spellings a
 * form can produce and passes anything else through untouched, so `@IsBoolean()`
 * still rejects junk rather than silently reading it as `true`.
 */
export const ToBoolean = () =>
  Transform(({ value }): unknown => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  });

/**
 * A form cannot send JSON `null`, so clearing a field is spelled as the empty
 * string. Maps `""` to `null` and leaves everything else alone.
 */
export const EmptyStringToNull = () =>
  Transform(({ value }): unknown => (value === '' ? null : value));
