import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PubSub } from 'graphql-subscriptions';

import { ChatsRepository } from '../chats.repository';
import { CreateMessageInput } from './dto/create-message.input';
import { GetMessagesArgs } from './dto/get-messages.args';
import { PUB_SUB } from 'src/common/constants/injection-token';
import { MESSAGE_CREATED } from './constants/pubsub-triggers';
import { MessageCreatedArgs } from './dto/message-created.args';
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

  async getMessages(getMessagesArgs: GetMessagesArgs): Promise<Message[]> {
    const { chatId } = getMessagesArgs;

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

  async messageCreated({ chatId }: MessageCreatedArgs) {
    await this.chatsRepository.findOne({
      _id: chatId,
    });

    return this.pubSub.asyncIterator(MESSAGE_CREATED);
  }
}
