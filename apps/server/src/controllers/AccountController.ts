import { Account, User, PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  Body,
  CurrentUser,
  Get,
  JsonController,
  Post,
  UnauthorizedError,
  UploadedFile,
} from 'routing-controllers';
import { Service } from 'typedi';
import { promisify } from 'util';

import { AccountJwt } from '../auth';
import Mailer from '../functions/Mailer';
import Minio from '../functions/Minio';
import { logger } from '../functions/logger';
import { env } from '../env';

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

  @Get('/')
  async index() {
    return {
      name: 'MikotoAuth',
    };
  }

  private async createTokenPair(account: Account, oldToken?: string) {
    const accessToken = jwt.sign({}, env.SECRET, {
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
        accountId: account.id,
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
        Account: {
          create: {
            email: body.email,
            passhash: await bcrypt.hash(body.password, 10),
          },
        },
      },
    });
  }

  @Post('/account/login')
  async login(@Body() body: LoginPayload) {
    const account = await this.prisma.account.findUnique({
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
      .account();
    if (account === null) {
      throw new UnauthorizedError('Invalid Token');
    }
    return this.createTokenPair(account, body.refreshToken);
  }

  @Post('/account/change_pasword')
  async changePassword(@Body() body: ChangePasswordPayload) {
    const account = await this.prisma.account.findUnique({
      where: { id: body.id },
    });

    if (account && (await bcrypt.compare(body.oldPassword, account.passhash))) {
      await this.prisma.account.update({
        where: { id: account.id },
        data: { passhash: await bcrypt.hash(body.newPassword, 10) },
      });
    }
  }

  @Post('/account/reset_password')
  async resetPassword(@Body() body: { email: string }) {
    const account = await this.prisma.account.findUnique({
      where: { email: body.email },
      include: { user: true },
    });
    if (account === null) {
      throw new UnauthorizedError('Invalid Email');
    }

    const verification = await this.prisma.verification.create({
      data: {
        userId: account.id,
        token: await generateRandomToken(),
        category: 'PASSWORD_RESET', // FIXME make this an enum
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    const resetLink = `${process.env.WEB_CLIENT!}/forgotpassword/${
      verification.token
    }`;

    await this.mailer.sendMail(
      body.email,
      'Reset Password',
      'reset-password.ejs',
      {
        name: account.user.name,
        link: resetLink,
        expiry: verification.expiresAt.toISOString(),
      },
    );
    logger.info(`Sent password reset to ${body.email}`);
    return {};
  }

  @Post('/account/reset_password/submit')
  async resetPasswordVerify(
    @Body() body: { token: string; newPassword: string },
  ) {
    const verification = await this.prisma.verification.findUnique({
      where: { token: body.token },
    });
    if (verification === null) {
      throw new UnauthorizedError('Invalid Token');
    }
    if (verification.expiresAt < new Date()) {
      throw new UnauthorizedError('Token Expired');
    }

    if (verification.category !== 'PASSWORD_RESET') {
      throw new UnauthorizedError('Invalid Token');
    }

    const account = await this.prisma.user.findUnique({
      where: { id: verification.userId! },
    });

    if (account === null) {
      throw new UnauthorizedError('Account does not exist');
    }

    await this.prisma.account.update({
      where: { id: account.id },
      data: { passhash: await bcrypt.hash(body.newPassword, 10) },
    });

    return {
      status: 'ok',
    };
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
