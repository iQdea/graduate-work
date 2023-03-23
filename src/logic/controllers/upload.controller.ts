import { Controller, Param, Req } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Endpoint, EndpointResponse } from '../decorators';
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
    path: '',
    protected: true,
    response: CreateUploadMediaResponse,
    summary: 'Загрузить файл или несколько'
  })
  async createUploadMedia(@Req() request: Request): EndpointResponse<CreateUploadMediaResponse> {
    const userId = '3785dca6-2b1b-401e-b883-d760881bd527';
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
      data: { files: response.data.files },
      errors: response.data.errors,
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
  async showUploadMedia(@Param('id') id: string): EndpointResponse<ShowUploadMediaResponse> {
    const media = await this.uploadService.showUploadMedia({
      data: {
        upload: {
          id
        }
      }
    });

    return {
      dto: ShowUploadMediaResponse,
      data: media ?? ({} as ShowUploadMediaResponse)
    };
  }
}
