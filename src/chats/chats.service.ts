import { Injectable } from '@nestjs/common';

import { CreateChatInput } from './dto/create-chat.input';
import { ChatsRepository } from './chats.repository';

@Injectable()
export class ChatsService {
  constructor(private readonly chatsRepository: ChatsRepository) {}

  async create(createChatInput: CreateChatInput, userId: string) {
    return this.chatsRepository.create({
      ...createChatInput,
      userId,
      messages: [],
    });
  }

  async findAll(userId: string) {
    return this.chatsRepository.find({
      ...this.userChatFilter(userId),
    });
  }

  async findOne(_id: string) {
    return this.chatsRepository.findOne({ _id });
  }

  userChatFilter(userId: string) {
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
        {
          isPrivate: false,
        },
      ],
    };
  }
}
