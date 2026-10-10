import {
  ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import {
  AppException,
  AppExceptionFilter,
  ERROR_STATUS,
  ErrorCode,
} from '../../src/errors';

describe('AppExceptionFilter', () => {
  const response = {};
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;

  let reply: jest.Mock;
  let filter: AppExceptionFilter;

  beforeEach(() => {
    reply = jest.fn();
    filter = new AppExceptionFilter({
      httpAdapter: { reply },
    } as unknown as HttpAdapterHost);
    jest
      .spyOn(
        (filter as unknown as { logger: { error: () => void } }).logger,
        'error',
      )
      .mockImplementation(() => undefined);
  });

  it('passes an AppException through as { code, error }', () => {
    filter.catch(new AppException(ErrorCode.EMAIL_ALREADY_EXISTS), host);

    expect(reply).toHaveBeenCalledWith(
      response,
      { code: 409, error: ErrorCode.EMAIL_ALREADY_EXISTS },
      409,
    );
  });

  it('includes the optional message when one is given', () => {
    filter.catch(new AppException(ErrorCode.VALIDATION_FAILED, 'bad'), host);

    expect(reply).toHaveBeenCalledWith(
      response,
      { code: 400, error: ErrorCode.VALIDATION_FAILED, message: 'bad' },
      400,
    );
  });

  it('maps a bare Nest exception to a generic code', () => {
    filter.catch(new ForbiddenException(), host);
    filter.catch(new NotFoundException('Cannot GET /x'), host);

    expect(reply).toHaveBeenNthCalledWith(
      1,
      response,
      { code: 403, error: ErrorCode.FORBIDDEN, message: 'Forbidden' },
      403,
    );
    expect(reply).toHaveBeenNthCalledWith(
      2,
      response,
      {
        code: 404,
        error: ErrorCode.ROUTE_NOT_FOUND,
        message: 'Cannot GET /x',
      },
      404,
    );
  });

  it('joins an array message', () => {
    filter.catch(new BadRequestException(['a', 'b']), host);

    expect(reply.mock.calls[0][1]).toMatchObject({
      error: ErrorCode.BAD_REQUEST,
      message: 'a; b',
    });
  });

  it('treats an http-errors style client error as a 4xx', () => {
    filter.catch(Object.assign(new Error('too big'), { status: 413 }), host);

    expect(reply).toHaveBeenCalledWith(
      response,
      { code: 413, error: ErrorCode.BAD_REQUEST, message: 'too big' },
      413,
    );
  });

  it('never leaks the message of a 5xx or an unknown error', () => {
    filter.catch(new InternalServerErrorException('secret detail'), host);
    filter.catch(new Error('db password is x'), host);

    expect(reply).toHaveBeenNthCalledWith(
      1,
      response,
      { code: 500, error: ErrorCode.INTERNAL_ERROR },
      500,
    );
    expect(reply).toHaveBeenNthCalledWith(
      2,
      response,
      { code: 500, error: ErrorCode.INTERNAL_ERROR },
      500,
    );
  });
});

describe('ERROR_STATUS', () => {
  it('has a status for every ErrorCode', () => {
    for (const code of Object.values(ErrorCode)) {
      expect(ERROR_STATUS[code]).toEqual(expect.any(Number));
    }
  });
});
