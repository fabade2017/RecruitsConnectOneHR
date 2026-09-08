import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CreateConversationDto, SendMessageDto, AddParticipantsDto, UpdateConversationDto } from './dto';
import { RequirePermissions } from '../../common/guards/rbac.guard';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private svc: ChatService, private gateway: ChatGateway) {}

  @Get('conversations')
  @RequirePermissions('employee:read')
  listConversations(@Req() req: any, @Query() q: any) {
    return this.svc.listConversations(req.orgId, req.user.sub, q);
  }

  @Get('conversations/:id')
  @RequirePermissions('employee:read')
  getConversation(@Req() req: any, @Param('id') id: string) {
    return this.svc.getConversation(req.orgId, id, req.user.sub);
  }

  @Post('conversations')
  @RequirePermissions('employee:read')
  async createConversation(@Req() req: any, @Body() dto: CreateConversationDto) {
    const conv = await this.svc.createConversation(req.orgId, req.user.sub, dto);
    // Notify participants via socket
    this.gateway.notifyConversationCreated((conv as any).id).catch(()=>{});
    return conv;
  }

  @Patch('conversations/:id')
  @RequirePermissions('employee:read')
  async updateConversation(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateConversationDto) {
    const conv = await this.svc.updateConversation(req.orgId, id, req.user.sub, dto);
    this.gateway.notifyConversationUpdated(id, conv).catch(()=>{});
    return conv;
  }

  @Post('conversations/:id/participants')
  @RequirePermissions('employee:read')
  addParticipants(@Req() req: any, @Param('id') id: string, @Body() dto: AddParticipantsDto) {
    return this.svc.addParticipants(req.orgId, id, req.user.sub, dto.userIds);
  }

  @Delete('conversations/:id/participants/:userId')
  @RequirePermissions('employee:read')
  removeParticipant(@Req() req: any, @Param('id') id: string, @Param('userId') userId: string) {
    return this.svc.removeParticipant(req.orgId, id, req.user.sub, userId);
  }

  @Post('conversations/:id/leave')
  @RequirePermissions('employee:read')
  leave(@Req() req: any, @Param('id') id: string) {
    return this.svc.leaveConversation(req.orgId, id, req.user.sub);
  }

  @Get('conversations/:id/messages')
  @RequirePermissions('employee:read')
  listMessages(@Req() req: any, @Param('id') id: string, @Query() q: any) {
    return this.svc.listMessages(req.orgId, id, req.user.sub, q);
  }

  @Post('conversations/:id/messages')
  @RequirePermissions('employee:read')
  async sendMessage(@Req() req: any, @Param('id') id: string, @Body() dto: SendMessageDto) {
    const msg = await this.svc.sendMessage(req.orgId, id, req.user.sub, dto);
    this.gateway.notifyNewMessage(id, msg).catch(()=>{});
    return msg;
  }

  @Post('conversations/:id/files')
  @RequirePermissions('employee:read')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@Req() req: any, @Param('id') id: string, @UploadedFile() file: any, @Body() body: any) {
    const msg = await this.svc.uploadFile(req.orgId, id, req.user.sub, file, body?.content || body?.caption);
    this.gateway.notifyNewMessage(id, msg).catch(()=>{});
    return msg;
  }

  @Post('cleanup/files')
  @RequirePermissions('employee:read')
  async cleanupFiles(@Req() req: any) {
    // Triggered by cron (or manually) — cleans files older than 7 days
    return this.svc.cleanupExpiredFiles();
  }

  @Patch('conversations/:id/messages/:messageId')
  @RequirePermissions('employee:read')
  async editMessage(@Req() req: any, @Param('id') id: string, @Param('messageId') messageId: string, @Body() dto: any) {
    const msg = await this.svc.editMessage(req.orgId, id, messageId, req.user.sub, dto.content);
    this.gateway.emitToConversation(id, 'message:edited', msg);
    return msg;
  }

  @Delete('conversations/:id/messages/:messageId')
  @RequirePermissions('employee:read')
  async deleteMessage(@Req() req: any, @Param('id') id: string, @Param('messageId') messageId: string) {
    const msg = await this.svc.deleteMessage(req.orgId, id, messageId, req.user.sub);
    this.gateway.emitToConversation(id, 'message:deleted', msg);
    return msg;
  }

  @Post('conversations/:id/read')
  @RequirePermissions('employee:read')
  markRead(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.svc.markRead(req.orgId, id, req.user.sub, dto?.messageId);
  }

  @Get('unread/count')
  @RequirePermissions('employee:read')
  unreadCount(@Req() req: any) {
    return this.svc.getUnreadCount(req.orgId, req.user.sub);
  }

  @Get('users/search')
  @RequirePermissions('employee:read')
  searchUsers(@Req() req: any, @Query('q') q: string) {
    return this.svc.searchUsers(req.orgId, req.user.sub, q || '');
  }

  @Get('conversations/:id/messages/:messageId/reads')
  @RequirePermissions('employee:read')
  reads(@Req() req: any, @Param('id') id: string, @Param('messageId') messageId: string) {
    return this.svc.getReadReceipts(req.orgId, id, messageId, req.user.sub);
  }
}
