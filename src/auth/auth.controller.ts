import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterByEmailDto } from './dto/registerByEmail-dto';
import { RegisterByPhoneDto } from './dto/registerByPhone-dto';
import { SignInDto } from './dto/signin-dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register/email')
  @ApiOperation({ summary: 'Register a new user by email' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The user has been successfully registered.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already in use.',
  })
  async registerByEmail(@Body() registerByEmailDto: RegisterByEmailDto) {
    return this.authService.registerByEmail(registerByEmailDto);
  }

  @Post('register/phone')
  @ApiOperation({ summary: 'Register a new user by phone' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The user has been successfully registered.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Phone already in use.',
  })
  async registerByPhone(@Body() userDto: RegisterByPhoneDto) {
    return this.authService.registerByPhone(userDto);
  }


  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user has been successfully logged in.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials.',
  })
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }
}
