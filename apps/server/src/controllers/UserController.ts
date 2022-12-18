import { PrismaClient } from '@prisma/client';
import { CurrentUser, Get, JsonController } from 'routing-controllers';
import { Service } from 'typedi';

import { AccountJwt } from '../auth';

@JsonController()
@Service()
export class UserController {
  constructor(private prisma: PrismaClient) {}

  @Get('/users/me')
  GetMe(@CurrentUser() myJwt: AccountJwt) {
    return this.prisma.user.findUnique({
      where: { id: myJwt.sub },
      select: {
        name: true,
        avatar: true,
      },
    });
  }
}
