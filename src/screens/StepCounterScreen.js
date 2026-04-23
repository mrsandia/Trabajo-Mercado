import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pedometer } from 'expo-sensors';
import { COLORS } from '../utils/theme';
import { saveDailySteps, loadDailySteps, todayKey } from '../utils/storage';

const DAILY_GOAL = 10000;

const MILESTONES = [
  { steps: 2000, label: '¡Calentaste!', icon: '🔥' },
  { steps: 5000, label: '¡Mitad del camino!', icon: '⚡' },
  { steps: 8000, label: '¡Casi listo!', icon: '🚀' },
  { steps: 10000, label: '¡Meta alcanzada!', icon: '🏆' },
];

function CircleProgress({ steps, goal }) {
  const progress = Math.min(steps / goal, 1);
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotate, {
      toValue: progress,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const size = 220;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const pct = Math.round(progress * 100);

  return (
    <View style={[styles.circleContainer, { width: size, height: size }]}>
      {/* Background circle (simulated with border) */}
      <View
        style={[
          styles.circleBg,
          { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth },
        ]}
      />
      {/* Progress arc simulation */}
      <View style={styles.circleContent}>
        <Text style={styles.stepsValue}>{steps.toLocaleString()}</Text>
        <Text style={styles.stepsLabel}>pasos</Text>
        <Text style={styles.stepsPercent}>{pct}% de meta</Text>
      </View>
      {/* Visual progress indicator */}
      <View
        style={[
          styles.progressArc,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: progress > 0 ? COLORS.accent : 'transparent',
            borderRightColor: progress > 0.25 ? COLORS.accent : 'transparent',
            borderBottomColor: progress > 0.5 ? COLORS.accent : 'transparent',
            borderLeftColor: progress > 0.75 ? COLORS.accent : 'transparent',
            transform: [{ rotate: '-90deg' }],
          },
        ]}
      />
    </View>
  );
}

