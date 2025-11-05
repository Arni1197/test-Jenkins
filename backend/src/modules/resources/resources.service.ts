import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resources, ResourcesDocument } from '../../schemas/resources.schema';

@Injectable()
export class ResourcesService {
  constructor(@InjectModel(Resources.name) private resourcesModel: Model<ResourcesDocument>) {}

  async getResources(userId: string) {
    return this.resourcesModel.findOne({ userId: new Types.ObjectId(userId) });
  }

  async addResource(userId: string, resource: 'wood' | 'stone' | 'gold', amount: number) {
    return this.resourcesModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $inc: { [resource]: amount } },
      { new: true, upsert: true }
    );
  }
}