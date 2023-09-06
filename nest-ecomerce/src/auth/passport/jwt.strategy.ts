import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable,ForbiddenException } from '@nestjs/common';
import { IUser } from '../user.interface';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService,private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: IUser) {
    const {_id, email, name, role} = payload;
    const checkActive = await this.authService.checkActive(_id);
    const checkRoleActive = await this.authService.checkActiveRole(role);
    if(!checkRoleActive) throw new ForbiddenException('Role is not active');
    if(!checkActive) throw new ForbiddenException('User is not active');
    return  {_id, email, name, role};
  }
}