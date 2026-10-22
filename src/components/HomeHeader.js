import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getAvatarColor } from '../utils/avatarColor';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function niceName(user) {
  let n = user && user.firstName ? String(user.firstName).trim().split(/\s+/)[0] : '';
  if (!n && user && user.email) n = String(user.email).split('@')[0].split(/[._\-+]/)[0] || '';
  if (!n) return 'there';
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

export default function HomeHeader({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const name = niceName(user);
  const letter = name.charAt(0).toUpperCase();
  const photo = user && user.photoUrl;
  const go = () => { if (navigation) navigation.navigate('ProfileTab'); };

  return (
    <Pressable onPress={go} hitSlop={6} style={styles.root}>
      <LinearGradient
        colors={['#C4B5FD', colors.violet, colors.violetDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ring}
      >
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(user && user.uid), borderColor: colors.bg }]}>
          {photo ? <Image source={{ uri: photo }} style={styles.img} /> : <Text style={styles.letter}>{letter}</Text>}
        </View>
      </LinearGradient>
      <View style={styles.texts}>
        <Text style={[styles.hello, { color: colors.textSecondary }]}>{greeting()}</Text>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{name}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  ring: {
    width: 54, height: 54, borderRadius: 27, padding: 2.5, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C3AED', shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 8,
  },
  avatar: { width: 49, height: 49, borderRadius: 24.5, overflow: 'hidden', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  img: { width: '100%', height: '100%' },
  letter: { color: '#fff', fontSize: 20, fontWeight: '800' },
  texts: { flex: 1, marginLeft: 12 },
  hello: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  name: { fontSize: 20, fontWeight: '800', marginTop: 1 },
});
