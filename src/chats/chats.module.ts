import { Module, forwardRef } from '@nestjs/common';

import { ChatsResolver } from './chats.resolver';
import { ChatsRepository } from './chats.repository';
import { ChatsService } from './chats.service';
import { DatabaseModule } from 'src/common/database/database.module';
import { Chat } from './entities/chat.entity';
import { ChatSchema } from './entities/chat.document';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    DatabaseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
    forwardRef(() => MessagesModule),
  ],
  providers: [ChatsResolver, ChatsService, ChatsRepository],
  exports: [ChatsRepository],
})
export class ChatsModule {}
