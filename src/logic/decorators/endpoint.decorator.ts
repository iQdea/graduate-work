import {
  applyDecorators,
  Delete,
  Get,
  Head,
  HttpCode,
  HttpStatus,
  Options,
  Patch,
  Post,
  Put,
  Type,
  UseGuards
} from '@nestjs/common';
import { ClassTransformOptions } from '@nestjs/common/interfaces/external/class-transform-options.interface';
import {
  ApiAcceptedResponse,
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiDefaultResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiFoundResponse,
  ApiGatewayTimeoutResponse,
  ApiGoneResponse,
  ApiInternalServerErrorResponse,
  ApiMethodNotAllowedResponse,
  ApiMovedPermanentlyResponse,
  ApiNoContentResponse,
  ApiNotAcceptableResponse,
  ApiNotFoundResponse,
  ApiNotImplementedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiPreconditionFailedResponse,
  ApiRequestTimeoutResponse,
  ApiResponse,
  ApiResponseOptions,
  ApiSecurity,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiUnsupportedMediaTypeResponse,
  getSchemaPath
} from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ClassConstructor } from 'class-transformer';
import { groupBy } from 'lodash';
import { AuthGuard } from '../guards/auth.guard';

enum HttpMethodEnum {
  get = 'get',
  post = 'post',
  put = 'put',
  patch = 'patch',
  delete = 'delete',
  head = 'head',
  options = 'options'
}
enum ExceptionsEnum {
  ok = 'ok',
  created = 'created',
  accepted = 'accepted',
  no_content = 'no_content',
  moved_permanently = 'moved_permanently',
  found = 'found',
  bad_request = 'bad_request',
  unauthorized = 'unauthorized',
  not_found = 'not_found',
  forbidden = 'forbidden',
  method_not_allowed = 'method_not_allowed',
  not_acceptable = 'not_acceptable',
  request_timeout = 'request_timeout',
  conflict = 'conflict',
  precondition_failed = 'precondition_failed',
  too_many_requests = 'too_many_requests',
  gone = 'gone',
  payload_too_large = 'payload_too_large',
  unsupported_media_type = 'unsupported_media_type',
  unprocessable_entity = 'unprocessable_entity',
  internal_server_error = 'internal_server_error',
  not_implemented = 'not_implemented',
  bad_gateway = 'bad_gateway',
  service_unavailable = 'service_unavailable',
  gateway_timeout = 'gateway_timeout',
  default = 'default'
}

function getApiBodyDecorator(dataSchema: Type<unknown>, metaSchema?: Type<unknown>) {
  const properties: { data: { $ref: string }; meta?: { $ref: string } } = {
    data: {
      $ref: getSchemaPath(dataSchema)
    }
  };
  if (metaSchema) {
    properties.meta = { $ref: getSchemaPath(metaSchema) };
  }
  return ApiBody({
    schema: {
      allOf: [
        {
          properties
        }
      ]
    }
  });
}

function getResponseSchema(model?: Type<unknown>, schema: SchemaObject = {}, isArray = false): SchemaObject {
  if (!model) {
    return {
      allOf: [
        {
          properties: {}
        }
      ],
      ...schema
    };
  }

  let data: any = {
    $ref: getSchemaPath(model)
  };

  if (isArray) {
    data = {
      type: 'array',
      items: {
        $ref: getSchemaPath(model)
      }
    };
  }

  return {
    allOf: [
      {
        properties: {
          data
        }
      }
    ],
    ...schema
  };
}

const HttpApiMethodsMap: Record<
  HttpMethodEnum | keyof typeof HttpMethodEnum,
  (path?: string | string[]) => MethodDecorator
