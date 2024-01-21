import HCaptcha from '@hcaptcha/react-hcaptcha';
import {
  Anchor,
  Box,
  Button,
  Flex,
  Form,
  Input,
  backgroundMix,
} from '@mikoto-io/lucid';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import { useErrorElement } from '../hooks/useErrorElement';
import { authClient } from '../store/authClient';

const StyledLogo = styled.img`
  width: 32px;
`;

function Logo() {
  return (
    <Flex
      center
      bg="N1100"
      w={64}
      h={64}
      rounded={16}
      m={{ x: 'auto', bottom: 8 }}
    >
      <StyledLogo src="/logo/logo-mono.svg" />
    </Flex>
  );
}

// not always a real captcha
function Captcha() {
  return <div />;
  // return (
  //   <HCaptcha
  //     sitekey={env.PUBLIC_CAPTCHA_KEY}
  //     onVerify={(t) => {
  //       console.log(t);
  //     }}
  //   />
  // );
}

const Art = styled(Box)`
  display: none;
  @media screen and (min-width: 1000px) {
    display: block;
  }
`;

export function AuthView({ children }: { children: React.ReactNode }) {
  return (
    <Flex h="100%" center bg="N1000">
      <Flex
        rounded={8}
        style={{
          overflow: 'hidden',
        }}
      >
        <Box txt="N0" bg="N800" p={32}>
          <Flex center dir="column" h="100%">
            <Logo />
            {children}
          </Flex>
        </Box>
        <Art mix={[backgroundMix('/images/artworks/1.jpg')]} w={600} />
      </Flex>
    </Flex>
  );
}

export function LoginView() {
  const { register, handleSubmit } = useForm();
  const error = useErrorElement();

  return (
    <AuthView>
      <Form
        w={360}
        onSubmit={handleSubmit(async (formData) => {
          try {
            const tk = await authClient.login(
              formData.email,
              formData.password,
            );
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
        <Input labelName="Email" {...register('email')} />
        <Input labelName="Password" type="password" {...register('password')} />
        <Button variant="primary" type="submit">
          Log In
        </Button>
        <Anchor to="/register" as={Link}>
          Register
        </Anchor>
        <Anchor to="/forgotpassword" as={Link}>
          Forgot Password?
        </Anchor>
        <Captcha />
      </Form>
    </AuthView>
  );
}

export function RegisterView() {
  const { register, handleSubmit } = useForm();
  const error = useErrorElement();

  return (
    <AuthView>
      <Form
        w={360}
        onSubmit={handleSubmit(async (data) => {
          try {
            const tk = await authClient.register(
              data.name,
              data.email,
              data.password,
            );
            localStorage.setItem('REFRESH_TOKEN', tk.refreshToken);
            window.location.href = '/';
          } catch (e) {
            error.setError((e as any)?.response?.data);
          }
        })}
      >
        <h1>Register</h1>
        {error.el}
        <Input labelName="Username" {...register('name')} />
        <Input labelName="Email" {...register('email')} />
        <Input labelName="Password" type="password" {...register('password')} />
        <Button variant="primary" type="submit">
          Register
        </Button>
        <Anchor to="/login" as={Link}>
          Log In
        </Anchor>
        <Captcha />
      </Form>
    </AuthView>
  );
}

export function ResetPasswordView() {
  const { register, handleSubmit } = useForm();
  const [sent, setSent] = useState(false);

  return (
    <AuthView>
      <Form
        w={360}
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
            <Input labelName="Email" {...register('email')} />
            <Button variant="primary" type="submit">
              Send Password Reset Email
            </Button>
            <Captcha />
          </>
        )}
      </Form>
    </AuthView>
  );
}

export function ResetChangePasswordView() {
  const params = useParams<{ token: string }>();
  const { register, handleSubmit } = useForm();
  const [sent, setSent] = useState(false);
  const error = useErrorElement();
  const navigate = useNavigate();

  // TODO better error screen
  if (!params.token) return <div>Invalid token</div>;

  return (
    <AuthView>
      {error.el}
      <Form
        w={360}
        onSubmit={handleSubmit(async (data) => {
          if (data.password !== data.passwordConfirm) {
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
            if (timeout) clearTimeout(timeout);
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
            <Input
              labelName="New Password"
              type="password"
              {...register('password')}
            />
            <Input
              labelName="Confirm New Password"
              type="password"
              {...register('passwordConfirm')}
            />
            <Button variant="primary" type="submit">
              Confirm new password
            </Button>
          </>
        )}
      </Form>
    </AuthView>
  );
}
