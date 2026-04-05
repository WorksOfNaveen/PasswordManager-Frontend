import { StyleSheet, Text, View, TextInput, Button } from 'react-native';
import React, { useState } from 'react';
import apiClient from '../API/AuthApi';

// 1. Move Interface outside the component
interface FormData {
  name: string;
  email: string;
  password: string;
}

const Registeration = () => {
  // 2. Tell useState it's using the FormData interface
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    password: '',
  });

  // Add password visibility state
  const [showPassword, setShowPassword] = useState(false);

  // 3. Logic stays the same (this is perfect)
  function updateField(name: keyof FormData, value: string): void {
    setForm(prevState => ({
      ...prevState,
      [name]: value,
    }));
  }
  const registerButton = async (form: FormData) => {
    try {
      const res = await apiClient.post('/auth/register', form);
      console.log('Success:', res.data);
      // Handle success (navigate, show message, etc.)
    } catch (error: any) {
      console.error('Error:', error.response?.data || error.message);
      // Show error to user
    }
  };

  return (
    <View style={styles.wholeContainer}>
      <View style={styles.container}>
        <Text>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={form.name} // 4. Always link value to state
          onChangeText={text => updateField('name', text)} // 5. Pass BOTH arguments
        />

        <Text>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={form.email}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={text => updateField('email', text)} // Pass 'email' as the key
        />

        <Text>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            style={styles.passwordInput}
            value={form.password}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={text => updateField('password', text)}
            secureTextEntry={!showPassword}
          />
          <Text
            style={styles.visibilityToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </Text>
        </View>
      </View>
      <Button title="Register" onPress={() => registerButton(form)} />
    </View>
  );
};

export default Registeration;

const styles = StyleSheet.create({
  wholeContainer: {
    flex: 1,
    justifyContent: 'center', // vertical center
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
