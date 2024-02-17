import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PubSub } from 'graphql-subscriptions';

import { ChatsRepository } from '../chats.repository';
import { CreateMessageInput } from './dto/create-message.input';
import { GetMessagesArgs } from './dto/get-messages.args';
import { PUB_SUB } from 'src/common/constants/injection-token';
import { MESSAGE_CREATED } from './constants/pubsub-triggers';
import { MessageDocument } from './entities/message.document';
import { Message } from './entities/message.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    private readonly usersService: UsersService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async createMessage(createMessageInput: CreateMessageInput, userId: string) {
    const { content, chatId } = createMessageInput;
    const messageDocument: MessageDocument = {
      content,
      userId: new Types.ObjectId(userId),
      createdAt: new Date(),
      _id: new Types.ObjectId(),
    };

    await this.chatsRepository.findOneAndUpdate(
      {
        _id: chatId,
      },
      {
        $push: {
          messages: messageDocument,
        },
      },
    );

    const message: Message = {
      ...messageDocument,
      chatId,
      user: await this.usersService.findOne(userId),
    };

    await this.pubSub.publish(MESSAGE_CREATED, {
      messageCreated: message,
    });

    return message;
  }

  async countMessages(chatId: string) {
    return (
      await this.chatsRepository.model.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(chatId),
          },
        },
        {
          $unwind: '$messages', // we want to have a separate document for each message
        },
        {
          $count: 'messages',
        },
      ])
    )[0];
  }

  async getMessages(getMessagesArgs: GetMessagesArgs): Promise<Message[]> {
    const { chatId, skip, limit } = getMessagesArgs;

    return this.chatsRepository.model.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(chatId),
        },
      },
      {
        $unwind: '$messages',
      },
      {
        $replaceRoot: {
          newRoot: '$messages',
        },
      },

      // pagination:
      // 1. sort
      {
        $sort: {
          createdAt: -1,
        },
      },
      // 2. skip
      {
        $skip: skip,
      },
      // 3. limit
      {
        $limit: limit,
      },

      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $unset: 'userId',
      },
      {
        $set: {
          chatId,
        },
      },
    ]);
  }

  async messageCreated() {
    return this.pubSub.asyncIterator(MESSAGE_CREATED);
  }
}
