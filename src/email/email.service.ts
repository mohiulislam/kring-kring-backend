import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { OTP, User } from 'src/schema/schema';

@Injectable()
export class EmailService {
  private transporter;

  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(OTP.name) private otpModel: Model<OTP>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(to: string) {
    console.log(this.configService.get('EMAIL_USER'));
    console.log(this.configService.get('EMAIL_PASSWORD'));

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const mailOptions = {
      from: this.configService.get('EMAIL_USER'),
      to,
      subject: 'Email verification',
      text: `your email verification code is ${code}.`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Email sent!');
    } catch (error) {
      console.error('Failed to send email:', error);
    }
    return code;
  }
}
