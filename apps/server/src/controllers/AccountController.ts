import { User, PrismaClient } from '@prisma/client';
import {
  Body,
  CurrentUser,
  JsonController,
  Post,
  UnauthorizedError,
  UploadedFile,
} from 'routing-controllers';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Service } from 'typedi';
import crypto from 'crypto';
import { promisify } from 'util';
import { AccountJwt } from '../auth';
import Minio from '../functions/Minio';
import Mailer from '../services/Mailer';

const randomBytes = promisify(crypto.randomBytes);
async function generateRandomToken() {
  const b = await randomBytes(128);
  return b.toString('base64url');
}

interface RegisterPayload {
  email: string;
  name: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface ChangePasswordPayload {
  id: string;
  oldPassword: string;
  newPassword: string;
}

@JsonController()
@Service()
export class AccountController {
  constructor(
    private prisma: PrismaClient,
    private minio: Minio,
    private mailer: Mailer,
  ) {}

  private async createTokenPair(account: User, oldToken?: string) {
    const accessToken = jwt.sign({}, process.env.SECRET!, {
      expiresIn: '1h',
      subject: account.id,
    });
    const refreshToken = await generateRandomToken();
    const expiresAt = new Date(Date.now() + 86400000 * 30);

    if (oldToken) {
      await this.prisma.refreshToken.update({
        where: { token: oldToken },
        data: {
          token: refreshToken,
          expiresAt,
        },
      });

      return { accessToken, refreshToken };
    }
    await this.prisma.refreshToken.create({
      data: {
        userId: account.id,
        token: refreshToken,
        expiresAt,
      },
    });
    return { accessToken, refreshToken };
  }

  @Post('/account/register')
  async register(@Body() body: RegisterPayload) {
    return this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passhash: await bcrypt.hash(body.password, 10),
      },
    });
  }

  @Post('/account/login')
  async login(@Body() body: LoginPayload) {
    const account = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    if (account && (await bcrypt.compare(body.password, account.passhash))) {
      return this.createTokenPair(account);
    }
    throw new UnauthorizedError('Incorrect Credentials');
  }

  @Post('/account/refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    await this.prisma;
    const account = await this.prisma.refreshToken
      .findUnique({ where: { token: body.refreshToken } })
      .user();
    if (account === null) {
      throw new UnauthorizedError('Invalid Token');
    }
    return this.createTokenPair(account, body.refreshToken);
  }

  @Post('/account/change_pasword')
  async changePassword(@Body() body: ChangePasswordPayload) {
    const account = await this.prisma.user.findUnique({
      where: { id: body.id },
    });

    if (account && (await bcrypt.compare(body.oldPassword, account.passhash))) {
      await this.prisma.user.update({
        where: { id: account.id },
        data: { passhash: await bcrypt.hash(body.newPassword, 10) },
      });
    }
  }

  @Post('/account/reset_password')
  async resetPassword(@Body() body: { email: string }) {
    const account = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    if (account === null) {
      throw new UnauthorizedError('Invalid Email');
    }

    const verification = await this.prisma.verification.create({
      data: {
        userId: account.id,
        token: await generateRandomToken(),
        category: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    await this.mailer.sendMail(
      body.email,
      'Reset Password',
      'reset-password.ejs',
      {
        name: account.name,
        token: verification.token,
      },
    );
    return {};
  }

  @Post('/account/avatar')
  async uploadAvatar(
    @CurrentUser() account: AccountJwt,
    @UploadedFile('avatar') avatar: Express.Multer.File,
  ) {
    const uploaded = await this.minio.uploadImage('avatar', avatar);
    await this.prisma.user.update({
      where: { id: account.sub },
      data: { avatar: uploaded.url },
    });

    return {
      status: 'ok',
    };
  }
}
