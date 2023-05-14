import { Controller, Param, Req } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiExceptions, Endpoint, EndpointResponse, UserId } from '../decorators';
import { UploadService } from '../../media/upload.service';
import { Request } from 'express';
import { CreateUploadMediaResponse, ShowUploadMediaResponse } from '../dto/upload.dto';

@ApiTags('Upload')
@Controller({
  path: 'upload',
  version: '1'
})
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary'
          }
        }
      }
    }
  })
  @Endpoint('post', {
    protected: true,
    response: CreateUploadMediaResponse,
    summary: 'Загрузить файл или несколько'
  })
  @ApiExceptions({
    unauthorized: {
      status: 401,
      description: 'Unauthorized'
    }
  })
  async createUploadMedia(
    @Req() request: Request,
    @UserId() userId: string
  ): EndpointResponse<CreateUploadMediaResponse> {
    const response = await this.uploadService.createUploadMedia(
      {
        data: {
          upload: {
            request
          }
        }
      },
      userId
    );

    return {
      dto: CreateUploadMediaResponse,
      data: {
        files: response.data.files,
        errors: response.data.errors
      },
      meta: {
        uploads: {
          total: response.data.files.length
        }
      }
    };
  }

  @Endpoint('get', {
    path: 'show/:id',
    protected: true,
    response: ShowUploadMediaResponse,
    summary: 'Получить информацию о загруженном файле'
  })
  @ApiExceptions({
    forbidden: {
      status: 403,
      description: 'Access denied'
    },
    not_found: {
      status: 404,
      description: 'Content not found'
    },
    unauthorized: {
      status: 401,
      description: 'Unauthorized'
    }
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'id of upload',
    example: 'fee87de1-5f34-4cce-b38b-644e2a99f40f'
  })
  async showUploadMedia(@Param('id') id: string, @UserId() userId: string): EndpointResponse<ShowUploadMediaResponse> {
    const media = await this.uploadService.showUploadMedia({
      data: {
        upload: {
          id
        },
        userId
      }
    });

    return {
      dto: ShowUploadMediaResponse,
      data: media
    };
  }
}
