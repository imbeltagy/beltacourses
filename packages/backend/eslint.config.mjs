import { createConfig } from '@repo/eslint-config/nestjs';

export default createConfig({ tsconfigRootDir: import.meta.dirname });
