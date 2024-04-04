import { Account, Bot, Prisma, PrismaClient } from '@prisma/client';
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
} from 'routing-controllers';
import { Service } from 'typedi';
import { promisify } from 'util';

import { AccountJwt } from '../auth';
import { env } from '../env';
import Mailer from '../functions/Mailer';
import { logger } from '../functions/logger';

function bcryptHash(password: string) {
  // if (globalThis.Bun) {
  //   return globalThis.Bun.password.hash(password, 'bcrypt');
  // }
  return bcrypt.hash(password, 10);
}

function bcryptCompare(password: string, hash: string) {
  // if (globalThis.Bun) {
  //   return globalThis.Bun.password.verify(password, hash);
  // }
  return bcrypt.compare(password, hash);
}

const randomBytes = promisify(crypto.randomBytes);
async function generateRandomToken(size = 32) {
  const b = await randomBytes(size);
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
    private mailer: Mailer,
  ) {}

  @Get('/')
  async index() {
    return {
      name: 'MikotoAuth',
    };
  }

  private createToken(account: Account | Bot): string {
    return jwt.sign({}, env.SECRET, {
      expiresIn: '1h',
      subject: account.id,
    });
  }

  private async createTokenPair(account: Account, oldToken?: string) {
    const accessToken = this.createToken(account);
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
    try {
      await this.prisma.user.create({
        data: {
          name: body.name,
          Account: {
            create: {
              email: body.email,
              passhash: await bcryptHash(body.password),
            },
          },
        },
      });
      const account = await this.prisma.account.findUnique({
        where: { email: body.email },
      });
      return await this.createTokenPair(account!);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        if ((e?.meta?.target as any).includes('email')) {
          throw new UnauthorizedError(
            'There is already an account with the email; Please log in with this email.',
          );
        }
        throw e;
      }
      throw e;
    }
  }

  @Post('/account/login')
  async login(@Body() body: LoginPayload) {
    const account = await this.prisma.account.findUnique({
      where: { email: body.email },
    });
    if (account === null) {
      throw new UnauthorizedError('No user found with the given email');
    }
    if (await bcryptCompare(body.password, account.passhash)) {
      return await this.createTokenPair(account);
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

  @Post('/account/change_password')
  async changePassword(@Body() body: ChangePasswordPayload) {
    const account = await this.prisma.account.findUnique({
      where: { id: body.id },
    });

    if (!account) throw new UnauthorizedError('Invalid Account');
    if (!(await bcryptCompare(body.oldPassword, account.passhash)))
      throw new UnauthorizedError('Invalid Password');

    // delete all refresh tokens as well
    await this.prisma.refreshToken.deleteMany({
      where: { accountId: account.id },
    });

    await this.prisma.account.update({
      where: { id: account.id },
      data: { passhash: await bcryptHash(body.newPassword) },
    });
    return await this.createTokenPair(account);
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

    const resetLink = `${env.WEB_CLIENT}/forgotpassword/${verification.token}`;

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
      data: { passhash: await bcryptHash(body.newPassword) },
    });

    return {
      status: 'ok',
    };
  }

  // Bots

  // show list of bots for user
  @Get('/bots')
  async listBots(@CurrentUser() account: AccountJwt) {
    const bots = await this.prisma.bot.findMany({
      where: { ownerId: account.sub },
    });
    return bots;
  }

  // create a bot
  @Post('/bots')
  async createBot(
    @CurrentUser() account: AccountJwt,
    @Body() body: { name: string },
  ) {
    const secret = await generateRandomToken();

    const bot = await this.prisma.user.create({
      data: {
        name: body.name,
        category: 'BOT',
        Bot: {
          create: {
            name: body.name,
            ownerId: account.sub,
            secret,
          },
        },
      },
      include: { Bot: true },
    });

    return bot.Bot;
  }

  @Post('/bots/auth')
  async botAuth(@Body() body: { botKey: string }) {
    const botKey = body.botKey.split(':');
    if (botKey.length !== 2) {
      throw new UnauthorizedError('Invalid Bot Key');
    }
    const [botId, secret] = botKey;
    const bot = await this.prisma.bot.findUnique({
      where: { id: botId },
    });
    if (bot === null || bot.secret !== secret) {
      throw new UnauthorizedError('Invalid Bot Key');
    }

    return { accessToken: this.createToken(bot) };
  }
}
