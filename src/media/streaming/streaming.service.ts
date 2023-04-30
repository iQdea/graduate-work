import { Readable, ReadableOptions } from 'stream';
import { S3 } from 'aws-sdk';
import { Logger } from '@nestjs/common';

export type StreamingOptions = {
  parameters: S3.GetObjectRequest;
  s3: S3;
  maxLength: number;
  byteRange?: number;
  range?: string;
};

export class StreamingService extends Readable {
  private readonly logger = new Logger(StreamingService.name);
  _currentCursorPosition = 0;
  _s3DataRange: number;
  _maxContentLength: number;
  _s3: S3;
  _s3StreamParams: S3.GetObjectRequest;
  _range?: string;

  constructor(options: StreamingOptions, nodeReadableStreamOptions?: ReadableOptions) {
    super(nodeReadableStreamOptions);
    this._maxContentLength = options.maxLength;
    this._s3 = options.s3;
    this._s3StreamParams = options.parameters;
    this._s3DataRange = options.byteRange || 1024 * 1024;
    this._range = options.range;
  }

  adjustByteRange(bytes: number) {
    this._s3DataRange = bytes;
  }

  _read() {
    if (this._currentCursorPosition > this._maxContentLength) {
      this.push(null);
    } else {
      const range = this._currentCursorPosition + this._s3DataRange;
      const adjustedRange = range < this._maxContentLength ? range : this._maxContentLength;
      this._s3StreamParams.Range = `bytes=${this._currentCursorPosition}-${adjustedRange}`;
      this._currentCursorPosition = adjustedRange + 1;
      if (this._range) {
        this._s3StreamParams.Range = this._range;
        const start = Number.parseInt(this._range.replace('bytes=', '').split('-')[0]);
        const end = Number.parseInt(this._range.replace('bytes=', '').split('-')[1]);
        this._currentCursorPosition = end + 1;
        this._s3DataRange = end - start;
        this._maxContentLength = end;
      }
      this._s3.getObject(this._s3StreamParams, (error, data) => {
        this.logger.log(
          `fetched range ${this._s3StreamParams.Bucket}/${this._s3StreamParams.Key} | ${this._s3StreamParams.Range}`
        );
        if (error) {
          this.destroy(error);
        } else {
          this.push(data.Body);
        }
      });
    }
  }
}
