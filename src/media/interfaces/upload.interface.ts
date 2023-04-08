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
  };
}
export interface DownloadMediaRequest {
  data: {
    download: {
      id: string;
      mimeType: string;
    };
  };
}

export interface DownloadMediasRequest {
  downloads: {
    id: string;
    mimeType: string;
    name: string;
  }[];
}
export interface CreateUploadMediaRequest {
  data: {
    upload: {
      request: Request;
    };
  };
}

export interface UploadImageByUrlsRequest {
  data: {
    upload: {
      urls: string[];
    };
  };
}

export interface UploadImageByUrlsResponse {
  data: {
    upload: {
      ids: string[];
    };
  };
}
