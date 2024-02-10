import { ArgsType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@ArgsType()
export class GetMessagesArts {
  @Field()
  @IsNotEmpty()
  chatId: string;

  // TODO: pagination!
}
