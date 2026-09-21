import {
  Controller, Post, Delete, Get, Param, UseGuards, UseInterceptors,
  UploadedFile, Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

@Controller()
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Get('listings/:listingId/media')
  async findByListing(@Param('listingId') listingId: string) {
    return this.mediaService.findByListingId(listingId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('listings/:listingId/media/images')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Request() req: AuthenticatedRequest,
    @Param('listingId') listingId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.uploadImage(listingId, req.user.userId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Post('listings/:listingId/media/video')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @Request() req: AuthenticatedRequest,
    @Param('listingId') listingId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.uploadVideo(listingId, req.user.userId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('media/:mediaId')
  async remove(@Request() req: AuthenticatedRequest, @Param('mediaId') mediaId: string) {
    return this.mediaService.remove(mediaId, req.user.userId);
  }
}