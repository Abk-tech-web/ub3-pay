import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, Image, StyleSheet, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';

const VIOLET = '#7C3AED';

let createAudioPlayer = null;
try { createAudioPlayer = require('expo-audio').createAudioPlayer; } catch (e) { createAudioPlayer = null; }

export default function ProcessingOverlay({ visible, phase, title, subtitle }) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const isSuccess = phase === 'success';

  useEffect(() => {
    if (!visible || isSuccess) return undefined;
    spin.setValue(0);
    pulse.setValue(0);
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    spinLoop.start();
    pulseLoop.start();
    return () => { spinLoop.stop(); pulseLoop.stop(); };
  }, [visible, isSuccess]);

  useEffect(() => {
    if (!visible || !isSuccess) { pop.setValue(0); return; }
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
  }, [visible, isSuccess]);

  useEffect(() => {
    if (!visible || !isSuccess || !createAudioPlayer) return undefined;
    let player = null;
    try {
      player = createAudioPlayer(require('../../assets/sounds/success.mp3'));
      player.volume = 1;
      player.play();
    } catch (e) { player = null; }
    return () => { try { if (player) player.remove(); } catch (e) {} };
  }, [visible, isSuccess]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const logoScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <Modal visible={!!visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        {isSuccess ? (
          <Animated.View style={[styles.successCircle, { opacity: pop, transform: [{ scale: popScale }] }]}>
            <Feather name="check" size={54} color="#fff" />
          </Animated.View>
        ) : (
          <View style={styles.spinnerWrap}>
            <Animated.View style={[styles.ring, { transform: [{ rotate: rotate }] }]} />
            <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }] }]}>
              <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="cover" />
            </Animated.View>
          </View>
        )}
        <Text style={styles.title}>{isSuccess ? (title || 'Payment successful') : (title || 'Processing payment')}</Text>
        <Text style={styles.subtitle}>
          {isSuccess ? (subtitle || 'Taking you to your receipt') : (subtitle || 'Please do not close the app')}
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,10,45,0.82)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  spinnerWrap: { width: 132, height: 132, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  ring: {
    position: 'absolute', width: 132, height: 132, borderRadius: 66, borderWidth: 4,
    borderColor: 'rgba(167,139,250,0.25)', borderTopColor: VIOLET, borderRightColor: '#A78BFA',
  },
  logoWrap: {
    width: 80, height: 80, borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff',
    shadowColor: VIOLET, shadowOpacity: 0.7, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 12,
  },
  logo: { width: 80, height: 80 },
  successCircle: {
    width: 112, height: 112, borderRadius: 56, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginBottom: 28,
    shadowColor: '#16A34A', shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 0 }, elevation: 14,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8, textAlign: 'center' },
});
