import React from 'react';
import {StyleSheet, Text, View, StatusBar} from 'react-native';

const THEME = {
  bg: '#111113',
  surface: '#1c1c1f',
  border: '#2a2a2f',
  text: '#f5f5f7',
  textMuted: '#a1a1aa',
};

const About = () => {
  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={THEME.bg}
        translucent={false}
      />
      <View style={styles.card}>
        <Text style={styles.title}>About</Text>
        <Text style={styles.body}>
          Password Manager keeps your credentials secure in an encrypted vault.
          This interface uses a clean dark minimal style inspired by Apple product
          pages with strong typography and quiet surfaces.
        </Text>
      </View>
    </View>
  );
};

export default About;

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
    padding: 20,
  },
  title: {
    color: THEME.text,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 10,
  },
  body: {
    color: THEME.textMuted,
    lineHeight: 22,
    fontSize: 15,
  },
});