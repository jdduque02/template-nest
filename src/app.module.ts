import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env';
import { UserControllerController } from './controllers/user/user.controller.controller';
import { UserControllerService } from './services/user/user.controller.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateEnv,
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [UserControllerController],
  providers: [UserControllerService],
})
export class AppModule {}
