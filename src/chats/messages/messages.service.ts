import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

import { ChatsRepository } from '../chats.repository';
import { CreateMessageInput } from './dto/create-message.input';
import { Message } from './entities/message.entity';
import { GetMessagesArgs } from './dto/get-messages.args';

@Injectable()
export class MessagesService {
  constructor(private readonly chatsRepository: ChatsRepository) {}

  private userChatFilter(userId: string) {
    return {
      $or: [
        {
          userId,
        },
        {
          userIds: {
            $in: [userId],
          },
        },
      ],
    };
  }

  async createMessage(createMessageInput: CreateMessageInput, userId: string) {
    const { content, chatId } = createMessageInput;
    const message: Message = {
      content,
      userId,
      createdAt: new Date(),
      _id: new Types.ObjectId(),
    };

    await this.chatsRepository.findOneAndUpdate(
      {
        _id: chatId,
        ...this.userChatFilter(userId),
      },
      {
        $push: {
          messages: message,
        },
      },
    );

    return message;
  }

  async getMessages(getMessagesArgs: GetMessagesArgs, userId: string) {
    const { chatId } = getMessagesArgs;

    return (
      await this.chatsRepository.findOne({
        _id: chatId,
        ...this.userChatFilter(userId),
      })
    ).messages;
  }
}
