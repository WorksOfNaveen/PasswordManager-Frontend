import React, {useState} from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import apiClient from '../API/AuthApi';
import {AuthStore} from '../Store/store';
import {KeychainManager} from '../Store/KeyChainStorage';
import {AxiosError} from 'axios';
import {useNavigation} from '@react-navigation/native';

interface FormData {
  email: string;
  password: string;
}

interface AxiosResponseType {
  message: string;
  refreshToken: string;
  accessToken: string;
  success: boolean;
  user: object;
  salt: string;
  verifyHash: string;
}

const THEME = {
  bg: '#111113',
  surface: '#1c1c1f',
  border: '#2a2a2f',
  text: '#f5f5f7',
  textMuted: '#a1a1aa',
  accent: '#0a84ff',
};

const LogIn = () => {
  const [form, setForm] = useState<FormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const navigation = useNavigation<any>();
  const setAuthData = AuthStore(state => state.setAuthData);

  const updateField = (name: keyof FormData, value: string) => {
    setForm(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const submitButton = async (): Promise<void> => {
    try {
      const res = await apiClient.post<AxiosResponseType>('/auth/login', {
        email: form.email,
        password: form.password,
      });

      if (res.data.success) {
        setAuthData({
          salt: res.data.salt,
          verifyHash: res.data.verifyHash,
        });

        await KeychainManager.saveAuthData({
          salt: res.data.salt,
          verifyHash: res.data.verifyHash,
        });

        await KeychainManager.saveTokens(
          res.data.accessToken,
          res.data.refreshToken,
        );

        Alert.alert('Login', 'Logged successfully', [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('MasterPassword');
            },
          },
        ]);
      }
    } catch (err) {
      const error = err as AxiosError<{message?: string}>;

      if (error.response) {
        Alert.alert(
          'Login Failed',
          error.response.data?.message || 'An unexpected error occurred.',
        );
      } else if (error.request) {
        Alert.alert(
          'Network Error',
          'Check your internet connection and try again.',
        );
      } else {
        Alert.alert('Error', 'Something went wrong.');
      }
    }
  };

  const isDisabled = !form.email || !form.password;

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={THEME.bg}
        translucent={false}
      />
      <View style={styles.card}>
        <Text style={styles.header}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to access your passwords</Text>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={18} color={THEME.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={THEME.textMuted}
            value={form.email}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={(text: string) => updateField('email', text)}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons
            name="lock-closed-outline"
            size={18}
            color={THEME.textMuted}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={THEME.textMuted}
            value={form.password}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!showPassword}
            onChangeText={(text: string) => updateField('password', text)}
          />
          <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={THEME.textMuted}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isDisabled && styles.submitDisabled]}
          onPress={submitButton}
          disabled={isDisabled}>
          <Text style={styles.submitText}>Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.linkText}>
          Don't have an account?{' '}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate('Registeration')}>
            Register here
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: THEME.bg,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
    padding: 18,
  },
  header: {
    color: THEME.text,
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    color: THEME.textMuted,
    marginTop: 4,
    marginBottom: 18,
  },
  label: {
    color: THEME.text,
    marginBottom: 6,
    fontWeight: '600',
  },
  inputWrap: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: '#17171a',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  input: {
    flex: 1,
    color: THEME.text,
  },
  submitButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.accent,
    marginTop: 6,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  linkText: {
    marginTop: 16,
    textAlign: 'center',
    color: THEME.textMuted,
  },
  link: {
    color: THEME.text,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default LogIn;