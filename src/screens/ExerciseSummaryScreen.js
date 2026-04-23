import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../utils/theme';
import { useApp } from '../context/AppContext';

const MACHINE_ICONS = {
  treadmill: '🏃',
  bike: '🚴',
  elliptical: '⚡',
  rowing: '🚣',
  weights: '🏋️',
  default: '💪',
};

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} min ${s} seg` : `${s} seg`;
}

export default function ExerciseSummaryScreen({ route, navigation }) {
  const { entry } = route.params;
  const { state } = useApp();
  const bounce = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(bounce, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const icon = MACHINE_ICONS[entry.machineType] || MACHINE_ICONS.default;
  const date = new Date(entry.date);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>

        {/* Trophy animation */}
        <Animated.View style={[styles.trophyContainer, { transform: [{ scale: bounce }] }]}>
          <Text style={styles.trophyIcon}>🏆</Text>
        </Animated.View>

        <Text style={styles.title}>¡Sesión completada!</Text>
        <Text style={styles.subtitle}>Excelente trabajo. Tus puntos han sido acreditados.</Text>

        {/* Points earned */}
        <View style={styles.pointsEarnedCard}>
          <Text style={styles.pointsEarnedLabel}>Puntos ganados</Text>
          <Text style={styles.pointsEarnedValue}>+{entry.points}</Text>
          <Text style={styles.totalPoints}>Total: {state.totalPoints} pts</Text>
        </View>

        {/* Session details */}
        <Animated.View style={[styles.detailsCard, { opacity: fadeIn }]}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>{icon}</Text>
            <View>
              <Text style={styles.detailTitle}>{entry.machineName}</Text>
              <Text style={styles.detailSub}>{entry.machineId}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>⏱ {formatDuration(entry.duration)}</Text>
              <Text style={styles.statLabel}>Duración</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>
                {date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
              </Text>
              <Text style={styles.statLabel}>Fecha</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>Nivel {state.user.level}</Text>
              <Text style={styles.statLabel}>Tu nivel</Text>
            </View>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actions, { opacity: fadeIn }]}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Scanner')}
          >
            <Text style={styles.primaryBtnText}>📷 Escanear otra máquina</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.secondaryBtnText}>Ir al inicio</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },

  trophyContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  trophyIcon: { fontSize: 56 },

  title: { color: COLORS.text, fontSize: 26, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 20 },

  pointsEarnedCard: {
    backgroundColor: COLORS.accentDark,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  pointsEarnedLabel: { color: COLORS.accent, fontSize: 13, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  pointsEarnedValue: { color: COLORS.text, fontSize: 56, fontWeight: '900' },
  totalPoints: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },

  detailsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailIcon: { fontSize: 32 },
  detailTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  detailSub: { color: COLORS.textMuted, fontSize: 12 },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statVal: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },

  actions: { width: '100%', gap: 10 },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: { color: COLORS.textMuted, fontSize: 15 },
});
