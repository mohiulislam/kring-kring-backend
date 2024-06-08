import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { Model } from 'mongoose';
import { EmailService } from 'src/email/email.service';
import { OTP, User } from 'src/schema/schema';
import { RegisterByEmailDto } from './dtos/register-by-email-dto';
import { SignInDto } from './dtos/signin-dto';
import { VerifyEmailDto } from './dtos/verify-OTP-dto';
import * as _ from 'lodash';
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(OTP.name) private OTPModel: Model<OTP>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register({
    email,
    password,
    firstName,
    lastName,
  }: RegisterByEmailDto): Promise<any> {
    const existingUser = await this.UserModel.findOne({
      username: email,
    });

    if (existingUser && existingUser.isVerified) {
      return {
        success: false,
        message: 'Email already exists.',
      };
    }

    if (existingUser && !existingUser.isVerified) {
      const code = await this.emailService.sendVerificationEmail(email);

      if (code) {
        await this.OTPModel.findOneAndUpdate(
          { user: existingUser._id },
          {
            code: code,
          },
        );
      }
      return {
        email: existingUser.contactInfo.email,
        success: true,
        message: 'An OTP has been sent to your email.',
      };
    }

    const hashedPassword = await argon2.hash(password);
    const user = await this.UserModel.create({
      username: email,
      password: hashedPassword,
      firstName: firstName,
      lastName: lastName,
      contactInfo: { email: email },
    });

    const code = await this.emailService.sendVerificationEmail(email);

    if (code) {
      await this.OTPModel.create({ user: user._id, code: code, email });
      return {
        email: email,
        success: true,
        message: 'An OTP has been sent to your email.',
      };
    }
  }

  async signIn({ username, password }: SignInDto) {
    const user = await this.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { username: user.username, sub: user._id };
    const pickedUser = _.pick(user, [
      'username',
      '_id',
      'firstName',
      'lastName',
    ]);
    return {
      access_token: this.jwtService.sign(payload),
      user: pickedUser,
    };
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.UserModel.findOne({ username: username });
    if (user && (await argon2.verify(user.password, password))) {
      delete user.password;
      return user;
    }
    return null;
  }

  async verifyJWT(token, secretKey) {
    try {
      const decoded = jwt.verify(token, secretKey);
      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }
  async verifyEmail({ code, email }: VerifyEmailDto) {
    const verificationEntry = await this.OTPModel.findOne({ email: email });

    if (!verificationEntry) {
      return {
        message: 'Invalid OTP',
        success: false,
      };
    }

    if (verificationEntry.code !== code) {
      return {
        message: 'Invalid OTP',
        success: false,
      };
    }

    const user = await this.UserModel.findById(verificationEntry.user);
    if (!user) {
      throw new Error('User not found');
    }

    await this.OTPModel.findByIdAndUpdate(verificationEntry._id, {
      isVerified: true,
    });

    await this.OTPModel.findByIdAndDelete(verificationEntry._id);

    const payload = { username: user.username, sub: user._id };
    return {
      success: true,
      message: 'Email verified successfully',
      access_token: this.jwtService.sign(payload),
      username: user.username,
    };
  }
}
