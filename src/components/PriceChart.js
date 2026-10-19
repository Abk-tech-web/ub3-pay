import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../config/theme';
import { getMarketChart } from '../services/rateService';
import { formatUsd } from '../utils/formatters';

const TIMEFRAMES = ['1H', '1D', '1W', '1M', '1Y', 'ALL'];
const screenWidth = Dimensions.get('window').width;

export default function PriceChart({ symbol, height = 180 }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [timeframe, setTimeframe] = useState('1D');
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(null);

  const load = useCallback(async (tf) => {
    setLoading(true);
    try {
      const data = await getMarketChart(symbol, tf);
      setPoints(data);
      if (data.length) setCurrentPrice(data[data.length - 1].price);
    } catch (e) {
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    load(timeframe);
  }, [timeframe, load]);

  const prices = points.map((p) => p.price);
  const isUp = prices.length > 1 ? prices[prices.length - 1] >= prices[0] : true;
  const lineColor = isUp ? '#22c55e' : '#ef4444';
  const first = prices.length > 1 ? prices[0] : null;
  const last = prices.length > 1 ? prices[prices.length - 1] : null;
  const changePct = first && first !== 0 ? ((last - first) / first) * 100 : null;
  const chartWidth = screenWidth - spacing(10) - spacing(3) * 2;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.priceLabel}>{symbol + ' price'}</Text>
          {currentPrice != null && <Text style={styles.price}>{formatUsd(currentPrice)}</Text>}
        </View>
        {changePct != null && !loading ? (
          <View style={[styles.changePill, { backgroundColor: isUp ? 'rgba(34,197,94,0.16)' : 'rgba(239,68,68,0.16)' }]}>
            <Feather name={isUp ? 'trending-up' : 'trending-down'} size={14} color={lineColor} />
            <Text style={[styles.changeText, { color: lineColor }]}>
              {(isUp ? '+' : '') + changePct.toFixed(2) + '%'}
            </Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={[styles.loadingBox, { height }]}>
          <ActivityIndicator color={colors.violet} />
        </View>
      ) : prices.length > 1 ? (
        <LineChart
          data={{ datasets: [{ data: prices }] }}
          width={chartWidth}
          height={height}
          withDots={false}
          withInnerLines={false}
          withOuterLines={false}
          withHorizontalLabels={false}
          withVerticalLabels={false}
          withShadow
          bezier
          chartConfig={{
            backgroundGradientFrom: colors.bgCard,
            backgroundGradientTo: colors.bgCard,
            color: () => lineColor,
            strokeWidth: 3,
            fillShadowGradient: lineColor,
            fillShadowGradientOpacity: 0.18,
            propsForBackgroundLines: { stroke: 'transparent' },
          }}
          style={styles.chart}
        />
      ) : (
        <View style={[styles.loadingBox, { height }]}>
          <Text style={styles.noData}>No chart data</Text>
        </View>
      )}

      <View style={styles.tabsTrack}>
        {TIMEFRAMES.map((tf) => (
          <Pressable
            key={tf}
            onPress={() => setTimeframe(tf)}
            style={[styles.tab, tf === timeframe && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, tf === timeframe && styles.tabLabelActive]}>{tf}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard, borderRadius: 26, borderWidth: 1, borderColor: colors.border,
    padding: spacing(3),
    shadowColor: '#2a1260', shadowOpacity: 0.2, shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 }, elevation: 7,
  },
  topRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing(2), paddingTop: spacing(1), marginBottom: spacing(2),
  },
  priceLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  price: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginTop: 2 },
  changePill: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 999,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  changeText: { fontSize: 13, fontWeight: '800', marginLeft: 6 },
  chart: { borderRadius: 18, marginLeft: -spacing(3) },
  loadingBox: { height: 180, alignItems: 'center', justifyContent: 'center', width: '100%' },
  noData: { color: colors.textSecondary, fontSize: 13 },
  tabsTrack: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing(3),
    backgroundColor: colors.bgElevated, borderRadius: 999, padding: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing(1.5), borderRadius: 999 },
  tabActive: {
    backgroundColor: colors.violet,
    shadowColor: '#2a1260', shadowOpacity: 0.35, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  tabLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  tabLabelActive: { color: '#fff', fontWeight: '800' },
});
