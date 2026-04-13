import React, {useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../Types/types';
import {usePasswordStore, AuthStore} from '../Store/store';
// import {KeychainManager} from '../Store/KeyChainStorage';
// import Ionicons from '@react-native-vector-icons/Ionicons';
import {Ionicons} from '@react-native-vector-icons/ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'ListScreen'>;

// Move header right button outside component to prevent re-renders
const LogoutHeaderButton = ({onPress}: {onPress: () => void}) => (
  <TouchableOpacity style={{marginRight: 15}} onPress={onPress}>
    <Ionicons name="log-out" size={24} color="#000" />
  </TouchableOpacity>
);

export default function ListScreen({navigation}: Props) {
  const {passwords, fetchPasswords, deletePassword, clearPasswords} =
    usePasswordStore();
  const logout = AuthStore(state => state.logout);

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', onPress: () => {}, style: 'cancel'},
      {
        text: 'Logout',
        onPress: async () => {
          console.log(
            '[ListScreen] User logout initiated - clearing all sensitive data',
          );
          try {
            // 1. Clear passwords from cache
            clearPasswords();

            // 2. Logout (clears key, authData, and Keychain tokens)
            await logout();

            // 3. Navigate back to login
            console.log('[ListScreen] Logout complete - navigating to login');
            navigation.reset({
              index: 0,
              routes: [{name: 'LogIn'}],
            });
          } catch (error) {
            console.error('[ListScreen] Logout error:', error);
            Alert.alert('Error', 'Failed to logout properly');
          }
        },
      },
    ]);
  }, [logout, clearPasswords, navigation]);

  useEffect(() => {
    console.log('[ListScreen] Mounted - Setting up header');
    // Create stable header right function
    const headerRightFn = () => <LogoutHeaderButton onPress={handleLogout} />;

    navigation.setOptions({
      headerShown: true,
      headerRight: headerRightFn,
      headerTitle: '🔐 My Passwords',
    });
  }, [navigation, handleLogout]);

  useEffect(() => {
    console.log('[ListScreen] Fetching passwords');
    fetchPasswords();
  }, [fetchPasswords]);

  // Debug: Log backend response to verify password format
  useEffect(() => {
    if (passwords && passwords.length > 0) {
      console.log('[ListScreen DEBUG] Passwords fetched from backend:', {
        count: passwords.length,
        firstPassword: {
          _id: passwords[0]._id,
          domain: passwords[0].domain,
          username: passwords[0].username,
          email: passwords[0].email,
          passwordLength: passwords[0].password?.length,
          passwordPreview: passwords[0].password?.substring(0, 80),
          hasColon: passwords[0].password?.includes(':'),
          colonPosition: passwords[0].password?.indexOf(':'),
          passwordFull: passwords[0].password,
        },
      });
    }
  }, [passwords]);

  return (
    <View style={styles.container}>
      {/* 🔥 Grid List */}
      <FlatList
        data={passwords}
        keyExtractor={item => item._id}
        numColumns={2}
        columnWrapperStyle={{justifyContent: 'space-between'}}
        contentContainerStyle={{paddingBottom: 100}}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('modalItem', {data: item})}>
            {/* 🔹 Domain */}
            <Text style={styles.domain}>{item.domain}</Text>

            {/* 🔹 Username */}
            <Text style={styles.username}>{item.username}</Text>

            {/* 🔹 Hidden Password */}
            <Text style={styles.password}>••••••••</Text>

            {/* 🔹 Delete Icon */}
            <TouchableOpacity
              style={styles.deleteIcon}
              onPress={() => deletePassword(item._id)}>
              <Ionicons name="trash" size={18} color="red" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* 🔥 Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('modalItem')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },

  card: {
    flex: 1,
    margin: 8,
    padding: 15,

    backgroundColor: '#fff',
    borderRadius: 12,

    elevation: 3,
    position: 'relative',
  },

  domain: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  username: {
    marginTop: 5,
    color: 'gray',
  },

  password: {
    marginTop: 5,
    letterSpacing: 2,
    color: '#555',
  },

  deleteIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  fab: {
    position: 'absolute',
    bottom: 25,
    right: 20,

    width: 60,
    height: 60,
    borderRadius: 30,

    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',

    elevation: 8,
  },
});
