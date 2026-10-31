import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@repo/backend/pagination';
import { Role } from '@repo/db';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsIn(Object.values(Role))
  role?: Role;

  @ApiPropertyOptional({
    description: 'Matches name or email, case-insensitive.',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
