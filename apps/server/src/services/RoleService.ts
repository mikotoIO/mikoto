import { RoleService } from './schema';
import { sophon } from './sophon';

export const roleService = sophon.create(RoleService, {});
