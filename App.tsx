import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './Types/types.ts';
import LogIn from './AuthScreens/LogIn.tsx';
import {AuthStore} from './Store/store';
import {KeychainManager} from './Store/KeyChainStorage.js';
import apiClient from './API/AuthApi.js';
import {ActivityIndicator, StyleSheet, View, Alert} from 'react-native';
import ListScreen from './Screens/ListScreen.tsx';
import ModalItem from './Components/modalItem.tsx';
import Registeration from './AuthScreens/Registeration.tsx';
import MasterPassword from './AuthScreens/MasterPassword.tsx';
// 1. Move this outside the component to prevent unnecessary re-renders
const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const isLogged = AuthStore(state => state.isLogged);
  const setLogged = AuthStore(state => state.setLogged);
  const setAuthData = AuthStore(state => state.setAuthData);
  const [loading, setLoading] = useState(true);
  const [showMasterPassword, setShowMasterPassword] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[App] Checking authentication status...');
        const {accessToken, refreshToken} = await KeychainManager.getTokens();
        if (!accessToken || !refreshToken) {
          console.log('[App] No tokens found - showing login screen');
          setLogged(false);
          setShowMasterPassword(false);
          return;
        }

        console.log('[App] Tokens found - verifying validity');
        // Tokens exist, verify they're still valid
        const meResponse = await apiClient.get('/auth/me');
        console.log('[App] Tokens are valid - fetching auth data');

        // Fetch auth data (salt and verifyHash) for master password screen
        let authData = null;

        try {
          // Try the dedicated auth data endpoint first
          const authDataResponse = await apiClient.get('/auth/me/authData');
          console.log('[App] Auth data response:', authDataResponse?.data);

          if (
            authDataResponse?.data &&
            authDataResponse.data.salt &&
            authDataResponse.data.verifyHash
          ) {
            authData = {
              salt: authDataResponse.data.salt,
              verifyHash: authDataResponse.data.verifyHash,
            };
          }
        } catch (authError: any) {
          console.warn(
            '[App] Auth data endpoint failed:',
            authError?.response?.status,
            authError?.message,
          );
        }

        // Fallback: check if /auth/me returns the auth data directly
        if (
          !authData &&
          meResponse?.data?.salt &&
          meResponse?.data?.verifyHash
        ) {
          console.log('[App] Found auth data in /auth/me response');
          authData = {
            salt: meResponse.data.salt,
            verifyHash: meResponse.data.verifyHash,
          };
        }

        if (!authData || !authData.salt || !authData.verifyHash) {
          console.error(
            '[App] Auth data missing after all attempts:',
            authData,
          );
          Alert.alert('Error', 'Failed to load auth data. Please login again.');
          setLogged(false);
          setShowMasterPassword(false);
          return;
        }

        console.log('[App] Auth data fetched successfully');
        setAuthData(authData);

        // Tokens are valid, now show Master Password screen
        console.log('[App] Showing master password screen');
        setShowMasterPassword(true);
        setLogged(false); // Keep isLogged false until Master Password is verified
      } catch (error) {
        console.log('[App] Auth check failed:', error);
        setLogged(false);
        setShowMasterPassword(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    // 2. NavigationContainer must wrap your entire navigation tree
    <NavigationContainer>
      <Stack.Navigator>
        {isLogged ? (
          // User is fully logged in with Master Password verified
          <>
            <Stack.Screen name="ListScreen" component={ListScreen} />
            <Stack.Screen name="modalItem" component={ModalItem} />
          </>
        ) : showMasterPassword ? (
          // Tokens are valid but Master Password not verified yet
          <Stack.Screen
            name="MasterPassword"
            component={MasterPassword}
            options={{headerShown: false}}
          />
        ) : (
          // No tokens - show auth screens
          <>
            <Stack.Screen
              name="LogIn"
              component={LogIn}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Registeration"
              component={Registeration}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="MasterPassword"
              component={MasterPassword}
              options={{headerShown: false}}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
