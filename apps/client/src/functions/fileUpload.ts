// this isn't fully integrated into Mikoto.JS SDK yet, do that later
import axios from 'axios';

import { env } from '@/env';

const mediaServerAxios = axios.create({
  baseURL: env.PUBLIC_MEDIASERVER_URL,
});

export function uploadFile(path: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return mediaServerAxios.post<{ url: string }>(path, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
