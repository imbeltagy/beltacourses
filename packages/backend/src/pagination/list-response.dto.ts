import type { Paginated } from './pagination.types';
import type { PaginationMetadataDto } from './pagination-metadata.dto';

export abstract class ListResponseDto<T> implements Paginated<T> {
  abstract data: T[];
  abstract meta: PaginationMetadataDto;
}
