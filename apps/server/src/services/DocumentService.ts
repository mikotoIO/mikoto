import { NotFoundError } from 'routing-controllers';

import { prisma } from '../functions/prisma';
import { MikotoInstance } from './context';
import { AbstractDocumentService } from './schema';

export class DocumentService extends AbstractDocumentService {
  async get(ctx: MikotoInstance, channelId: string) {
    const document = await prisma.document.findUnique({
      where: { channelId },
    });
    if (document === null) throw new NotFoundError();
    return document;
  }

  async update(ctx: MikotoInstance, channelId: string, content: string) {
    await prisma.document.update({
      where: { channelId },
      data: { content },
    });
  }
}
