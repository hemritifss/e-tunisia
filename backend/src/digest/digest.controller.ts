import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DigestService } from './digest.service';

@ApiTags('digest')
@Controller('digest')
export class DigestController {
  constructor(private readonly digest: DigestService) {}

  /** Send the weekly digest to yourself now — lets you verify email delivery end-to-end. */
  @Post('test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send me a test weekly digest now' })
  async test(@Request() req: any) {
    return this.digest.sendTestDigest(req.user.id);
  }
}
