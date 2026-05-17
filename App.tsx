import React, {useEffect, useState} from 'react';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './Types/types.ts';
import LogIn from './AuthScreens/LogIn.tsx';
import {AuthStore} from './Store/store';
import {KeychainManager} from './Store/KeyChainStorage.js';
import {ensureSessionFromRefresh} from './API/AuthApi.js';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import ListScreen from './Screens/ListScreen.tsx';
import ModalItem from './Components/modalItem.tsx';
import Registeration from './AuthScreens/Registeration.tsx';
import MasterPassword from './AuthScreens/MasterPassword.tsx';
// import BlurPlaygroundScreen from './Screens/BlurPlaygroundScreen.tsx';
// 1. Move this outside the component to prevent unnecessary re-renders
const Stack = createNativeStackNavigator<RootStackParamList>();
const BASE_BG = '#030B1A';
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: BASE_BG,
  },
};

// Root app component
const App = () => {
  // Get auth state
  const isLogged = AuthStore(state => state.isLogged);
  const setLogged = AuthStore(state => state.setLogged);
  const setAuthData = AuthStore(state => state.setAuthData);
  const setShowMasterPassword = AuthStore(state => state.setShowMasterPassword);
  const showMasterPassword = AuthStore(state => state.showMasterPassword);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Load stored tokens on startup
    const checkAuth = async () => {
      try {
        const sessionOk = await ensureSessionFromRefresh();
        if (!sessionOk) {
          if (!cancelled) {
            setLogged(false);
            setShowMasterPassword(false);
            setAuthData(null);
          }
          return;
        }

        const cachedAuthData = await KeychainManager.getAuthData();
        if (!cancelled) {
          if (cachedAuthData?.salt && cachedAuthData?.verifyHash) {
            setAuthData(cachedAuthData);
          }
          setShowMasterPassword(true);
          setLogged(false);
        }
      } catch (error) {
        // console.log('[App] Auth check failed:', error);
        if (!cancelled) {
          setLogged(false);
          setShowMasterPassword(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show loading indicator during startup
  if (loading === true) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#e8f3ff" />
      </View>
    );
  }

  // Render navigation stack
  return (
    <NavigationContainer theme={AppTheme}>
      <Stack.Navigator
        screenOptions={{contentStyle: {backgroundColor: BASE_BG}}}>
        {isLogged ? (
          // User is fully logged in with Master Password verified
          <>
            <Stack.Screen name="ListScreen" component={ListScreen} />
            <Stack.Screen
              name="modalItem"
              component={ModalItem}
              options={{headerShown: false}}
            />
          </>
        ) : showMasterPassword ? (
          // Tokens are valid but Master Password not verified yet
          <>
            <Stack.Screen
              name="MasterPassword"
              component={MasterPassword}
              options={{headerShown: false}}
            />
          </>
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
    backgroundColor: BASE_BG,
  },
});
