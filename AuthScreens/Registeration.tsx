import {StyleSheet, Text, View, TextInput, Button, Alert} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import apiClient from '../API/AuthApi';
import {setUpMasterPassword} from '../Encryption/vault';
import {AuthStore} from '../Store/store';

// 1. Move Interface outside the component
interface FormData {
  name: string;
  email: string;
  password: string;
}

const Registeration = () => {
  const navigation = useNavigation<any>();
  const setKey = AuthStore(state => state.setKey);

  // 2. Tell useState it's using the FormData interface
  const [fillForm, setfillForm] = useState<FormData>({
    name: '',
    email: '',
    password: '',
  });
  const [mpassword, setmpassword] = useState<string>('');
  // Add password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showMpassword, setShowMpassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateField(name: keyof FormData, value: string): void {
    setfillForm(prevState => ({
      ...prevState,
      [name]: value,
    }));
  }

  const registerButton = async (form: FormData) => {
    // Validation
    if (!form.name || !form.email || !form.password || !mpassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (form.password !== mpassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // get the key and auth from the setUpMasterPassword
      const {key, auth} = setUpMasterPassword(mpassword);

      const completeData = {
        ...form,
        verifyHash: auth.verifyHash,
        salt: auth.salt,
      };
      const res = await apiClient.post('/auth/register', completeData);

      Alert.alert('Message', res.data.message);
      setKey(key);
      navigation.navigate('LogIn');
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || error.message,
      );
      console.error('Error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wholeContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Register</Text>

        <Text>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fillForm.name}
          onChangeText={text => updateField('name', text)}
          autoCapitalize="words"
        />

        <Text>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={fillForm.email}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          onChangeText={text => updateField('email', text)}
        />

        <Text>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            style={styles.passwordInput}
            value={fillForm.password}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={text => updateField('password', text)}
            secureTextEntry={!showPassword}
          />
          <Text
            style={styles.visibilityToggle}
            onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? '👁️' : '🙈'}
          </Text>
        </View>

        <Text>Master Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Master Password"
            style={styles.passwordInput}
            value={mpassword}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setmpassword}
            secureTextEntry={!showMpassword}
          />
          <Text
            style={styles.visibilityToggle}
            onPress={() => setShowMpassword(!showMpassword)}>
            {showMpassword ? '👁️' : '🙈'}
          </Text>
        </View>

        <Button
          title={loading ? 'Registering...' : 'Register'}
          onPress={() => registerButton(fillForm)}
          disabled={loading}
        />

        <Text style={styles.linkText}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => navigation.goBack()}>
            Log in here
          </Text>
        </Text>
      </View>
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
  header: {
    fontSize: 16,
    letterSpacing: 2,
    color: '#000000',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 20,
    textAlign: 'center',
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
  linkText: {
    marginTop: 15,
    textAlign: 'center',
    color: '#666',
  },
  link: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
