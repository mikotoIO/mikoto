import {
  Link as Anchor,
  Box,
  Flex,
  Heading,
  Input,
  chakra,
} from '@chakra-ui/react';
import styled from '@emotion/styled';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Turnstile } from '@marsidev/react-turnstile';
import { useState } from 'react';
import { Control, useController, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { faMikoto } from '@/components/icons';
import { Button, Field } from '@/components/ui';
import { env } from '@/env';
import { useErrorElement } from '@/hooks/useErrorElement';
import { authClient } from '@/store/authClient';

function Logo() {
  return (
    <Flex
      align="center"
      justify="center"
      bg="gray.900"
      w="64px"
      h="64px"
      rounded={16}
      mx="auto"
      mb={0}
    >
      <FontAwesomeIcon icon={faMikoto} color="#59e6ff" fontSize="36px" />
    </Flex>
  );
}

// not always a real captcha
function Captcha({ name, control }: { name: string; control: Control }) {
  const { field } = useController({ name, control, defaultValue: null });

  return (
    <Turnstile
      siteKey={env.PUBLIC_CAPTCHA_KEY}
      onSuccess={(token) => {
        field.onChange(token);
      }}
    />
  );
}

const Art = styled.div`
  width: 600px;
  display: none;
  @media screen and (min-width: 1000px) {
    display: block;
  }
  background: url('/images/artworks/2.jpg') no-repeat center center;
  background-size: cover;
`;

export function AuthView({ children }: { children: React.ReactNode }) {
  return (
    <Flex h="100%" align="center" justify="center" bg="gray.900">
      <Flex rounded="lg" overflow="hidden">
        <Box p={8} bg="gray.700">
          <Flex align="center" justify="center" direction="column" h="100%">
            <Logo />
            {children}
          </Flex>
        </Box>
        <Art />
      </Flex>
    </Flex>
  );
}

const AuthForm = chakra('form', {
  base: {
    w: '360px',
    display: 'flex',
    flexDir: 'column',
    gap: 2,
  },
});

export function LoginView() {
  const { register, handleSubmit, formState, control } = useForm();
  const error = useErrorElement();

  return (
    <AuthView>
      <AuthForm
        onSubmit={handleSubmit(async (form) => {
          try {
            const tk = await authClient.login({
              email: form.email,
              password: form.password,
              // captcha: form.captcha,
            });
            if (tk.refreshToken) {
              localStorage.setItem('REFRESH_TOKEN', tk.refreshToken);
            }
            // Screw SPAs, why not just force an actual reload at this point?
            window.location.href = '/';
          } catch (e) {
            error.setError((e as any)?.response?.data);
          }
        })}
      >
        <Heading size="lg">Log In</Heading>
        {error.el}
        <Field label="Email">
          <Input {...register('email')} />
        </Field>
        <Field label="Password">
          <Input type="password" {...register('password')} />
        </Field>

        <Captcha name="captcha" control={control} />
        <Button
          colorPalette="primary"
          type="submit"
          loading={formState.isSubmitting}
        >
          Log In
        </Button>
        <Anchor asChild>
          <Link to="/register">Register</Link>
        </Anchor>
        <Anchor asChild>
          <Link to="/forgotpassword">Forgot Password?</Link>
        </Anchor>
      </AuthForm>
    </AuthView>
  );
}

export function RegisterView() {
  const { register, handleSubmit, formState, control } = useForm();
  const error = useErrorElement();

  return (
    <AuthView>
      <AuthForm
        onSubmit={handleSubmit(async (form) => {
          try {
            const tk = await authClient.register({
              name: form.name,
              email: form.email,
              password: form.password,
              captcha: form.captcha,
            });
            if (tk.refreshToken) {
              localStorage.setItem('REFRESH_TOKEN', tk.refreshToken);
            }
            window.location.href = '/';
          } catch (e) {
            error.setError((e as any)?.response?.data);
          }
        })}
      >
        <Heading size="lg">Register</Heading>
        {error.el}
        <Field label="Username">
          <Input {...register('name')} />
        </Field>

        <Field label="Email">
          <Input {...register('email')} />
        </Field>

        <Field label="Password">
          <Input type="password" {...register('password')} />
        </Field>
        <Captcha name="captcha" control={control} />

        <Button
          colorPalette="primary"
          type="submit"
          loading={formState.isSubmitting}
        >
          Register
        </Button>
        <Anchor asChild>
          <Link to="/login">Log In</Link>
        </Anchor>
      </AuthForm>
    </AuthView>
  );
}

export function ResetPasswordView() {
  const { register, handleSubmit, control } = useForm();
  const [sent, setSent] = useState(false);

  return (
    <AuthView>
      <AuthForm
        onSubmit={handleSubmit(async (data) => {
          await authClient.resetPassword({
            email: data.email,
            captcha: data.captcha,
          });
          setSent(true);
        })}
      >
        {sent ? (
          <div>
            <Heading size="lg">Instructions sent</Heading>
            <p>Check your inbox for instructions to reset your password.</p>
          </div>
        ) : (
          <>
            <Heading size="lg">Reset Password</Heading>
            <Field label="Email">
              <Input {...register('email')} />
            </Field>
            <Button colorPalette="primary" type="submit">
              Send Password Reset Email
            </Button>
            <Captcha name="captcha" control={control} />
          </>
        )}
      </AuthForm>
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
      <AuthForm
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
            authClient.resetPasswordSubmit({
              token: params.token!,
              password: data.password,
            }); // TODO error handling
          } catch (e) {
            if (timeout) clearTimeout(timeout);
            error.setError((e as any)?.response?.data);
            setSent(false);
          }
        })}
      >
        {sent ? (
          <div>
            <Heading size="lg">Password changed successfully!</Heading>
            <p>Returning to login page...</p>
          </div>
        ) : (
          <>
            <Heading size="lg">Reset Password</Heading>
            <Field label="New Password">
              <Input type="password" {...register('password')} />
            </Field>

            <Field label="Confirm New Password">
              <Input type="password" {...register('passwordConfirm')} />
            </Field>

            <Button colorPalette="primary" type="submit">
              Confirm new password
            </Button>
          </>
        )}
      </AuthForm>
    </AuthView>
  );
}
