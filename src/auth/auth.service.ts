import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { Model } from 'mongoose';
import { User } from 'src/schema/schema';
import { RegisterByEmailDto } from './dtos/register-by-email-dto';
import * as _ from 'lodash';
import { RegisterByPhoneDto } from './dtos/register-by-phone-dto';
import { SignInDto } from './dtos/signin-dto';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async registerByEmail({ email, password }: RegisterByEmailDto): Promise<any> {
    const existingUser = await this.userModel.findOne({
      username: email,
    });
    if (existingUser) {
      throw new ConflictException('Already has an account');
    }

    const hashedPassword = await argon2.hash(password);
    const user = await this.userModel.create({
      username: email,
      password: hashedPassword,
      contactInfo: { email: email },
    });

    const userWithoutSensitiveInfo = _.omit(user.toObject(), [
      'password',
      'createdAt',
      'updatedAt',
      'groups',
      'contactInfo',
      'messages',
      'isOnline',
      '_id',
      '__v',
    ]);

    const loginInfo = await this.signIn({ username: email, password });
    return { ...userWithoutSensitiveInfo, ...loginInfo };
  }

  async registerByPhone({ phone, password }: RegisterByPhoneDto) {
    const existingUser = await this.userModel.findOne({ username: phone });
    if (existingUser) {
      throw new ConflictException('Already has an account');
    }
    const hashedPassword = await argon2.hash(password);
    const user = await this.userModel.create({
      username: phone,
      password: hashedPassword,
      contactInfo: { phone },
    });

    const userWithoutSensitiveInfo = _.omit(user.toObject(), [
      'password',
      'createdAt',
      'updatedAt',
      'groups',
      'contactInfo',
      'messages',
      'isOnline',
      '_id',
      '__v',
    ]);

    const loginInfo = await this.signIn({ username: phone, password });
    return { ...userWithoutSensitiveInfo, ...loginInfo };
  }

  async signIn({ username, password }: SignInDto) {
    const user = await this.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { username: user.username, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ username: username });
    if (user && (await argon2.verify(user.password, password))) {
      delete user.password;
      return user;
    }
    return null;
  }

  async verifyJWTBearerToken(bearerToken, secretKey) {
    try {
      const token = bearerToken.split(' ')[1];
      const decoded = jwt.verify(token, secretKey);
      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }
}
