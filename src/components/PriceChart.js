import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors, spacing } from '../config/theme';
import { getMarketChart } from '../services/rateService';
import { formatUsd } from '../utils/formatters';

const TIMEFRAMES = ['1H', '1D', '1W', '1M', '1Y', 'ALL'];
const screenWidth = Dimensions.get('window').width;

export default function PriceChart({ symbol }) {
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
  const lineColor = isUp ? '#34d399' : '#f87171';

  return (
    <View style={styles.wrap}>
      {currentPrice != null && (
        <Text style={styles.price}>{formatUsd(currentPrice)}</Text>
      )}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.violet} />
        </View>
      ) : prices.length > 1 ? (
        <LineChart
          data={{ datasets: [{ data: prices }] }}
          width={screenWidth - spacing(10)}
          height={180}
          withDots={false}
          withInnerLines={false}
          withOuterLines={false}
          withHorizontalLabels={false}
          withVerticalLabels={false}
          withShadow={false}
          bezier
          chartConfig={{
            backgroundGradientFrom: colors.bg,
            backgroundGradientTo: colors.bg,
            color: () => lineColor,
            strokeWidth: 2,
            propsForBackgroundLines: { stroke: 'transparent' },
          }}
          style={styles.chart}
        />
      ) : (
        <View style={styles.loadingBox}>
          <Text style={styles.noData}>No chart data</Text>
        </View>
      )}
      <View style={styles.tabsRow}>
        {TIMEFRAMES.map((tf) => (
          <Pressable
            key={tf}
            onPress={() => setTimeframe(tf)}
            style={[styles.tab, tf === timeframe && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, tf === timeframe && styles.tabLabelActive]}>
              {tf}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing(6), alignItems: 'center' },
  price: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: spacing(2), alignSelf: 'flex-start', marginLeft: spacing(5) },
  chart: { borderRadius: 16 },
  loadingBox: { height: 180, alignItems: 'center', justifyContent: 'center', width: '100%' },
  noData: { color: colors.textSecondary, fontSize: 13 },
  tabsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: spacing(5), marginTop: spacing(3) },
  tab: { paddingVertical: spacing(1.5), paddingHorizontal: spacing(2.5), borderRadius: 999 },
  tabActive: { backgroundColor: colors.violet },
  tabLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: '#fff' },
});
