import { BadRequestError } from 'routing-controllers';

export function mimeImageExtension(mime: string) {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    default:
      throw new BadRequestError('Only .png and .jpg supported');
  }
}
