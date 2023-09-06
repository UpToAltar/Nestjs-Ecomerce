import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { softDeletePlugin } from 'soft-delete-plugin-mongoose';
import { SubcribersModule } from './subcribers/subcribers.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
    // Use MongoDb
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        connectionFactory: connection => {
          connection.plugin(softDeletePlugin);
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    SubcribersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
