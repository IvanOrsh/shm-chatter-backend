import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

import { AbstractEntity } from 'src/common/database/abstract.entity';
import { Message } from '../messages/entities/message.entity';

@Schema()
export class ChatDocument extends AbstractEntity {
  @Prop()
  userId: string;

  @Prop()
  name: string;

  @Prop([Message])
  messages: Message[];
}

export const ChatSchema = SchemaFactory.createForClass(ChatDocument);
