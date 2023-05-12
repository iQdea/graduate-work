import { Request } from 'express';

interface UploadMediaPreview {
  url?: string;
}

interface UploadMediaDimensions {
  width?: number;
  height?: number;
}

interface UploadMediaError {
  status?: number;
  code?: string;
  title?: string;
  detail?: string;
  stack?: string;
  fileName?: string;
}

interface UploadMedia {
  id: string;
  mimeType: string;
  fileName?: string;
  size: number;
  preview?: UploadMediaPreview;
  dimensions?: UploadMediaDimensions;
}

export interface UploadMediaResponse extends UploadMedia {}

export interface UploadMediaErrorsResponse {
  data: {
    files: UploadMediaResponse[];
    errors: UploadMediaError[];
  };
}

export interface ShowUploadMediaRequest {
  data: {
    upload: {
      id: string;
    };
    userId: string;
  };
}

export interface DownloadMediasRequest {
  downloads: {
    id: string;
    name: string;
  }[];
  userId: string;
}

export interface GetMediaRequest {
  fileId: string;
  userId?: string;
  mode?: string;
}
export interface CreateUploadMediaRequest {
  data: {
    upload: {
      request: Request;
    };
  };
}