> = {
  [HttpMethodEnum.get]: Get,
  [HttpMethodEnum.post]: Post,
  [HttpMethodEnum.put]: Put,
  [HttpMethodEnum.patch]: Patch,
  [HttpMethodEnum.delete]: Delete,
  [HttpMethodEnum.head]: Head,
  [HttpMethodEnum.options]: Options
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ApiExceptionsMap: Record<
  ExceptionsEnum | keyof typeof ExceptionsEnum,
  (options?: ApiResponseOptions) => MethodDecorator & ClassDecorator
> = {
  [ExceptionsEnum.ok]: ApiOkResponse,
  [ExceptionsEnum.created]: ApiCreatedResponse,
  [ExceptionsEnum.accepted]: ApiAcceptedResponse,
  [ExceptionsEnum.no_content]: ApiNoContentResponse,
  [ExceptionsEnum.moved_permanently]: ApiMovedPermanentlyResponse,
  [ExceptionsEnum.found]: ApiFoundResponse,
  [ExceptionsEnum.bad_request]: ApiBadRequestResponse,
  [ExceptionsEnum.unauthorized]: ApiUnauthorizedResponse,
  [ExceptionsEnum.not_found]: ApiNotFoundResponse,
  [ExceptionsEnum.forbidden]: ApiForbiddenResponse,
  [ExceptionsEnum.method_not_allowed]: ApiMethodNotAllowedResponse,
  [ExceptionsEnum.not_acceptable]: ApiNotAcceptableResponse,
  [ExceptionsEnum.request_timeout]: ApiRequestTimeoutResponse,
  [ExceptionsEnum.conflict]: ApiConflictResponse,
  [ExceptionsEnum.precondition_failed]: ApiPreconditionFailedResponse,
  [ExceptionsEnum.too_many_requests]: ApiTooManyRequestsResponse,
  [ExceptionsEnum.gone]: ApiGoneResponse,
  [ExceptionsEnum.payload_too_large]: ApiPayloadTooLargeResponse,
  [ExceptionsEnum.unsupported_media_type]: ApiUnsupportedMediaTypeResponse,
  [ExceptionsEnum.unprocessable_entity]: ApiUnprocessableEntityResponse,
  [ExceptionsEnum.internal_server_error]: ApiInternalServerErrorResponse,
  [ExceptionsEnum.not_implemented]: ApiNotImplementedResponse,
  [ExceptionsEnum.bad_gateway]: ApiBadGatewayResponse,
  [ExceptionsEnum.service_unavailable]: ApiServiceUnavailableResponse,
  [ExceptionsEnum.gateway_timeout]: ApiGatewayTimeoutResponse,
  [ExceptionsEnum.default]: ApiDefaultResponse
};

export interface EndpointResponseOptions {
  status?: HttpStatus;
  schema?: SchemaObject;
}

export type EndpointResponseType = [HttpStatus, Type<unknown>?, EndpointResponseOptions?];

export interface EndpointOptions {
  path?: string;
  stage?: string;
  response?: Type<unknown> | EndpointResponseType[];
  request?: Type<unknown>;
  meta?: Type<unknown>;
  query?: Record<string, Type<unknown>>; // TODO: add support for query DTO
  status?: HttpStatus;
  schema?: SchemaObject;
  summary?: string;
  protected?: boolean;
  collection?: boolean;
  default_response?: EndpointResponseOptions;
}

export interface EndpointResponseBody<D = Record<string, any>, M = Record<string, any>> {
  dto: ClassConstructor<D>;
  meta?: M;
  errors?: M;
  options?: ClassTransformOptions;
}

export interface SingularResponseBody<D = Record<string, any>, M = Record<string, any>>
  extends EndpointResponseBody<D, M> {
  data: D;
}

export interface CollectionResponseBody<D = Record<string, any>, M = Record<string, any>>
  extends EndpointResponseBody<D, M> {
  data: D[];
}

export type EndpointResponse<D> = Promise<SingularResponseBody<D>>;
export type CollectionResponse<D> = Promise<CollectionResponseBody<D>>;
export type EmptyEndpointResponse = Promise<void>;

export function Endpoint(
  method: HttpMethodEnum | keyof typeof HttpMethodEnum,
  options: EndpointOptions
): MethodDecorator {
  const path = options.path || '';
  const decorators: MethodDecorator[] = [
    HttpCode(options.status || HttpStatus.OK),
    ApiOperation({
      summary: options.summary
    }),
    HttpApiMethodsMap[method](path)
  ];

  if (options.protected) {
    decorators.push(UseGuards(AuthGuard), ApiSecurity('x-user'));
  }

  if (options.stage) {
    decorators.push(ApiTags(options.stage));
  }

  // Extra models
  const extraModels: Type<unknown>[] = [];

  // Register request DTO
  if (options.request && options.meta) {
    extraModels.push(options.request, options.meta);
    decorators.push(getApiBodyDecorator(options.request, options.meta));
  } else if (options.request) {
    extraModels.push(options.request);
    decorators.push(getApiBodyDecorator(options.request));
  }

  // Responses
  const responseModels: { status: HttpStatus; schema: SchemaObject }[] = [];

  // Response is not specified - return empty object
  if (!options.response) {
    responseModels.push({
      status: options.default_response?.status || HttpStatus.OK,
      schema: options.default_response?.schema || getResponseSchema()
    });
  }

  // Single response specified - return 200 OK and specified model
  else if (!Array.isArray(options.response)) {
    extraModels.push(options.response);
    responseModels.push({
      status: options.default_response?.status || HttpStatus.OK,
      schema: options.default_response?.schema || getResponseSchema(options.response, undefined, options.collection)
    });

    // Array of responses specified - create anyOf schema from provided models
  } else {
    // Register error response DTOs
    if (options.response) {
      for (const [responseStatus, responseModel, responseOptions] of options.response) {
        if (responseModel) {
          extraModels.push(responseModel);
        }

        responseModels.push({
          status: responseStatus,
          schema: getResponseSchema(responseModel, responseOptions && responseOptions.schema, options.collection)
        });
      }
    }
  }

  // Group responses by HTTP status
  const groupedErrors = groupBy(responseModels, (item) => item.status);
  for (const [status, group] of Object.entries(groupedErrors)) {
    decorators.push(
      ApiResponse({
        status: Number.parseInt(status, 10),
        schema:
          group.length === 1
            ? group[0].schema
            : {
                anyOf: group.map((g) => g.schema)
              }
      })
    );
  }

  // Apply method decorators
  return applyDecorators(...decorators, ApiExtraModels(...extraModels));
}

export function ApiExceptions(exceptions: { [key in ExceptionsEnum]?: ApiResponseOptions }): MethodDecorator &
  ClassDecorator {
  const decorators = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [key, value] of Object.entries(exceptions)) {
    if (Object.keys(ExceptionsEnum).includes(key)) {
      decorators.push(eval(`ApiExceptionsMap.${key}(value)`));
    }
  }
  return applyDecorators(...decorators);
}
