import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User, UserSchema } from '../../schemas/user.schema';
import { Resources, ResourcesSchema } from '../../schemas/resources.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Resources.name, schema: ResourcesSchema }, // добавляем модель ресурсов
    ]),
  ],
  providers: [UsersService],
  exports: [UsersService], // чтобы другие модули (например, AuthModule) могли использовать сервис
})
export class UsersModule {}