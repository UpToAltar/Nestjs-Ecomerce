import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { TransformationInterceptor } from './core/transform.interceptor';
import cookieParser from 'cookie-parser';
import { config } from 'aws-sdk';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  
  // config env
  const configService = app.get<ConfigService>(ConfigService);
  
  // config cookie
  app.use(cookieParser());
  // Config Validation
  app.useGlobalPipes(new ValidationPipe({whitelist:true}));

  // config response data
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new TransformationInterceptor(reflector));
  // config version
  app.setGlobalPrefix('api');
  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  })

  // config cors
  // Config CORS
  app.enableCors({
  "origin": true,
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false,
  "optionsSuccessStatus": 204,
  credentials: true
  });

  // Config aws s3
  config.update({
    accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
    secretAccessKey: configService.get('AWS_ACCESS_SECRET_KEY'),
    region: configService.get('AWS_S3_REGION'),
  });

  //config helmet
  app.use(helmet());

  // Config swagger
  const configSwagger = new DocumentBuilder()
    .setTitle('NESTJS ECOMMERCE API')
    .setDescription(`The NESTJS ECOMMERCE API description, Some api are required authentication,
      if you use your DB, please config your DB in .env file,
      Database is mongodb, you can use mongodb atlas or local mongodb,
      database is inserted automatically when you run the project,
    `)
    .setVersion('1.0')
    .addBearerAuth(
          {
            type: 'http',
            scheme: 'Bearer',
            bearerFormat: 'JWT',
            in: 'header',
          },
          'token',
        )
    .addSecurityRequirements('token')
    .build();
  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(configService.get<string>('PORT'));
}
bootstrap();
