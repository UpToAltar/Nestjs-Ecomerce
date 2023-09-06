import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from "@nestjs/config";
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { TransformationInterceptor } from './core/transfrom.interceptor';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new Logger(),
  })
  const configService = app.get<ConfigService>(ConfigService)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
          urls: [configService.get<string>('RABBITMQ_URL')],
          queue: 'subcribers_queue',
          queueOptions: {
                durable: false,
            },
      },
    })
  
  app.startAllMicroservices()
}
bootstrap();
