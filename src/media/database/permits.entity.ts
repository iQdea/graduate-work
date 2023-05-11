import { Entity, Enum, PrimaryKey, PrimaryKeyType, Property } from '@mikro-orm/core';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserPermits } from './user-permits';

@Entity({
  schema: 'storage_s3_media',
  tableName: 'permits'
})
export class Image extends BaseEntity<Image> {
  @PrimaryKey()
  @Property({
    columnType: 'uuid'
  })
  userId!: string;

  @Enum({
    items: () => UserPermits,
    default: UserPermits.customer
  })
  permits!: UserPermits;

  [PrimaryKeyType]?: [string, string];

  constructor(userId: string) {
    super();
    this.userId = userId;
  }
}
