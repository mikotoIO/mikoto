import { User, PrismaClient } from '@prisma/client';
import {
  Body,
  JsonController,
  Post,
  UnauthorizedError,
} from 'routing-controllers';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Service } from 'typedi';
import crypto from 'crypto';
import { promisify } from 'util';

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

@JsonController()
@Service()
export class AccountController {
  constructor(private prisma: PrismaClient) {}

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
}
