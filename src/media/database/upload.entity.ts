import { Entity, Enum, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../common/entities/base.entity';
import { UploadGroup } from './upload-group';

@Entity({
  schema: 'storage_s3_media',
  tableName: 'upload'
})
export class Upload extends BaseEntity<Upload> {
  @Property({
    columnType: 'uuid'
  })
  userId!: string;

  @Property({
    default: false
  })
  isReady?: boolean;

  @Enum({
    items: () => UploadGroup,
    default: ''
  })
  group!: UploadGroup;
}
