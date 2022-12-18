import { PrismaClient } from '@prisma/client';
import {
  Body,
  Delete,
  Get,
  JsonController,
  Param,
  Patch,
  Post,
} from 'routing-controllers';
import { Service } from 'typedi';

interface RoleCreatePayload {
  name: string;
  spacePermissions: string;
  position: number;
}

@JsonController()
@Service()
export class RoleController {
  constructor(private prisma: PrismaClient) {}

  @Get('/spaces/:spaceId/roles')
  async getRoles(@Param('spaceId') spaceId: string) {
    return await this.prisma.role.findMany({
      orderBy: { position: 'desc' },
      where: { spaceId },
    });
  }

  @Post('/spaces/:spaceId/roles')
  async createRole(
    @Param('spaceId') spaceId: string,
    @Body() body: RoleCreatePayload,
  ) {
    return await this.prisma.role.create({
      data: {
        name: body.name,
        permissions: BigInt(body.spacePermissions).toString(),
        position: body.position,
        spaceId,
      },
    });
  }

  @Patch('/spaces/:spaceId/roles/:roleId')
  async editRole(
    @Param('spaceId') spaceId: string,
    @Param('roleId') roleId: string,
    @Body() body: Partial<RoleCreatePayload>,
  ) {
    return await this.prisma.role.update({
      where: { id: roleId },
      data: {
        name: body.name,
        permissions: body.spacePermissions
          ? BigInt(body.spacePermissions).toString()
          : undefined,
        position: body.position,
      },
    });
  }

  @Delete('/spaces/:spaceId/roles/:roleId')
  async deleteRole(
    @Param('spaceId') spaceId: string,
    @Param('roleId') roleId: string,
  ) {
    await this.prisma.role.delete({
      where: { id: roleId },
    });
    return { status: 'ok' };
  }
}
