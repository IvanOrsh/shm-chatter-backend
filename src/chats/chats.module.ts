import { Module, forwardRef } from '@nestjs/common';

import { ChatsResolver } from './chats.resolver';
import { ChatsRepository } from './chats.repository';
import { ChatsService } from './chats.service';
import { DatabaseModule } from 'src/common/database/database.module';
import { ChatDocument } from './entities/chat.document';
import { ChatSchema } from './entities/chat.document';
import { MessagesModule } from './messages/messages.module';
import { ChatsController } from './chats.controller';

@Module({
  imports: [
    DatabaseModule.forFeature([
      { name: ChatDocument.name, schema: ChatSchema },
    ]),
    forwardRef(() => MessagesModule),
  ],
  providers: [ChatsResolver, ChatsService, ChatsRepository],
  exports: [ChatsRepository],
  controllers: [ChatsController],
})
export class ChatsModule {}
