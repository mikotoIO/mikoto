import { Anchor, Button, Input, Notification } from '@mantine/core';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useRecoilState } from 'recoil';
import { AppError } from '../models';
import { authTokenState } from '../components/AuthHandler';
import * as authAPI from '../api/auth';

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

function useErrorElement(): [
  JSX.Element | null,
  AppError | null,
  (val: AppError | null) => void,
] {
  const [error, setError] = useState<AppError | null>(null);
  return [
    error && (
      <Notification color="red" onClose={() => setError(null)}>
        {error.message}
      </Notification>
    ),
    error,
    setError,
  ];
}

export function LoginView() {
  const { register, handleSubmit } = useForm();
  const [errorEl, , setError] = useErrorElement();
  const navigate = useNavigate();
  const [, setAuthToken] = useRecoilState(authTokenState);

  return (
    <AuthView>
      <Form
        onSubmit={handleSubmit(async (formData) => {
          try {
            await authAPI.login(formData.email, formData.password);
            setAuthToken(
              await authAPI.login(formData.email, formData.password),
            );
            navigate('/');
          } catch (e) {
            setError((e as any)?.response?.data);
          }
        })}
      >
        <h1>Log In</h1>
        {errorEl}
        <Input size="md" placeholder="Email" {...register('email')} />
        <Input
          size="md"
          placeholder="Password"
          type="password"
          {...register('password')}
        />
        <Button type="submit">Log In</Button>
        <Anchor to="/register" component={Link}>
          Register
        </Anchor>
      </Form>
    </AuthView>
  );
}

export function RegisterView() {
  const { register, handleSubmit } = useForm();
  const [errorEl, , setError] = useErrorElement();

  const navigate = useNavigate();

  return (
    <AuthView>
      {errorEl}
      <Form
        onSubmit={handleSubmit(async (data) => {
          navigate('/login');
          try {
            await authAPI.register(data.name, data.email, data.password);
            navigate('/login');
          } catch (e) {
            setError((e as any)?.response?.data);
          }
        })}
      >
        <h1>Register</h1>
        <Input size="md" placeholder="Username" {...register('name')} />
        <Input size="md" placeholder="Email" {...register('email')} />
        <Input
          size="md"
          placeholder="Password"
          type="password"
          {...register('password')}
        />
        <Button type="submit">Register</Button>
        <Anchor to="/login" component={Link}>
          Log In
        </Anchor>
      </Form>
    </AuthView>
  );
}
