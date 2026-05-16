import React, {useMemo, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Alert,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {useNavigation} from '@react-navigation/native';
import apiClient from '../API/AuthApi';
import {setUpMasterPassword} from '../Encryption/vault';
import {AuthStore} from '../Store/store';
import {ProgressBar, strengthTierLabel} from '../Components/ProgressBar';
import {passwordStrength01} from '../utils/passwordStrength';

interface FormData {
  name: string;
  email: string;
  password: string;
}

const THEME = {
  bg: '#111113',
  surface: '#1c1c1f',
  border: '#2a2a2f',
  text: '#f5f5f7',
  textMuted: '#a1a1aa',
  accent: '#0a84ff',
};

const Registeration = () => {
  const navigation = useNavigation<any>();
  const setKey = AuthStore(state => state.setKey);

  const [fillForm, setfillForm] = useState<FormData>({
    name: '',
    email: '',
    password: '',
  });
  const [mpassword, setmpassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showMpassword, setShowMpassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(
    () => passwordStrength01(fillForm.password),
    [fillForm.password],
  );
  const MasterPasswordStrength = useMemo(
    () => passwordStrength01(mpassword),
    [mpassword],
  );
  const strengthFillColor = useMemo(() => {
    switch (strengthTierLabel(passwordStrength)) {
      case 'Weak':
        return '#ff453a';
      case 'Medium':
        return '#ff9f0a';
      default:
        return '#30d158';
    }
  }, [passwordStrength]);
  const strengthFillMasterColor = useMemo(() => {
    switch (strengthTierLabel(MasterPasswordStrength)) {
      case 'Weak':
        return '#ff453a';
      case 'Medium':
        return '#ff9f0a';
      default:
        return '#30d158';
    }
  }, [MasterPasswordStrength]);

  function updateField(name: keyof FormData, value: string): void {
    setfillForm(prevState => ({
      ...prevState,
      [name]: value,
    }));
  }

  const registerButton = async (form: FormData) => {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={THEME.bg}
        translucent={false}
      />

      <View style={styles.card}>
        <Text style={styles.header}>Create Account</Text>
        <Text style={styles.subtitle}>
          Register and secure your vault with a master password
        </Text>

        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="person-outline" size={18} color={THEME.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={THEME.textMuted}
            value={fillForm.name}
            autoCapitalize="words"
            onChangeText={text => updateField('name', text)}
          />
        </View>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={18} color={THEME.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor={THEME.textMuted}
            value={fillForm.email}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={text => updateField('email', text)}
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
            placeholder="Password"
            placeholderTextColor={THEME.textMuted}
            style={styles.input}
            value={fillForm.password}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={text => updateField('password', text)}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={THEME.textMuted}
            />
          </TouchableOpacity>
        </View>
        <ProgressBar
          progress={passwordStrength}
          fillColor={strengthFillColor}
          showStrengthLabel
          style={styles.passwordStrengthBar}
        />

        <Text style={styles.label}>Master Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="key-outline" size={18} color={THEME.textMuted} />
          <TextInput
            placeholder="Master Password"
            placeholderTextColor={THEME.textMuted}
            style={styles.input}
            value={mpassword}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setmpassword}
            secureTextEntry={!showMpassword}
          />
          <TouchableOpacity onPress={() => setShowMpassword(!showMpassword)}>
            <Ionicons
              name={showMpassword ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={THEME.textMuted}
            />
          </TouchableOpacity>
        </View>
        <ProgressBar
          progress={MasterPasswordStrength}
          fillColor={strengthFillMasterColor}
          showStrengthLabel
          style={styles.passwordStrengthBar}
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitDisabled]}
          onPress={() => registerButton(fillForm)}
          disabled={loading}>
          <Text style={styles.submitText}>
            {loading ? 'Registering...' : 'Register'}
          </Text>
        </TouchableOpacity>

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
  passwordStrengthBar: {
    marginTop: -6,
    marginBottom: 14,
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
    opacity: 0.65,
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
