import axios, { AxiosInstance } from 'axios';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';

import { env } from '../../env';
import { Avatar } from '../atoms/Avatar';

export const mediaServerAxios = axios.create({
  baseURL: env.PUBLIC_MEDIASERVER_URL,
});

export function uploadFileWithAxios<T>(ax: AxiosInstance, path: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return ax.post<T>(path, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

const AvatarWrapper = styled.a`
  position: relative;
  display: block;
  width: 64px;
  height: 64px;
`;

const AvatarHover = styled.div`
  position: absolute;
  top: 0;
  border-radius: 7px;
  text-align: center;
  width: 64px;
  height: 64px;
  opacity: 0;
  font-size: 10px;
  font-weight: bold;

  display: flex;
  justify-content: center;
  align-items: center;
  :hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.6);
  }
`;

export function AvatarEditor({
  avatar,
  onDrop,
}: {
  avatar?: string;
  onDrop?: (files: File) => void;
}) {
  const avatarUpload = useDropzone({
    onDrop: async (files) => {
      onDrop?.(files[0]);
    },
  });

  return (
    <AvatarWrapper {...avatarUpload.getRootProps({ className: 'dropzone' })}>
      <input {...avatarUpload.getInputProps()} />
      <Avatar size={64} src={avatar} />
      <AvatarHover>CHANGE{'\n'}AVATAR</AvatarHover>
    </AvatarWrapper>
  );
}
