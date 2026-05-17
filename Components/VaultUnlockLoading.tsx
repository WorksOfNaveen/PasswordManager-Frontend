import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, StyleSheet, View, StatusBar} from 'react-native';
import LottieView from 'lottie-react-native';
import {AuthStore, usePasswordStore} from '../Store/store';
import {verifyMasterPassword} from '../Encryption/vault';

const THEME = {
  bg: '#111113',
};

type AnimationPhase = 'loading' | 'unlocking';

type Props = {
  masterPassword: string;
  onUnlockFailed: () => void;
};

const VaultUnlockLoading = ({masterPassword, onUnlockFailed}: Props) => {
  const setLogged = AuthStore(state => state.setLogged);
  const setKey = AuthStore(state => state.setKey);
  const fetchPasswords = usePasswordStore(state => state.fetchPasswords);

  const [phase, setPhase] = useState<AnimationPhase>('loading');
  const [decryptionDone, setDecryptionDone] = useState(false);
  const loadingCycleDone = useRef(false);
  const finishedRef = useRef(false);

  const tryAdvanceToUnlock = useCallback(() => {
    if (
      phase !== 'loading' ||
      !decryptionDone ||
      !loadingCycleDone.current
    ) {
      return;
    }
    setPhase('unlocking');
  }, [phase, decryptionDone]);

  useEffect(() => {
    let cancelled = false;

    const verifyAndFetch = async () => {
      const auth = AuthStore.getState().authData;
      if (!auth?.salt || !auth?.verifyHash) {
        Alert.alert('Error', 'Auth data missing. Please login again.');
        onUnlockFailed();
        return;
      }

      const key = verifyMasterPassword(masterPassword, auth);
      if (!key) {
        Alert.alert(
          'Error',
          'Master password is incorrect. Please try again.',
        );
        onUnlockFailed();
        return;
      }

      if (cancelled) {
        return;
      }

      setKey(key);

      try {
        await fetchPasswords();
      } catch {
        // Still allow unlock if fetch fails; ListScreen can retry
      } finally {
        if (!cancelled) {
          setDecryptionDone(true);
        }
      }
    };

    verifyAndFetch();

    return () => {
      cancelled = true;
    };
  }, [masterPassword, setKey, fetchPasswords, onUnlockFailed]);

  useEffect(() => {
    if (decryptionDone) {
      tryAdvanceToUnlock();
    }
  }, [decryptionDone, tryAdvanceToUnlock]);

  const onLoadingAnimationFinish = useCallback(
    (isCancelled?: boolean) => {
      if (isCancelled || phase !== 'loading') {
        return;
      }
      loadingCycleDone.current = true;
      tryAdvanceToUnlock();
    },
    [phase, tryAdvanceToUnlock],
  );

  const onLockAnimationFinish = useCallback(
    (isCancelled?: boolean) => {
      if (isCancelled || finishedRef.current) {
        return;
      }
      finishedRef.current = true;
      setLogged(true);
    },
    [setLogged],
  );

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={THEME.bg}
        translucent={false}
      />
      {phase === 'loading' ? (
        <LottieView
          key="loading"
          source={require('../assets/loader.json')}
          autoPlay
          loop={!decryptionDone}
          onAnimationFinish={onLoadingAnimationFinish}
          style={styles.animation}
        />
      ) : (
        <LottieView
          key="unlock"
          source={require('../assets/lockAnimation.json')}
          autoPlay
          loop={false}
          onAnimationFinish={onLockAnimationFinish}
          style={styles.animation}
        />
      )}
    </View>
  );
};

export default VaultUnlockLoading;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.bg,
  },
  animation: {
    width: 280,
    height: 280,
  },
});
