import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { RESPONSE_MESSAGE_KEY } from '../decorators';
import { PageLinksDto } from '../dto';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const message =
      this.reflector.get<string>(
        RESPONSE_MESSAGE_KEY,
        context.getHandler(),
      ) || 'Success';

    const statusCode = context.switchToHttp().getResponse().statusCode;
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((result) => {
        if (result?.meta) {
          const links = new PageLinksDto(
            request.path,
            result.meta,
            result.meta.itemPerPage,
          );

          return {
            status: true,
            statusCode,
            message,
            data: result.data,
            meta: { page: result.meta },
            links,
          };
        }

        return {
          status: true,
          statusCode,
          message,
          data: result,
        };
      }),
    );
  }
}
