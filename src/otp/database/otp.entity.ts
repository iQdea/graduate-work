import { Entity, Enum, Property } from '@mikro-orm/core';
import { OtpSubject } from '../../logic/enums';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity({
  schema: 'storage_s3_otp',
  tableName: 'otp'
})
export class Otp extends BaseEntity<Otp> {
  @Property()
  hash!: string;

  @Property({
    comment: 'Expiration date'
  })
  expiresAt!: Date;

  @Property({
    columnType: 'uuid'
  })
  userId!: string;

  @Enum({
    items: () => OtpSubject
  })
  subject!: OtpSubject;

  @Property({
    default: 1
  })
  attempt: number = 1;
}
