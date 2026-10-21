import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getAvatarColor } from '../../utils/avatarColor';
import { timeAgo } from '../../utils/formatters';
import UB3Loader from '../../components/UB3Loader';
import ChatView from '../../components/support/ChatView';
import { getMyChat, sendMyMessage, getInbox } from '../../services/supportService';

const SHADOW = '#2a1260';
const CATEGORIES = ['Payment', 'Withdrawal', 'Deposit', 'Account', 'Other'];

function AdminInbox({ navigation, colors, styles, onUnread }) {
  const [chats, setChats] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState('open');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await getInbox();
      const list = r.chats || [];
      setChats(list);
      if (onUnread) onUnread(list.reduce((s, c) => s + (c.unread || 0), 0));
    } catch (e) {}
    setLoaded(true);
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const shown = chats.filter((c) => (filter === 'all' ? true : filter === 'resolved' ? c.status === 'resolved' : c.status !== 'resolved'));

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.filterRow}>
        {[['open', 'Open'], ['resolved', 'Resolved'], ['all', 'All']].map(([k, label]) => (
          <Pressable key={k} onPress={() => setFilter(k)} style={[styles.fChip, filter === k && styles.fChipOn]}>
            <Text style={[styles.fChipText, filter === k && { color: '#fff' }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={shown}
        keyExtractor={(c) => c.uid}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.violet} />}
        ListEmptyComponent={
          !loaded ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}><UB3Loader size={72} color={colors.violet} /></View>
          ) : (
            <View style={styles.emptyBox}>
              <View style={styles.emptyCircle}><Feather name="inbox" size={28} color={colors.violet} /></View>
              <Text style={styles.emptyTitle}>No conversations here</Text>
              <Text style={styles.emptySub}>When a user contacts customer service, their conversation will show up here.</Text>
            </View>
          )
        }
        renderItem={({ item: c }) => {
          const title = c.name || c.email || 'User';
          const preview = (c.lastSender === 'admin' ? 'You: ' : '') + c.lastMessage;
          return (
            <Pressable
              style={({ pressed }) => [styles.chatCard, pressed && { opacity: 0.88 }]}
              onPress={() => navigation.navigate('SupportAdminChat', { uid: c.uid, name: c.name, email: c.email })}
            >
              <View style={[styles.avatar, { backgroundColor: getAvatarColor(c.uid) }]}>
                <Text style={styles.avatarText}>{String(title).slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.chatTitle} numberOfLines={1}>{title}</Text>
                  {c.lastMessageAt ? <Text style={styles.chatTime}>{timeAgo(new Date(c.lastMessageAt).toISOString())}</Text> : null}
                </View>
                <Text style={[styles.chatPreview, c.unread > 0 && { color: colors.textPrimary, fontWeight: '700' }]} numberOfLines={1}>{preview}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                {c.unread > 0 ? (
                  <View style={styles.badge}><Text style={styles.badgeText}>{c.unread > 9 ? '9+' : c.unread}</Text></View>
                ) : null}
                {c.status === 'resolved' ? (
                  <View style={styles.resolvedPill}><Text style={styles.resolvedText}>Resolved</Text></View>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

export default function SupportScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const report = !!(route && route.params && route.params.report);
  const [isAdmin, setIsAdmin] = useState(null);
  const [tab, setTab] = useState('inbox');
  const [unread, setUnread] = useState(0);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    let alive = true;
    getMyChat(0)
      .then((r) => { if (alive) setIsAdmin(!!(r && r.isAdmin)); })
      .catch(() => { if (alive) setIsAdmin(false); });
    return () => { alive = false; };
  }, []);

  const loadMine = useCallback((after) => getMyChat(after), []);
  const sendMine = useCallback((body) => sendMyMessage(body), []);

  const title = report ? 'Report an issue' : 'Customer service';

  return (
    <View style={styles.root}>
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={styles.glowA} />
        <View style={styles.glowB} />
        <View style={styles.heroTop}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSub}>{isAdmin && tab === 'inbox' ? 'User conversations' : 'We are here to help'}</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
        {isAdmin ? (
          <View style={styles.segment}>
            <Pressable onPress={() => setTab('inbox')} style={[styles.segBtn, tab === 'inbox' && styles.segOn]}>
              <Feather name="inbox" size={14} color={tab === 'inbox' ? '#4C1D95' : 'rgba(255,255,255,0.85)'} />
              <Text style={[styles.segText, tab === 'inbox' && { color: '#4C1D95' }]}>Inbox</Text>
              {unread > 0 ? <View style={styles.segBadge}><Text style={styles.segBadgeText}>{unread > 9 ? '9+' : unread}</Text></View> : null}
            </Pressable>
            <Pressable onPress={() => setTab('mine')} style={[styles.segBtn, tab === 'mine' && styles.segOn]}>
              <Feather name="message-circle" size={14} color={tab === 'mine' ? '#4C1D95' : 'rgba(255,255,255,0.85)'} />
              <Text style={[styles.segText, tab === 'mine' && { color: '#4C1D95' }]}>My chat</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1 }}>
        {isAdmin === null ? (
          <View style={{ alignItems: 'center', marginTop: 70 }}><UB3Loader size={72} color={colors.violet} /></View>
        ) : isAdmin && tab === 'inbox' ? (
          <AdminInbox navigation={navigation} colors={colors} styles={styles} onUnread={setUnread} />
        ) : (
          <ChatView
            mode="user"
            load={loadMine}
            send={sendMine}
            showBanner
            categories={report ? CATEGORIES : null}
            emptyTitle={report ? 'Tell us what went wrong' : 'How can we help?'}
            emptySub="Describe your issue below. You can attach a screenshot or photo as proof."
          />
        )}
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: '#4C1D95', paddingBottom: 22, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, overflow: 'hidden' },
  glowA: { position: 'absolute', top: -60, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.09)' },
  glowB: { position: 'absolute', bottom: -70, left: -50, width: 210, height: 210, borderRadius: 105, backgroundColor: 'rgba(139,92,246,0.35)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.78)', fontSize: 12, marginTop: 2 },
  segment: { flexDirection: 'row', marginTop: 16, marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 18, padding: 4 },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: 14 },
  segOn: { backgroundColor: '#FFFFFF' },
  segText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '800' },
  segBadge: { backgroundColor: '#ef4444', borderRadius: 9, minWidth: 18, height: 18, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  segBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  filterRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  fChip: { height: 34, paddingHorizontal: 16, borderRadius: 17, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  fChipOn: { backgroundColor: colors.violet, borderColor: colors.violet },
  fChipText: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  chatCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: 22, padding: 14, marginBottom: 12,
    shadowColor: SHADOW, shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chatTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', flex: 1 },
  chatTime: { color: colors.textSecondary, fontSize: 11 },
  chatPreview: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
  badge: { backgroundColor: colors.violet, borderRadius: 11, minWidth: 22, height: 22, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  resolvedPill: { backgroundColor: 'rgba(34,197,94,0.14)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  resolvedText: { color: '#22C55E', fontSize: 10, fontWeight: '800' },
  emptyBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 28 },
  emptyCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptySub: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 6 },
});
