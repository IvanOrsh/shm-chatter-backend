import { Resolver } from '@nestjs/graphql';
import { MessagesService } from './messages.service';

@Resolver()
export class MessagesResolver {
  constructor(private readonly messagesService: MessagesService) {}
}
