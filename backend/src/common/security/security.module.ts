import { Global, Module } from '@nestjs/common';
import { ActionVerifierService } from './action-verifier.service';

@Global()
@Module({
  providers: [ActionVerifierService],
  exports: [ActionVerifierService],
})
export class SecurityModule {}
