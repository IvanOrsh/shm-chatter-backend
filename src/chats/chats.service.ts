import { Injectable, NotFoundException } from '@nestjs/common';
import { PipelineStage, Types } from 'mongoose';

import { CreateChatInput } from './dto/create-chat.input';
import { ChatsRepository } from './chats.repository';
import { Chat } from './entities/chat.entity';
import { PaginationArgs } from 'src/common/dto/pagination-args.dto';

@Injectable()
export class ChatsService {
  constructor(private readonly chatsRepository: ChatsRepository) {}

  async countChats() {
    return this.chatsRepository.model.countDocuments({});
  }

  async create(createChatInput: CreateChatInput, userId: string) {
    return this.chatsRepository.create({
      ...createChatInput,
      userId,
      messages: [],
    });
  }

  async findMany(
    prePipelineStages: PipelineStage[] = [],
    paginationArgs: PaginationArgs,
  ) {
    const chats = await this.chatsRepository.model.aggregate([
      ...prePipelineStages,
      {
        $set: {
          latestMessage: {
            $cond: [
              'messages',
              {
                $arrayElemAt: ['$messages', -1],
              },
              {
                createdAt: new Date(),
              },
            ],
          },
        },
      },
      {
        $sort: {
          'latestMessage.createdAt': -1,
        },
      },
      {
        $skip: paginationArgs.skip,
      },
      {
        $limit: paginationArgs.limit,
      },
      {
        $unset: 'messages',
      },
      {
        $lookup: {
          from: 'users',
          localField: 'latestMessage.userId',
          foreignField: '_id',
          as: 'latestMessage.user',
        },
      },
    ]);

    chats.forEach((chat: Chat) => {
      if (!chat.latestMessage?._id) {
        delete chat.latestMessage;
        return;
      }
      chat.latestMessage.user = chat.latestMessage.user[0];
      delete chat.latestMessage.chatId;
      chat.latestMessage.chatId = chat._id.toHexString();
    });

    return chats;
  }

  async findOne(_id: string) {
    const chats = await this.findMany(
      [
        {
          $match: {
            chatId: new Types.ObjectId(_id),
          },
        },
      ],
      {
        skip: 0,
        limit: 1,
      },
    );

    if (!chats[0]) {
      throw new NotFoundException(`No chat was found with ID ${_id}`);
    }

    return chats[0];
  }
}
