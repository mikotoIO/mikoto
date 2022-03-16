import { PrismaClient } from "@prisma/client";
import { Body, JsonController, Post } from "routing-controllers";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Service } from "typedi";

interface RegisterPayload {
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

@JsonController()
@Service()
export class AccountController {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  @Post('/account/register')
  async register(@Body() body: RegisterPayload) {
    return await this.prisma.account.create({
      data: {
        email: body.email,
        passhash: await bcrypt.hash(body.password, 10),
      }
    });
  }

  @Post('/account/login')
  async login(@Body() body: LoginPayload) {
    const user = await this.prisma.account
      .findUnique({ where: { email: body.email } });
    if (user && await bcrypt.compare(body.password, user.passhash)) {
      const accessToken = jwt.sign({}, process.env.SECRET!, {
        expiresIn: '1d',
        subject: user.id,
      });
      return { accessToken };
    }
    return { error: 'Incorrect credentials' }
  }
}
