import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authClient, saveRefreshToken } from '../../src/lib/auth';
import { colors, borderRadius, fontSize, spacing } from '../../src/theme';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null);
      const result = await authClient.register({
        name: data.name,
        email: data.email,
        password: data.password,
        captcha: null as any,
      });
      if (result.refreshToken) {
        await saveRefreshToken(result.refreshToken);
      }
      router.replace('/(app)');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Registration failed.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.form}>
          <Text style={styles.heading}>Create Account</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <Controller
              control={control}
              name="name"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Username"
                  placeholderTextColor={colors.N500}
                  autoCapitalize="none"
                  selectionColor={colors.B500}
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <Controller
              control={control}
              name="email"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.N500}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  selectionColor={colors.B500}
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <Controller
              control={control}
              name="password"
              rules={{ required: true }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Password"
                  placeholderTextColor={colors.N500}
                  secureTextEntry
                  selectionColor={colors.B500}
                />
              )}
            />
          </View>

          <Pressable
            style={[styles.button, formState.isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? (
              <ActivityIndicator color={colors.N0} />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </Pressable>

          <Link href="/(auth)/login" style={styles.link}>
            <Text style={styles.linkText}>Already have an account? Log In</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.N1000,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  heading: {
    color: colors.N0,
    fontSize: fontSize.xl,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  errorBox: {
    backgroundColor: colors.R800,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  errorText: {
    color: colors.N0,
    fontSize: fontSize.sm,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.N300,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.N800,
    color: colors.N0,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.N600,
  },
  button: {
    backgroundColor: colors.B700,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.N0,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  link: {
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
  linkText: {
    color: colors.B500,
    fontSize: fontSize.sm,
  },
});
