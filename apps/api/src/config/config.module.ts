import { ConfigModule } from '@nestjs/config';
import { envSchema } from './env.validation';

export const AppConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  validate: (config: Record<string, unknown>) => {
    const result = envSchema.safeParse(config);
    if (!result.success) {
      const messages = result.error.issues
        .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
        .join('\n');
      throw new Error(`\n❌ Environment validation failed:\n${messages}\n`);
    }
    return result.data;
  },
});
