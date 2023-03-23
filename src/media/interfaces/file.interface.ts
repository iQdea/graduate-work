import { FileInfo } from 'busboy';
import { Error } from '../../filters/http-exception.filter';
import { UploadGroup } from '../database/upload.entity';

export interface File extends FileInfo {
  id: string;
  key: string;
  extension: string;
  isSaved: boolean;
  size: number;
  group?: UploadGroup;
  preview?: {
    url?: string;
  };
  dimensions: {
    width: number;
    height: number;
  };
  error?: Error;
}

export interface ListenFilesRequest {
  data: {
    upload: {
      files: Promise<File>[];
    };
  };
}
