import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import React, { useState } from 'react';
import apiClient from '../API/AuthApi';
import { AuthStore } from '../Store/store';
import { KeychainManager } from '../Store/KeyChainStorage';
import { AxiosError } from 'axios';

interface FormData {
  email: string;
  password: string;
}

interface AxiosResponseType {
  message: string;
  refreshToken: string;
  accessToken: string;
  success: boolean;
}

const LogIn = () => {
  const [form, setForm] = useState<FormData>({
    email: '',
    password: '',
  });

  const setLog = AuthStore(state => state.setLogged);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const updateField = (name: keyof FormData, value: string) => {
    setForm(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const submitButton = async (): Promise<void> => {
    try {
      const res = await apiClient.post<AxiosResponseType>('/auth/login', {
        email: form.email.trim(),
        password: form.password.trim(),
      });

      if (res.data.success) {
        // 🔐 Save tokens
        await KeychainManager.saveTokens(
          res.data.accessToken,
          res.data.refreshToken,
        );

        setLog(true);

        Alert.alert('Login', 'Logged successfully 👌');
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;

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
        console.error('Error:', error.message);
      }
    }
  };

  return (
    <View style={styles.Wholecontainer}>
      <View style={styles.container}>
        <Text style={styles.header}>LogIn</Text>

        <Text>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={form.email}
          onChangeText={(text: string) => updateField('email', text)}
        />

        <Text>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={form.password}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!showPassword} // ✅ FIXED
            onChangeText={(text: string) => updateField('password', text)}
          />

          <Text
            style={styles.visibilityToggle}
            onPress={() => setShowPassword(prev => !prev)}
          >
            {showPassword ? '👁️' : '🙈'}
          </Text>
        </View>

        <Button
          title="Submit"
          onPress={submitButton}
          disabled={!form.email || !form.password}
        />
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  header: {
    fontSize: 16,
    letterSpacing: 2,
    color: '#000000',
    fontWeight: '700',
    textDecorationLine: 'none', // 'none' is default, but here for clarity
    fontStyle: 'normal',
    // 'small-caps' is passed as an array to fontVariant
    fontVariant: ['small-caps'],
    textTransform: 'uppercase',
  },
  Wholecontainer: {
    flex: 1,
    marginTop: 100, // vertical center
    alignItems: 'center', // horizontal center
    backgroundColor: '#f2f2f2', // 👈 helps visually confirm centering
  },
  container: {
    width: '85%',
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc', // 👈 avoids harsh black lines
    marginBottom: 20,
    paddingVertical: 8, // 👈 VERY IMPORTANT (fixes “line at top” look)
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 8, // 👈 fixes alignment inside row
  },
  visibilityToggle: {
    fontSize: 20,
    marginLeft: 10,
    paddingVertical: 8,
  },
});
export default LogIn;
