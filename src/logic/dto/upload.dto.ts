import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { Nested } from '../decorators';

@Exclude()
export class UploadErrorResponse {
  @Expose()
  @ApiProperty()
  status?: number;

  @Expose()
  @ApiProperty()
  code?: string;

  @Expose()
  @ApiPropertyOptional()
  title?: string;

  @Expose()
  @ApiPropertyOptional()
  detail?: string;

  @Expose()
  @ApiProperty()
  stack?: string;

  @Expose()
  @ApiProperty()
  fileName?: string;
}

@Exclude()
class PreviewUploadMediaResponse {
  @Expose()
  @ApiPropertyOptional()
  url?: string;
}

@Exclude()
class DimensionsUploadMediaResponse {
  @Expose()
  @ApiProperty()
  width?: number;

  @Expose()
  @ApiProperty()
  height?: number;
}

@Exclude()
export class FileUploadMediaResponse {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  mimeType!: string;

  @Expose()
  @ApiProperty()
  size!: number;

  @Expose()
  @ApiPropertyOptional()
  fileName?: string;

  @Expose()
  @ApiPropertyOptional()
  @Nested(PreviewUploadMediaResponse)
  preview?: PreviewUploadMediaResponse;

  @Expose()
  @ApiPropertyOptional()
  @Nested(DimensionsUploadMediaResponse)
  dimensions?: DimensionsUploadMediaResponse;
}

@Exclude()
export class CreateUploadMediaResponse {
  @Expose()
  @ApiPropertyOptional()
  @Nested(FileUploadMediaResponse, true)
  files?: FileUploadMediaResponse[];
}

@Exclude()
export class ShowUploadMediaResponse extends FileUploadMediaResponse {}

@Exclude()
export class ShowUploadErrorsResponse {
  @Expose()
  @ApiPropertyOptional()
  @Nested(UploadErrorResponse, true)
  errors?: UploadErrorResponse[];
}

@Exclude()
export class Medias {
  @Expose()
  @ApiProperty()
  id!: string;

  @Expose()
  @ApiProperty()
  name!: string;
}
@Exclude()
export class DownloadMedias {
  @Expose()
  @ApiProperty()
  @Nested(Medias, true)
  downloads!: Medias[];
}
