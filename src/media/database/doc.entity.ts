import { Entity, PrimaryKey, PrimaryKeyType, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity({
  schema: 'storage_s3_media',
  tableName: 'document'
})
export class Document extends BaseEntity<Document> {
  @PrimaryKey()
  @Property({
    columnType: 'uuid'
  })
  uploadId!: string;

  @Property()
  mimeType!: string;

  [PrimaryKeyType]?: [string];

  constructor(uploadId: string) {
    super();
    this.uploadId = uploadId;
  }
}
