export type Restrictions =
  | { id: 'IS_FILETYPE'; type: string }
  | { id: 'MAX_FILESIZE'; size: number };

export type Transformation = { id: 'RESIZE'; width: number; height: number };

export interface Store {
  restrictions: Restrictions[];
  transformations?: Transformation[];
}

export const storeConfig: Record<string, Store> = {
  avatar: {
    restrictions: [{ id: 'IS_FILETYPE', type: 'image' }],
    transformations: [{ id: 'RESIZE', width: 512, height: 512 }],
  },
  spaceicon: {
    restrictions: [{ id: 'IS_FILETYPE', type: 'image' }],
    transformations: [{ id: 'RESIZE', width: 512, height: 512 }],
  },
  attachments: {
    // 50mb max
    restrictions: [{ id: 'MAX_FILESIZE', size: 50 * 1024 * 1024 }],
  },
};
