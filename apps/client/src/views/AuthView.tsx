import { Anchor, Button, Input } from '@mantine/core';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import { useErrorElement } from '../hooks/useErrorElement';
import { authClient } from '../store/authClient';

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

export function LoginView() {
  const { register, handleSubmit } = useForm();
  const error = useErrorElement();

  return (
    <AuthView>
      <Form
        onSubmit={handleSubmit(async (formData) => {
          try {
            const tk = await authClient.login(formData.email, formData.password);
            localStorage.setItem('REFRESH_TOKEN', tk.refreshToken);
            // Screw SPAs, why not just force an actual reload at this point?
            window.location.href = '/';
          } catch (e) {
            error.setError((e as any)?.response?.data);
          }
        })}
      >
        <h1>Log In</h1>
        {error.el}
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
        <Anchor to="/forgotpassword" component={Link}>
          Forgot Password?
        </Anchor>
      </Form>
    </AuthView>
  );
}

export function RegisterView() {
  const { register, handleSubmit } = useForm();
  const error = useErrorElement();

  const navigate = useNavigate();

  return (
    <AuthView>
      {error.el}
      <Form
        onSubmit={handleSubmit(async (data) => {
          navigate('/login');
          try {
            await authClient.register(data.name, data.email, data.password);
            navigate('/login');
          } catch (e) {
            error.setError((e as any)?.response?.data);
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

export function ResetPasswordView() {
  const { register, handleSubmit } = useForm();
  const [sent, setSent] = React.useState(false);

  return (
    <AuthView>
      <Form
        onSubmit={handleSubmit(async (data) => {
          await authClient.resetPassword(data.email);
          setSent(true);
        })}
      >
        {sent ? (
          <div>
            <h1>Instructions sent</h1>
            <p>Check your inbox for instructions to reset your password.</p>
          </div>
        ) : (
          <>
            <h1>Reset Password</h1>
            <Input size="md" placeholder="Email" {...register('email')} />
            <Button type="submit">Send Password Reset Email</Button>
          </>
        )}
      </Form>
    </AuthView>
  );
}

export function ResetChangePasswordView() {
  const params = useParams<{ token: string }>();
  const { register, handleSubmit } = useForm();
  const [sent, setSent] = React.useState(false);
  const error = useErrorElement();
  const navigate = useNavigate();

  // TODO better error screen
  if(!params.token) return (<div>Invalid token</div>);

  return (
    <AuthView>
      {error.el}
      <Form
        onSubmit={handleSubmit(async (data) => {
          if(data.password !== data.passwordConfirm) {
            // TODO checkother password conditions
            error.setError({
              name: 'ValidatePasswordsMatch',
              message: 'Passwords do not match',
            });
            return;
          }
          setSent(true);
          let timeout: NodeJS.Timeout | undefined;
          try {
            timeout = setTimeout(() => {
              navigate('/login');
            }, 1400);
            authClient.resetPasswordSubmit(data.password, params.token!); // TODO error handling
          } catch (e) {
            if(timeout) clearTimeout(timeout);
            error.setError((e as any)?.response?.data);
            setSent(false);
          }
        })}
      >
        {sent ? (
          <div>
            <h1>Password changed successfully!</h1>
            <p>Returning to login page...</p>
          </div>
        ) : (
          <>
            <h1>Reset Password</h1>
            <Input placeholder="New Password" type="password" {...register('password')} />
            <Input placeholder="Confirm New Password" type="password" {...register('passwordConfirm')} />
            <Button type="submit">Confirm new password</Button>
          </>
        )}
      </Form>
    </AuthView>
  );
}