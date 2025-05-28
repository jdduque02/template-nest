import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Uso global (main.ts)
  app.useGlobalInterceptors(new ResponseInterceptor({ enableLogging: true }));
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
