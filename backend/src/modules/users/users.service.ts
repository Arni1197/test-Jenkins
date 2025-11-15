import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Находит пользователя по email
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  // src/modules/users/users.service.ts
async updateById(userId: string, update: Partial<User>): Promise<UserDocument | null> {
  return this.userModel.findByIdAndUpdate(userId, update, { new: true }).exec();
}

  // Находит пользователя по ID
  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }

  // Создаёт нового пользователя
  async createUser(data: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  // Обновляет пароль пользователя
  async updatePassword(userId: string, hashedPassword: string) {
    await this.userModel.updateOne({ _id: userId }, { password: hashedPassword });
  }

  // Обновляет поле для инвалидирования старых JWT
  async updatePasswordChangedAt(userId: string) {
    await this.userModel.updateOne({ _id: userId }, { passwordChangedAt: new Date() });
  }
}