import { Module, Global } from '@nestjs/common';
import { CloudflareR2Service } from './cloudflare-r2.service';

@Global()
export class CloudflareR2Module {
  static forRoot() {
    return {
      module: CloudflareR2Module,
      providers: [CloudflareR2Service],
      exports: [CloudflareR2Service],
    };
  }
}