function WeekBar({ day, steps, goal, isToday }) {
  const height = Math.max(4, Math.min(60, (steps / goal) * 60));
  return (
    <View style={styles.barItem}>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { height, backgroundColor: isToday ? COLORS.accent : COLORS.textMuted },
          ]}
        />
      </View>
      <Text style={[styles.barLabel, isToday && { color: COLORS.accent }]}>{day}</Text>
      <Text style={styles.barSteps}>{steps > 0 ? (steps / 1000).toFixed(1) + 'k' : '-'}</Text>
    </View>
  );
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function StepCounterScreen() {
  const [isPedometerAvailable, setIsPedometerAvailable] = useState(null);
  const [steps, setSteps] = useState(0);
  const [weekData, setWeekData] = useState(Array(7).fill(0));
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    (async () => {
      const available = await Pedometer.isAvailableAsync().catch(() => false);
      setIsPedometerAvailable(available);

      // Load saved steps for today
      const saved = await loadDailySteps(todayKey());
      if (saved > 0) setSteps(saved);

      if (available) {
        // Get steps from start of today
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        try {
          const result = await Pedometer.getStepCountAsync(start, end);
          setSteps(result.steps);
          await saveDailySteps(todayKey(), result.steps);
        } catch (_) {}

        // Subscribe to live updates
        const sub = Pedometer.watchStepCount((result) => {
          setSteps((prev) => {
            const newSteps = prev + result.steps;
            saveDailySteps(todayKey(), newSteps);
            return newSteps;
          });
        });
        setSubscription(sub);
      }
    })();

    return () => subscription?.remove();
  }, []);

  // Simulate steps in demo mode
  const [simulating, setSimulating] = useState(false);
  const simRef = useRef(null);

  function toggleSimulation() {
    if (simulating) {
      clearInterval(simRef.current);
      setSimulating(false);
    } else {
      simRef.current = setInterval(() => {
        setSteps((s) => {
          const next = s + Math.floor(Math.random() * 3 + 1);
          saveDailySteps(todayKey(), next);
          return next;
        });
      }, 500);
      setSimulating(true);
    }
  }

  const todayIdx = new Date().getDay();
  const progress = Math.min(steps / DAILY_GOAL, 1);
  const remaining = Math.max(0, DAILY_GOAL - steps);
  const calories = Math.round(steps * 0.04);
  const distanceKm = (steps * 0.00076).toFixed(2);

  const nextMilestone = MILESTONES.find((m) => steps < m.steps);
  const lastMilestone = [...MILESTONES].reverse().find((m) => steps >= m.steps);

  const displayWeekData = weekData.map((s, i) => (i === todayIdx ? steps : s));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Contador de Pasos</Text>
        <Text style={styles.subtitle}>
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>

        {/* Circle progress */}
        <View style={styles.circleWrapper}>
          <CircleProgress steps={steps} goal={DAILY_GOAL} />
        </View>

        {/* Milestone banner */}
        {lastMilestone && (
          <View style={styles.milestoneBanner}>
            <Text style={styles.milestoneIcon}>{lastMilestone.icon}</Text>
            <Text style={styles.milestoneText}>{lastMilestone.label}</Text>
          </View>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{calories}</Text>
            <Text style={styles.statLabel}>🔥 kcal</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{distanceKm}</Text>
            <Text style={styles.statLabel}>📍 km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{remaining.toLocaleString()}</Text>
            <Text style={styles.statLabel}>👟 restantes</Text>
          </View>
        </View>

        {/* Next milestone */}
        {nextMilestone && (
          <View style={styles.nextMilestone}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextMilestoneLabel}>Próximo logro</Text>
              <Text style={styles.nextMilestoneText}>
                {nextMilestone.icon} {nextMilestone.label} · {(nextMilestone.steps - steps).toLocaleString()} pasos
              </Text>
              <View style={styles.milestoneBar}>
                <View
                  style={[
                    styles.milestoneBarFill,
                    {
                      width: `${Math.min(100, (steps / nextMilestone.steps) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* Week chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Esta semana</Text>
          <View style={styles.weekChart}>
            {DAYS.map((day, i) => (
              <WeekBar
                key={day}
                day={day}
                steps={displayWeekData[i]}
                goal={DAILY_GOAL}
                isToday={i === todayIdx}
              />
            ))}
          </View>
        </View>

        {/* Sensor status */}
        <View style={styles.sensorCard}>
          {isPedometerAvailable === null ? (
            <Text style={styles.sensorText}>Verificando sensor...</Text>
          ) : isPedometerAvailable ? (
            <>
              <Text style={styles.sensorIcon}>✅</Text>
              <Text style={styles.sensorText}>Podómetro activo · Contando en tiempo real</Text>
            </>
          ) : (
            <>
              <Text style={styles.sensorIcon}>⚠️</Text>
              <Text style={styles.sensorText}>
                Podómetro no disponible en este dispositivo.{' '}
                {Platform.OS === 'ios'
                  ? 'Verifica permisos de Movimiento y Fitness.'
                  : 'Verifica permisos de actividad física.'}
              </Text>
            </>
          )}
        </View>

        {/* Demo button when no pedometer */}
        {!isPedometerAvailable && (
          <TouchableOpacity
            style={[styles.demoBtn, simulating && styles.demoBtnActive]}
            onPress={toggleSimulation}
          >
            <Text style={styles.demoBtnText}>
              {simulating ? '⏸ Pausar simulación' : '▶ Simular pasos (demo)'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1, paddingHorizontal: 20 },

  title: { color: COLORS.text, fontSize: 24, fontWeight: '800', marginTop: 16 },
  subtitle: { color: COLORS.textMuted, fontSize: 13, marginBottom: 20, marginTop: 4 },

  circleWrapper: { alignItems: 'center', marginBottom: 20 },

  circleContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  circleBg: {
    position: 'absolute',
    borderColor: COLORS.card,
  },
  progressArc: {
    position: 'absolute',
  },
  circleContent: { alignItems: 'center', zIndex: 1 },
  stepsValue: { fontSize: 52, fontWeight: '900', color: COLORS.text },
  stepsLabel: { fontSize: 15, color: COLORS.textMuted, marginTop: -6 },
  stepsPercent: { fontSize: 13, color: COLORS.accent, marginTop: 4, fontWeight: '600' },

  milestoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentDark,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.accent,
    gap: 8,
  },
  milestoneIcon: { fontSize: 22 },
  milestoneText: { color: COLORS.accent, fontSize: 15, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: COLORS.border },

  nextMilestone: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nextMilestoneLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  nextMilestoneText: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 10 },
  milestoneBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  milestoneBarFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 3 },

  section: { marginBottom: 20 },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginBottom: 12 },

  weekChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  barItem: { alignItems: 'center', flex: 1 },
  barTrack: {
    height: 60,
    width: 12,
    backgroundColor: COLORS.border,
    borderRadius: 6,
    justifyContent: 'flex-end',
    marginBottom: 6,
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { color: COLORS.textMuted, fontSize: 10, marginBottom: 2 },
  barSteps: { color: COLORS.textMuted, fontSize: 9 },

  sensorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  sensorIcon: { fontSize: 20 },
  sensorText: { color: COLORS.textMuted, fontSize: 13, flex: 1, lineHeight: 18 },

  demoBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  demoBtnActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentDark },
  demoBtnText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
});
