import {
  Controller,
  Get,
  Post,
  Delete,
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

  @Post('rooms/:roomId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send a message in a room' })
  sendMessage(
    @CurrentUser('id') userId: string,
    @Param('roomId') roomId: string,
    @Body() body: { content: string; type?: string; metadata?: Record<string, unknown> },
  ) {
    return this.messagesService.saveMessage(
      roomId,
      userId,
      body.content,
      body.type || 'text',
      body.metadata,
    );
  }

  @Post('rooms/:roomId/read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark a room as read' })
  async markRead(@CurrentUser('id') userId: string, @Param('roomId') roomId: string) {
    await this.messagesService.markAsRead(roomId, userId);
    return { ok: true };
  }

  @Post('direct/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Open or create a direct chat room with a user' })
  openDirect(@CurrentUser('id') me: string, @Param('userId') other: string) {
    return this.messagesService.createRoom(me, [other], undefined, 'direct');
  }

  @Delete(':messageId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unsend one of your own messages' })
  deleteMessage(@CurrentUser('id') userId: string, @Param('messageId') messageId: string) {
    return this.messagesService.deleteMessage(messageId, userId);
  }
}
