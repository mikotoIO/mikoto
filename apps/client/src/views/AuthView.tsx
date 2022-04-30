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

const Input = styled.input`
  box-sizing: border-box;
  width: 100%;
  padding: 16px;
  font-size: 16px;
  color: white;
  border-radius: 4px;
  background-color: ${(p) => p.theme.colors.N700};
  border: 1px solid ${(p) => p.theme.colors.N1000};

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.colors.B800};
  }
`;

const Logo = styled.img`
  width: 80px;
  display: block;
  margin: 100px auto 20px;
`;

const Button = styled.button`
  box-sizing: border-box;
  width: 100%;
  padding: 16px;
  font-size: 16px;

  color: white;
  background-color: ${(p) => p.theme.colors.B800};
  border: none;
  border-radius: 4px;
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
        <Input placeholder="Email" {...register('email')} />
        <Input
          placeholder="Password"
          type="password"
          {...register('password')}
        />
        <Button>Log In</Button>
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
        <Input placeholder="Email" {...register('email')} />
        <Input
          placeholder="Password"
          type="password"
          {...register('password')}
        />
        <Button>Register</Button>
      </Form>
    </AuthView>
  );
}
