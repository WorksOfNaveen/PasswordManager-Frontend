// BlurPlaygroundScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ScrollView,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {Ionicons} from '@react-native-vector-icons/ionicons';

export default function BlurPlaygroundScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.background}>
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />
        <View style={styles.glowThree} />

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.kicker}>Preview</Text>
              <Text style={styles.title}>Glass Blur Test</Text>
            </View>

            <Pressable style={styles.iconButton}>
              <Ionicons name="settings-outline" size={20} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.fakeCard}>
            <Text style={styles.fakeCardTitle}>Background content</Text>
            <Text style={styles.fakeCardText}>
              This colorful layer exists only to help you see the blur effect.
            </Text>

            <View style={styles.fakeRow}>
              <View style={styles.fakePill} />
              <View style={[styles.fakePill, styles.fakePillAlt]} />
            </View>
          </View>

          <View style={styles.blurWrap}>
            <BlurView
              style={styles.blurView}
              blurType="light"
              blurAmount={18}
              reducedTransparencyFallbackColor="rgba(255,255,255,0.92)"
            />

            <View style={styles.glassCard}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardLabel}>Encrypted Item</Text>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Glass</Text>
                </View>
              </View>

              <Text style={styles.cardDomain}>google.com</Text>
              <Text style={styles.cardUser}>john.doe@example.com</Text>
              <Text style={styles.cardPassword}>••••••••••••</Text>

              <View style={styles.actionsRow}>
                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>

                <Pressable style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.bottomNote}>
            <Text style={styles.bottomNoteText}>
              If you can see the background through the card, blur is working.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0D',
  },
  background: {
    flex: 1,
    backgroundColor: '#0A0A0D',
  },
  glowOne: {
    position: 'absolute',
    top: 70,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(130, 160, 255, 0.35)',
  },
  glowTwo: {
    position: 'absolute',
    top: 280,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 120, 200, 0.28)',
  },
  glowThree: {
    position: 'absolute',
    bottom: 120,
    left: 40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 220, 180, 0.25)',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  kicker: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
    marginTop: 4,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  fakeCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginBottom: 18,
  },
  fakeCardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  fakeCardText: {
    color: 'rgba(255,255,255,0.72)',
    marginTop: 8,
    lineHeight: 20,
  },
  fakeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  fakePill: {
    flex: 1,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  fakePillAlt: {
    backgroundColor: 'rgba(120,160,255,0.18)',
  },
  blurWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  glassCard: {
    padding: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDomain: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  cardUser: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 15,
    marginTop: 6,
  },
  cardPassword: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 20,
    letterSpacing: 4,
    marginTop: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  primaryButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  bottomNote: {
    marginTop: 14,
    paddingHorizontal: 4,
  },
  bottomNoteText: {
    color: 'rgba(255,255,255,0.68)',
    textAlign: 'center',
  },
});
