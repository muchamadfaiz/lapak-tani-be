import { Global, Module } from '@nestjs/common';
import { EmailContract } from './email.contract';
import { EmailService } from './email.service';

@Global()
@Module({
  providers: [{ provide: EmailContract, useClass: EmailService }],
  exports: [EmailContract],
})
export class EmailModule {}
