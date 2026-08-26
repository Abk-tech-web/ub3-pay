import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { colors, spacing, radii } from '../../config/theme';
import PrimaryButton from '../../components/PrimaryButton';

const UB3_LOGO = require('../../assets/images/logo.png');

function formatDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${weekday}, ${monthDay}  •  ${time}`;
}

function genSessionId() {
  return `${Date.now()}${Math.floor(Math.random() * 1000000)}`;
}

export default function TransactionReceiptScreen({ navigation, route }) {
  const {
    amountPrefix = '',
    amount,
    topRightLabel,
    topRightIcon = 'business-outline',
    topRightImage,
    rows = [],
    explorerUrl,
    date,
  } = route.params;

  const [sessionId] = useState(genSessionId());
  const [sharing, setSharing] = useState(false);
  const shotRef = useRef();

  const onDone = () => {
    if (route.params?.dismissTo) {
      navigation.navigate(route.params.dismissTo);
    } else {
      navigation.goBack();
    }
  };

  const openExplorer = () => {
    if (explorerUrl) Linking.openURL(explorerUrl);
  };

  const onShare = async () => {
    try {
      setSharing(true);
      const uri = await shotRef.current.capture();
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share receipt' });
      }
    } catch (e) {
      console.error('Share failed', e);
    } finally {
      setSharing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ViewShot ref={shotRef} options={{ format: 'png', quality: 1 }} style={styles.shotWrap}>
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.brandRow}>
              <Image source={UB3_LOGO} style={styles.brandLogo} resizeMode="contain" />
              <Text style={styles.brandText}>UB3 Pay</Text>
            </View>
              <View style={styles.topRightPill}>
                {topRightImage ? (
                  <Image source={{ uri: topRightImage }} style={styles.topRightImg} />
                ) : (
                  <Ionicons name={topRightIcon} size={14} color="#fff" />
                )}
                <Text style={styles.topRightText}>{topRightLabel}</Text>
              </View>
            </View>

            <Text style={styles.amount}>
              {amountPrefix}{amount}
            </Text>
            <Text style={styles.dateTime}>{formatDateTime(date ? new Date(date) : new Date())}</Text>

            <View style={styles.detailsCard}>
              {rows.map((row, i) => (
                <View key={i}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <View style={styles.rowValueRow}>
                    <Text style={styles.rowValue}>{row.value}</Text>
                    {row.copyValue && !sharing ? (
                      <Pressable hitSlop={8} style={styles.copyBtn} onPress={() => Clipboard.setStringAsync(row.copyValue)}>
                        <Ionicons name="copy-outline" size={14} color={colors.textSecondary} />
                      </Pressable>
                    ) : null}
                  </View>
                  {i < rows.length - 1 && (
                    <View style={styles.dashedDivider}>
                      {Array.from({ length: 30 }).map((_, j) => (
                        <View key={j} style={styles.dash} />
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.perforationRow}>
              {Array.from({ length: 14 }).map((_, i) => (
                <View key={i} style={styles.perforationDot} />
              ))}
            </View>
          </View>
        </ViewShot>

        {explorerUrl ? (
          <Pressable style={styles.explorerBtn} onPress={openExplorer}>
            <Ionicons name="open-outline" size={16} color="#fff" />
            <Text style={styles.explorerLabel}>View on Block Explorer</Text>
          </Pressable>
        ) : null}

        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.shareBtn} onPress={onShare} disabled={sharing}>
            <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.shareLabel}>{sharing ? 'Preparing...' : 'Share Receipt'}</Text>
          </Pressable>

          <View style={{ height: spacing(3) }} />

          <PrimaryButton title="Done" onPress={onDone} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: spacing(6), paddingTop: spacing(6) },
  scrollContent: { flexGrow: 1, paddingBottom: spacing(2) },
  footer: { paddingTop: spacing(2) },
  shotWrap: { backgroundColor: colors.bg },
  card: {
    backgroundColor: '#0d0d0d',
    minWidth: '100%',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(6),
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(6),
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
  brandLogo: { width: 40, height: 40, borderRadius: 10 },
  brandText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  topRightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
  },
  topRightImg: { width: 16, height: 16, borderRadius: 8 },
  topRightText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  amount: { fontSize: 38, fontWeight: '800', color: '#fff', marginBottom: spacing(1) },
  dateTime: { fontSize: 13, color: '#9a9a9a', fontWeight: '600', marginBottom: spacing(6) },
  detailsCard: {
    backgroundColor: '#151515',
    borderRadius: radii.md,
    padding: spacing(5),
  },
  rowLabel: { fontSize: 12, color: '#9a9a9a', marginBottom: spacing(1) },
  rowValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(3) },
  rowValue: { fontSize: 15, fontWeight: '700', color: '#fff' },
  copyBtn: { padding: spacing(1) },
  dashedDivider: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginBottom: spacing(3),
    gap: 5,
  },
  dash: { width: 5, height: 1, backgroundColor: '#333' },
  perforationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing(5),
    marginHorizontal: -spacing(6),
    marginBottom: -spacing(6) - 8,
  },
  perforationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.bg,
  },
  explorerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    backgroundColor: '#5B3FD1',
    borderRadius: radii.md,
    paddingVertical: spacing(3),
    marginTop: spacing(5),
  },
  explorerLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    paddingVertical: spacing(3),
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareLabel: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
});
