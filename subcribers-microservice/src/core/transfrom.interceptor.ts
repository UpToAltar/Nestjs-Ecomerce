import { Reflector } from '@nestjs/core'
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { ResponseMessageKey } from 'src/decorators/customize';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
export interface Response<T> {
    statusCode: number;
  	data: T;
	message: string;
}

    @Injectable()
    export class TransformationInterceptor<T>
      implements NestInterceptor<T, Response<T>>
    {
      constructor(private reflector: Reflector) {}

      intercept(
        context: ExecutionContext,
        next: CallHandler
      ): Observable<Response<T>> {
        const responseMessage = this.reflector.get<string>(
          ResponseMessageKey,
          context.getHandler()
        ) ?? ''

        return next.handle().pipe(
          map((data) => ({
            data,
            statusCode: context.switchToHttp().getResponse().statusCode,
            message: responseMessage
          }))
        )
      }
    }