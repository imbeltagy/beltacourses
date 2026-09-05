import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MODERATOR_ROLES } from '@repo/service/core';
import { Auth } from '../auth/decorators/auth.decorator';
import { StorageService } from './storage.service';
import type { UploadedFile } from './storage.types';
import { SoftDeleteFilesDto } from './dto/request/soft-delete-files.dto';
import { FileMetadataResponse } from './dto/response/file-metadata.dto';
import { SoftDeleteFilesResponse } from './dto/response/soft-delete-files.dto';
import { UploadedFileResponse } from './dto/response/uploaded-file.dto';
import { FileMetadata } from '@repo/db';

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  @Auth()
  @ApiOperation({
    summary: 'Upload one or more files',
    description: 'returns a list in same order as request',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description:
            'One or more files. Repeat the field for multiple files.',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: [UploadedFileResponse] })
  upload(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<UploadedFile[]> {
    return this.storageService.uploadMany(files);
  }

  /** Must stay declared before `GET /storage/:id` — it already is. */
  @Delete('soft')
  @Auth({ roles: MODERATOR_ROLES })
  @ApiOperation({
    summary: 'Soft-delete files',
    description: 'hard delete happens throw a background job withing a week',
  })
  @ApiOkResponse({ type: SoftDeleteFilesResponse })
  async softDelete(
    @Body() dto: SoftDeleteFilesDto,
  ): Promise<SoftDeleteFilesResponse> {
    const deleted = await this.storageService.softDeleteMany(dto.ids);
    return { deleted };
  }

  @Get(':id')
  @Auth()
  @ApiOperation({
    summary: 'Get file metadata by id',
    description: 'Soft-deleted files are treated as missing and return 404.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: FileMetadataResponse })
  @ApiNotFoundResponse({
    description: 'Unknown id, or the file was soft-deleted.',
  })
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<FileMetadata> {
    return this.storageService.getById(id);
  }
}
