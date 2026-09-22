import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum MessageTypeDto {
  TEXTO = 'TEXTO',
  IMAGEM = 'IMAGEM',
  LOCALIZACAO = 'LOCALIZACAO',
  LINK = 'LINK',
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsEnum(MessageTypeDto)
  type?: MessageTypeDto = MessageTypeDto.TEXTO;
}