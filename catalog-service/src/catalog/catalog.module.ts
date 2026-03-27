import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogEventsPublisher } from './catalog-events.publisher';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, CatalogEventsPublisher],
  exports: [CatalogEventsPublisher],
})
export class CatalogModule {}