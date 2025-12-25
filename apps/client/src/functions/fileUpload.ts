// this isn't fully integrated into Mikoto.JS SDK yet, do that later
import axios from 'axios';

import { env } from '@/env';

const mediaServerAxios = axios.create({
  baseURL: env.PUBLIC_MEDIASERVER_URL,
});

export async function uploadFile(path: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await mediaServerAxios.post<{ url: string }>(path, formData);
    return response;
  } catch (error) {
    console.error('Upload error details:', error);
    throw error;
  }
}
