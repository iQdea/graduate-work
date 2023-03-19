import { Exclude } from 'class-transformer';
import { FileUploadMediaResponse } from './upload.dto';

@Exclude()
export class ImageDto extends FileUploadMediaResponse {}
