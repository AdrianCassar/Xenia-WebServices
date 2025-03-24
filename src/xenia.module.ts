import { Module, Global, ConsoleLogger, Scope } from '@nestjs/common';
import { ApplicationModule } from './application/application.module';
import { DomainModule } from './domain/domain.module';
import { PersistanceModule } from './infrastructure/persistance/persistance.module';
import { PresentationModule } from './infrastructure/presentation/presentation.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Global()
@Module({
  imports: [
    ApplicationModule,
    DomainModule,
    PersistanceModule,
    PresentationModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src/public'),
      serveRoot: '/',
      exclude: ['/title/{*splat}', '/xstorage/{*splat}'],
      // exclude:, ['/api/{*splat}'],
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: ConsoleLogger,
      useClass: ConsoleLogger,
      // Due to transient scope, each controller will have its own unique instance of ConsoleLogger.
      scope: Scope.TRANSIENT,
    },
  ],
  exports: [ConsoleLogger],
})
export class XeniaModule {}
