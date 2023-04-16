import { DMMFClass } from '@prisma/client/runtime';

import { prisma } from './prisma';

const dmmf = (prisma as any)._baseDmmf as DMMFClass;

console.log(JSON.stringify(dmmf.datamodel.models, null, 2));
