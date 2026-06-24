import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import databaseConfig from '../config/database.config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(
    @Inject(databaseConfig.KEY)
    dbCfg: ConfigType<typeof databaseConfig>,
  ) {
    const adapter = new PrismaPg({ connectionString: dbCfg.url });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
