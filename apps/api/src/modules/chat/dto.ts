import { IsString, IsOptional, IsArray, IsIn, IsUUID, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @IsIn(['direct', 'group'])
  type!: 'direct' | 'group';

  @IsOptional() @IsString() @MaxLength(100)
  name?: string;

  @IsArray()
  @IsString({ each: true })
  participantIds!: string[]; // user IDs (excluding self, self is auto-added)

  @IsOptional() @IsString()
  avatarUrl?: string;
}

export class SendMessageDto {
  @IsString() @MaxLength(5000)
  content!: string;

  @IsOptional() @IsIn(['text', 'image', 'file', 'system'])
  messageType?: string;

  @IsOptional() @IsString()
  replyToId?: string;

  @IsOptional()
  attachments?: any;
}

export class UpdateMessageDto {
  @IsString() @MaxLength(5000)
  content!: string;
}

export class AddParticipantsDto {
  @IsArray() @IsString({ each: true })
  userIds!: string[];
}

export class UpdateConversationDto {
  @IsOptional() @IsString() @MaxLength(100)
  name?: string;
  @IsOptional() @IsString()
  avatarUrl?: string;
}
