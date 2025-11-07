import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BuildingsService } from './buildings.service';
import { BuildingsController } from './buildings.controller';
import { Building, BuildingSchema } from '../../schemas/building.schema';
import { Resources, ResourcesSchema } from '../../schemas/resources.schema'; // ✅ добавляем
import { ResourcesModule } from '../resources/resources.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Building.name, schema: BuildingSchema },
      { name: Resources.name, schema: ResourcesSchema }, // ✅ добавляем сюда
    ]),
    ResourcesModule
  ],
  controllers: [BuildingsController],
  providers: [BuildingsService],
  exports: [BuildingsService],
})
export class BuildingsModule {}