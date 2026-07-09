import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use user ID if authenticated, otherwise IP + user-agent fingerprint
    const fingerprint = req.headers['user-agent'] || 'unknown';
    return req.user?.id || `${req.ip}::${fingerprint}`;
  }

  protected async throwThrottlingException(): Promise<void> {
    throw new HttpException('Too many requests. Please slow down.', HttpStatus.TOO_MANY_REQUESTS);
  }
}
