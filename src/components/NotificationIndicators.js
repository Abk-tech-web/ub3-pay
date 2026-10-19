import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useUnreadAnnouncements from '../hooks/useUnreadAnnouncements';

// Small red dot for the bell on the wallet card.
export function NotificationDot({ style }) {
  const n = useUnreadAnnouncements();
  if (!n) return null;
  return <View pointerEvents="none" style={[styles.dot, style]} />;
}

// Violet count pill for the Notifications row in Profile.
export function NotificationBadge() {
  const n = useUnreadAnnouncements();
  if (!n) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{n > 9 ? '9+' : n}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#ef4444', borderWidth: 1.5, borderColor: '#4C1D95',
  },
  badge: {
    backgroundColor: '#7C3AED', borderRadius: 11, minWidth: 22, height: 22, paddingHorizontal: 7,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
