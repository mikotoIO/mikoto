import { Button, Input } from '@mantine/core';
import axios from 'axios';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import constants from '../constants';

const AuthViewContainer = styled.div`
  height: 100vh;
  display: grid;
  grid-template-columns: 520px auto;
`;

const AuthViewInner = styled.div`
  color: white;
  background-color: ${(p) => p.theme.colors.N800};
`;

const bgImageUrl = '/images/background-1.jpg';

const BackgroundArt = styled.div`
  background: url('${bgImageUrl}') no-repeat center center fixed;
  background-size: cover;
`;

const Form = styled.form`
  display: grid;
  grid-gap: 8px;
  width: 300px;
  margin: 0 auto;
`;

const Logo = styled.img`
  width: 80px;
  display: block;
  margin: 100px auto 20px;
`;

const authAxios = axios.create({
  baseURL: constants.apiPath,
});

export function AuthView({ children }: { children: React.ReactNode }) {
  return (
    <AuthViewContainer>
      <AuthViewInner>
        <Logo src="/logo.svg" />
        {children}
      </AuthViewInner>
      <BackgroundArt />
    </AuthViewContainer>
  );
}

export function LoginView() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  return (
    <AuthView>
      <Form
        onSubmit={handleSubmit(async (formData) => {
          const { data } = await authAxios.post('/account/login', formData);
          console.log(data);
          navigate('/');
        })}
      >
        <Input size="md" placeholder="Email" {...register('email')} />
        <Input
          size="md"
          placeholder="Password"
          type="password"
          {...register('password')}
        />
        <Button type="submit">Log In</Button>
      </Form>
    </AuthView>
  );
}

export function RegisterView() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  return (
    <AuthView>
      <Form
        onSubmit={handleSubmit(async (data) => {
          await authAxios.post('/account/register', data);
          navigate('/');
        })}
      >
        <Input size="md" placeholder="Email" {...register('email')} />
        <Input
          size="md"
          placeholder="Password"
          type="password"
          {...register('password')}
        />
        <Button type="submit">Register</Button>
      </Form>
    </AuthView>
  );
}
