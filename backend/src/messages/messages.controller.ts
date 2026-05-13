import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('rooms')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a chat room' })
  createRoom(
    @CurrentUser('id') userId: string,
    @Body() body: { participantIds: string[]; name?: string; type?: 'direct' | 'group' },
  ) {
    return this.messagesService.createRoom(
      userId,
      body.participantIds,
      body.name,
      body.type || 'direct',
    );
  }

  @Get('rooms')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my chat rooms' })
  getRooms(@CurrentUser('id') userId: string) {
    return this.messagesService.getRooms(userId);
  }

  @Get('rooms/:roomId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get room details' })
  getRoom(@CurrentUser('id') userId: string, @Param('roomId') roomId: string) {
    return this.messagesService.getRoom(roomId, userId);
  }

  @Get('rooms/:roomId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get messages in a room' })
  getMessages(
    @CurrentUser('id') userId: string,
    @Param('roomId') roomId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.messagesService.getMessages(roomId, userId, page, limit);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get total unread messages' })
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.messagesService.getUnreadCount(userId);
  }
}
