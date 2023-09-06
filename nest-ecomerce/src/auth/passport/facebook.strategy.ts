import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-facebook";

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, "facebook") {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>("FACEBOOK_APP_ID"),
      clientSecret: configService.get<string>("FACEBOOK_APP_SECRET"),
      callbackURL: "/api/v1/auth/facebook-redirect",
      scope: "email",
      profileFields: ["emails", "name", "picture"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void
  ): Promise<any> {
    const { name, emails, photos} = profile;
    const user = {
        provider: "facebook",
        email: emails[0].value,
        name: name?.givenName ?? "" + " " + name?.familyName ?? "",
        picture: photos[0].value ?? "",
    };
    const payload = {
      user,
      accessToken,
    };

    done(null, payload);
  }
}