import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../Types/types';
import {usePasswordStore} from '../Store/store';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {decryptVaultItem, encryptVaultItem} from '../Encryption/vault';
import {AuthStore} from '../Store/store';
// import apiClient from '../API/AuthApi';
import {ProgressBar, strengthTierLabel} from './ProgressBar';
import {passwordStrength01} from '../utils/passwordStrength';

type Props = NativeStackScreenProps<RootStackParamList, 'modalItem'>;

const THEME = {
  bg: '#111113',
  surface: '#1c1c1f',
  border: '#2a2a2f',
  text: '#f5f5f7',
  textMuted: '#a1a1aa',
  accent: '#0a84ff',
};

export default function ModalItem({route, navigation}: Props) {
  const pwd = route.params?.data;
  const key = AuthStore(state => state.key);

  const [domain, setDomain] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {addPassword, updatePassword} = usePasswordStore();

  const passwordStrength = useMemo(
    () => passwordStrength01(password),
    [password],
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

  useEffect(() => {
    if (!key) {
      Alert.alert(
        'Error',
        'Master password key not found. Please login again.',
      );
      navigation.goBack();
      return;
    }

    if (pwd && pwd.password) {
      const vaultItem = {
        id: pwd._id,
        domain: pwd.domain,
        username: pwd.username,
        email: pwd.email,
        password: pwd.password,
      };

      const decryptedPwd = decryptVaultItem(vaultItem, key);
      if (!decryptedPwd) {
        Alert.alert('Error', 'Failed to decrypt password. Please try again.');
        navigation.goBack();
        return;
      }

      setDomain(decryptedPwd.domain);
      setUsername(decryptedPwd.username);
      setEmail(decryptedPwd.email || '');
      setPassword(decryptedPwd.password);
    }
  }, [pwd, key, navigation]);

  const handleSubmit = async () => {
    if (!domain || !username || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!key) {
      Alert.alert('Error', 'Encryption key not found. Please login again.');
      return;
    }

    try {
      const decryptedItem = {
        id: pwd?._id || '',
        domain,
        username,
        email,
        password,
      };

      let encryptedItem;
      try {
        encryptedItem = encryptVaultItem(decryptedItem, key);
      } catch (encryptError) {
        Alert.alert(
          'Error',
          `Encryption failed: ${
            encryptError instanceof Error
              ? encryptError.message
              : 'Unknown error'
          }`,
        );
        return;
      }

      const data = {
        domain: encryptedItem.domain,
        username: encryptedItem.username,
        email,
        password: encryptedItem.password,
      };

      if (pwd) {
        // const res = await apiClient.put(`/passwords/${pwd._id}`, data);

        await updatePassword(pwd._id, data);
      } else {
        await addPassword(data);
      }
      navigation.goBack();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to save password: ${errorMsg}`);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.overlay}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={THEME.bg}
          translucent={false}
        />
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={40}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.centered}>
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.title}>
                  {pwd ? 'Update Password' : 'Add Password'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => navigation.goBack()}>
                  <Ionicons name="close" size={20} color={THEME.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrap}>
                <Ionicons
                  name="globe-outline"
                  size={18}
                  color={THEME.textMuted}
                />
                <TextInput
                  placeholder="Domain"
                  placeholderTextColor={THEME.textMuted}
                  style={styles.input}
                  value={domain}
                  onChangeText={setDomain}
                />
              </View>

              <View style={styles.inputWrap}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={THEME.textMuted}
                />
                <TextInput
                  placeholder="Username"
                  placeholderTextColor={THEME.textMuted}
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrap}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={THEME.textMuted}
                />
                <TextInput
                  placeholder="Email (optional)"
                  placeholderTextColor={THEME.textMuted}
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

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
                  value={password}
                  secureTextEntry={!showPassword}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(prev => !prev)}>
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
                style={{marginBottom: 8}}
              />
              <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>{pwd ? 'Update' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  centered: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: THEME.text,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: '#242428',
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
    marginBottom: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    color: THEME.text,
  },
  button: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.accent,
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
