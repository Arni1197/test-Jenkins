import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { Resources, ResourcesSchema } from '../../schemas/resources.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Resources.name, schema: ResourcesSchema }]),
  ],
  providers: [ResourcesService],
  controllers: [ResourcesController],
  exports: [ResourcesService],
})
export class ResourcesModule {}