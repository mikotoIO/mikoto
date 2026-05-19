import { ApiReference } from '@scalar/nextjs-api-reference';

import spec from '../../../superego/api.json';

export const GET = ApiReference({
  pageTitle: 'Mikoto API Reference',
  content: spec,
});
