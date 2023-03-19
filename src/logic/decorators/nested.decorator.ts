import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export function Nested<T>(NestedObject: { new (): T }, isArray: boolean = false, optional: boolean = false) {
  const apiPropertyOptions = {
    type: isArray ? [NestedObject] : NestedObject
  };

  return applyDecorators(
    Expose(),
    Type(() => NestedObject),
    optional ? ApiPropertyOptional(apiPropertyOptions) : ApiProperty(apiPropertyOptions),
    ValidateNested(isArray ? { each: true } : {})
  );
}
