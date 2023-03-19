import { PrimaryKey, Property, BaseEntity as OrmBaseEntity, OptionalProps } from '@mikro-orm/core';

export type BaseEntityOptional = 'createdAt' | 'updatedAt';

export abstract class BaseEntity<T extends BaseEntity<T, any>, Optional extends keyof T = never> extends OrmBaseEntity<
  T,
  'id',
  '_id'
> {
  @PrimaryKey({
    comment: 'Entity identifier in UUID format. Generated automatically on DB level',
    type: 'uuid',
    defaultRaw: 'uuid_generate_v1()'
  })
  id!: string;

  @Property({
    comment: 'Entity creation date'
  })
  createdAt: Date = new Date();

  @Property({
    comment: 'Last edit date. Updated automatically on any change',
    onUpdate: () => new Date()
  })
  updatedAt: Date = new Date();

  @Property({
    comment: 'Entity should be considered as soft-deleted if this date is not null',
    nullable: true
  })
  deletedAt?: Date;

  [OptionalProps]?: BaseEntityOptional | Optional;
}
