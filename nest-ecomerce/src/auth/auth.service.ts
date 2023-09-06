import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { IUser } from './user.interface';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { RolesService } from 'src/roles/roles.service';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/decorator/customzie.decorator';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { UserDocument } from 'src/users/schemas/user.schema';
import mongoose from 'mongoose';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService, 
    private readonly rolesService: RolesService, 
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly mailerService: MailerService,
    ) {}
  async register(registerDto: RegisterUserDto) {
    try {
      const {email, password} = registerDto;
      const user = await this.usersService.findUserByEmail(email);
      if(user) {
        throw new BadRequestException('User already exists');
      }
      const role = await this.rolesService.findByRoleName('user','USER');
      const newUser = await this.usersService.register(registerDto,role._id);
      return {
        _id: newUser._id,
        createdAt: newUser.createdAt,
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async validateUser(username: string, pass: string): Promise<any> {
    try {
      const user = await this.usersService.findUserByEmail(username);
      if(user){
        const checkPassword = this.usersService.comparePassword(pass, user.password);
        if(checkPassword) {
          const userRole = user.role as unknown as { _id: string, name: string };
          const role = await this.rolesService.findOne(userRole._id)
          const {_id, name, email} = user;
          return {
            _id,
            name,
            email,
            role: role.name,
          }
        }
      }
      return null;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async login(user: IUser, res: Response) {
    try {
      const payload = { sub:'token refresh', iss:'from server', email: user.email, _id: user._id, role: user.role, name: user.name };
      const refreshToken = await this.createRefreshToken(payload);

      // Update refresh token to database
      await this.usersService.updateRefreshToken(user._id, refreshToken);

      // Set refresh token to cookie
      res.clearCookie('refreshToken');
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 1 days
      })

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async logout(user: IUser, res: Response) {
    try {
      res.clearCookie('refreshToken');
      await this.usersService.updateRefreshToken(user._id, '');
      return {
        message: 'Logout success'
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async createRefreshToken(payload: any) {
        let refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
            expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRED'),
        });
        return refreshToken;
  }

  async createChangePasswordToken(payload: any) {
        let changeToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('CHANGEPASS_TOKEN_SECRET'),
            expiresIn: this.configService.get<string>('CHANGEPASS_TOKEN_EXPIRED'),
        });
        return changeToken;
  }

  async refresh(res: Response, refreshToken: string) {
    try {
      const token = await this.jwtService.verifyAsync(refreshToken, {
        secret : this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      })
      .catch((error) => {
        throw new BadRequestException("Expired refresh token, please login again");
      })
      
      if(!token) {
        throw new BadRequestException('Invalid refresh token');
      }
      const user : IUser = await this.usersService.findUserByEmail(token.email) as unknown as IUser;
      return this.login(user, res);
    } catch (error) {
      throw new BadRequestException(error.message);  
    }
  }

  async forget(email: string) {
    try {
      // Check email exists
      const user = await this.usersService.findUserByEmail(email);
      if(!user) throw new BadRequestException('Email not found');
      
      // Create change password token
      const changePasswordToken = await this.createChangePasswordToken({email: user.email, _id: user._id});

      // Send mail
      const html = `<div>PLEASE click this link to transform to reset password website, this link will expire after 5 minitues <a href ="${this.configService.get<string>('APP_URL')}/api/v1/auth/reset-password/${changePasswordToken}">Click here</a></div>`
      await this.mailerService
      .sendMail({
        to: email, // list of receivers
        from: 'admin of website', // sender address
        subject: 'EMAIL IS SENDED TO RESET YOUR PASSWORD ✔', // Subject line
        text: 'Reset password', // plaintext body
        html: html
      })

      // Update change password token to database
      await this.usersService.updateChangeToken(user._id, changePasswordToken);
      return {
        message: 'Link to render change password Page, after send req post with this link and new password',
        link: `${this.configService.get<string>('APP_URL')}/api/v1/auth/reset-password/${changePasswordToken}`
      }

    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }



  async resetPass(password: string, tokenPass: string) {
    try {
      if(!password) throw new BadRequestException('Password is required')
      const token = await this.jwtService.verifyAsync(tokenPass, {
        secret : this.configService.get<string>('CHANGEPASS_TOKEN_SECRET'),
      })
      .catch((error) => {
        throw new BadRequestException("TOKEN EXPIRED, TRY AGAIN");
      })
      
      if(!token) {
        throw new BadRequestException('Invalid token');
      }
      const user = await this.usersService.updatePassword(token._id,password);
      return {
        message: 'Reset password success',
      }
    } catch (error) {
      throw new BadRequestException(error.message);  
    }
  }

  async verify(id: string) {
    try {
      const user = await this.usersService.findOne(id);

      const verifyEmail = await this.createChangePasswordToken({email: user.email, _id: user._id});

      // Send mail
      const html = `<div><h3>PLEASE click this link to verify your account, this link will expire after 5 minitues</h3>
      <a href ="${this.configService.get<string>('APP_URL')}/api/v1/auth/finalVerify/${verifyEmail}">
        <button style="color:#fff; padding:10px ; margin-top:10px; background-color:#166fe5; font-size:18px; border:none; border-radius:8px; ">Verify Email </button>
      </a>
      
      </div>`
      await this.mailerService
      .sendMail({
        to: user.email, // list of receivers
        from: 'admin of website', // sender address
        subject: 'EMAIL IS SENDED TO VERIFY ACCOUNT ✔', // Subject line
        text: 'Verify account', // plaintext body
        html: html
      })

      return {
        message: 'Link to render verify success page',
        link: `${this.configService.get<string>('APP_URL')}/api/v1/auth/finalVerify/${verifyEmail}`
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async finalVerify(tokenVerify: string) {
    const token = await this.jwtService.verifyAsync(tokenVerify, {
      secret : this.configService.get<string>('CHANGEPASS_TOKEN_SECRET'),
    })
    .catch((error) => {
      throw new BadRequestException("LINK EXPIRED, TRY AGAIN");
    })
    
    if(!token) {
      throw new BadRequestException('Invalid token');
    }

    await this.usersService.updateUser(token._id, {isActive: true});
      return {
        message: 'Verify account success',
      }
  }

  async passportLogin(user: any, res: Response) {
    try {
      const {email, name, picture, provider} = user;
      // check user exists

      const userExist = await this.usersService.findUserByEmail(email);
      if(userExist){
        const role = await this.rolesService.findOne(userExist.role as unknown as string);
        // update type login
        const typeLogin = provider
        await this.usersService.updateUser(userExist._id, {typeLogin});

        const userToLogin = {
          _id: userExist._id as unknown as string,
          email: userExist.email,
          name: userExist.name,
          role: role.name,

        }
        
        return this.login(userToLogin, res);
      } else{
          // create new user
        const role = await this.rolesService.findByRoleName('user','USER');
        const newUser = await this.usersService.createUser({email, name, image:picture, role: role._id, typeLogin: provider});
        const userToLogin = {
          _id: newUser._id as unknown as string,
          email: newUser.email,
          name: newUser.name,
          role: role.name,

        }
        return this.login(userToLogin, res);
      }
      

    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async checkActive(_id: string) {
    try {
      const user = await this.usersService.findOne(_id);
      if(!user.isActive) throw new BadRequestException('Your account is not active, please verify your email');
      return true;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async checkActiveRole(role: string) {
    try {
      const roleExist = await this.rolesService.findByRoleName(role, role);
      if(!roleExist.isActive) return false;
      return true;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
