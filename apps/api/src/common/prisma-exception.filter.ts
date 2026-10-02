import { ArgumentsHost, Catch, ConflictException, ExceptionFilter, HttpException, NotFoundException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';

/**
 * Turns expected database errors into clean HTTP errors instead of a 500:
 * a record that is already gone (e.g. a double-clicked delete) → 404, a unique-name clash → 409 DUPLICATE.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {
  catch(e: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    let mapped: HttpException | undefined;
    if (e.code === 'P2025') mapped = new NotFoundException();
    else if (e.code === 'P2002') mapped = new ConflictException({ code: 'DUPLICATE' });
    super.catch(mapped ?? e, host);
  }
}
