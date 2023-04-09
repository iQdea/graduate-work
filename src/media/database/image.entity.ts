import { Entity, PrimaryKey, PrimaryKeyType, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity({
  schema: 'storage_s3_media',
  tableName: 'image'
})
export class Image extends BaseEntity<Image> {
  @PrimaryKey()
  @Property({
    columnType: 'uuid'
  })
  uploadId!: string;

  @PrimaryKey()
  @Property({
    comment: 'type of image size (example: s | m | l | thumb)'
  })
  sizeType!: string;

  @Property()
  mimeType!: string;

  @Property()
  width!: number;

  @Property()
  heigth!: number;

  [PrimaryKeyType]?: [string, string];

  constructor(uploadId: string, sizeType: string) {
    super();
    this.uploadId = uploadId;
    this.sizeType = sizeType;
  }
}
