import { NotFoundError } from '@mikro-orm/core';
import { ArgumentsHost, Catch, HttpException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AbstractHttpAdapter, BaseExceptionFilter } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

export type Error = {
  status: number;
  code?: string;
  title: string;
  detail?: string;
  stack?: string;
  source?: { [key: string]: string };
};

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  public readonly isDev: boolean;

  constructor(httpAdapter: AbstractHttpAdapter, config: ConfigService, private readonly logger = new Logger()) {
    super(httpAdapter);
    this.isDev = config.get('env') === 'development';
  }

  private buildErrors(exception: any, status: number): Error[] {
    const errors: Error[] = [];
    let detail: string;

    if (exception instanceof HttpException) {
      detail = exception.message;
    } else if (exception instanceof NotFoundError) {
      detail = exception.message;
    } else if (typeof exception === 'string') {
      detail = exception;
    } else {
      detail = (exception && exception.message) || 'Unknown error';
    }

    const error: Error = {
      detail,
      status,
      code: exception.code,
      title: 'error'
    };

    if (this.isDev) {
      error.stack = exception.stack;
    }

    if (exception.response && Array.isArray(exception.response.message)) {
      for (const message of exception.response.message) {
        errors.push({
          ...error,
          detail: message,
          status: exception.response.statusCode,
          source: {
            point: message
          }
        });
      }
    } else if (Array.isArray(exception)) {
      for (const it of exception) {
        errors.push({
          ...error,
          detail: it.message,
          stack: it.stack
        });
      }
    } else {
      errors.push(error);
    }

    return errors;
  }

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    if (
      !(
        exception instanceof UnauthorizedException ||
        exception instanceof NotFoundException ||
        exception instanceof NotFoundError
      )
    ) {
      this.logger.error(exception);
    }

    let code = 404;
    if (exception instanceof HttpException) {
      code = exception.getStatus();
    } else if (exception instanceof NotFoundError) {
      code = request.method !== 'GET' ? 422 : code;
    }
    if (exception.message.startsWith('Failed to lookup')) {
      exception.message = 'Page not found';
    }

    const errors: Error[] = this.buildErrors(exception, code);
    if (code == 404) {
      response.status(code).render('404');
    } else {
      response.status(code).json({
        errors,
        meta: {
          total: errors.length
        }
      });
    }
  }
}
