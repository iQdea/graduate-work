import { CallHandler, ClassSerializerInterceptor, ExecutionContext, Injectable, StreamableFile } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CollectionResponseBody, SingularResponseBody } from '../../logic/decorators';

@Injectable()
export class ResponseSerializerInterceptor extends ClassSerializerInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((responseBody: SingularResponseBody | CollectionResponseBody | StreamableFile) => {
        try {
          if (responseBody instanceof StreamableFile) {
            return responseBody;
          } else {
            const { dto, data: plainData, meta, errors } = responseBody;
            const data = plainToInstance(dto, plainData);
            return {
              data: this.serialize(data, {}),
              errors,
              meta
            };
          }
        } catch {
          return {};
        }
      })
    );
  }
}
