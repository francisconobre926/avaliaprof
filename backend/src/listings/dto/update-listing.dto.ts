import { PartialType } from '@nestjs/swagger';
import { CreateListingDto } from './create-listing.dto';

// Herda a validação de cada campo e torna-os todos opcionais.
// Como é uma classe, o ValidationPipe com whitelist descarta o que não estiver aqui.
export class UpdateListingDto extends PartialType(CreateListingDto) {}