import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Vibration,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { COLORS } from '../utils/theme';

const MACHINE_ICONS = {
  treadmill: '🏃',
  bike: '🚴',
  elliptical: '⚡',
  rowing: '🚣',
  weights: '🏋️',
  default: '💪',
};

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function PulseRing({ active }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active]);

  return (
    <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse }] }]} />
  );
}

function SensorIndicator({ active }) {
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) { blink.setValue(0.3); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active]);

  return (
    <View style={styles.sensorRow}>
      <Animated.View style={[styles.sensorDot, { opacity: blink, backgroundColor: active ? COLORS.accent : COLORS.textMuted }]} />
      <Text style={styles.sensorText}>
        {active ? 'Sensor activo · acumulando puntos' : 'Sensor inactivo'}
      </Text>
    </View>
  );
}

export default function ExerciseScreen({ navigation }) {
  const { state, tickSession, endSession } = useApp();
  const { activeSession, sessionPoints } = state;
  const [elapsed, setElapsed] = useState(0);
  const [machineDetected, setMachineDetected] = useState(true); // simulates sensor
  const tickRef = useRef(null);
  const sensorRef = useRef(null);

  useEffect(() => {
    if (!activeSession) return;

    // Tick every second to accumulate points
    tickRef.current = setInterval(() => {
      if (machineDetected) tickSession();
      setElapsed((e) => e + 1);
    }, 1000);

    // Simulate sensor fluctuation (machine in use detection)
    sensorRef.current = setInterval(() => {
      setMachineDetected((prev) => {
        // 85% chance sensor stays on, simulating real use
        return Math.random() > 0.15;
      });
    }, 3000);

    return () => {
      clearInterval(tickRef.current);
      clearInterval(sensorRef.current);
    };
  }, [activeSession, machineDetected]);

  async function handleEndExercise() {
    Alert.alert(
      'Terminar ejercicio',
      `¿Deseas terminar tu sesión? Ganarás ${Math.round(sessionPoints)} puntos.`,
      [
        { text: 'Continuar ejercitando', style: 'cancel' },
        {
          text: 'Terminar y cobrar puntos',
          style: 'default',
          onPress: async () => {
            clearInterval(tickRef.current);
            clearInterval(sensorRef.current);
            Vibration.vibrate([0, 100, 50, 100]);
            const entry = await endSession();
            navigation.navigate('ExerciseSummary', { entry });
          },
        },
      ]
    );
  }

  if (!activeSession) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.noSessionContainer}>
          <Text style={styles.noSessionIcon}>🏋️</Text>
          <Text style={styles.noSessionTitle}>Sin sesión activa</Text>
          <Text style={styles.noSessionDesc}>
            Escanea el código QR de una máquina para comenzar tu sesión de ejercicio.
          </Text>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => navigation.navigate('Scanner')}
          >
            <Text style={styles.scanBtnText}>📷 Escanear máquina</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const icon = MACHINE_ICONS[activeSession.machineType] || MACHINE_ICONS.default;
  const ppm = (activeSession.pointsPerSecond * 60).toFixed(1);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sesión activa</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>EN VIVO</Text>
          </View>
        </View>

        {/* Machine info */}
        <View style={styles.machineCard}>
          <Text style={styles.machineIcon}>{icon}</Text>
          <Text style={styles.machineName}>{activeSession.machineName}</Text>
          <Text style={styles.machineId}>{activeSession.machineId}</Text>
        </View>

        {/* Points display */}
        <View style={styles.pointsContainer}>
          <PulseRing active={machineDetected} />
          <View style={styles.pointsInner}>
            <Text style={styles.pointsValue}>{Math.round(sessionPoints)}</Text>
            <Text style={styles.pointsLabel}>puntos acumulados</Text>
          </View>
        </View>

        <SensorIndicator active={machineDetected} />

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{formatDuration(elapsed)}</Text>
            <Text style={styles.statLabel}>Duración</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{ppm}</Text>
            <Text style={styles.statLabel}>pts/min</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{Math.round(elapsed / 60 * 3.5)}</Text>
            <Text style={styles.statLabel}>kcal est.</Text>
          </View>
        </View>

        {/* Progress message */}
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            {sessionPoints < 50
              ? '💪 ¡Buen inicio! Sigue así.'
              : sessionPoints < 150
              ? '🔥 ¡Excelente ritmo! Estás en racha.'
              : sessionPoints < 300
              ? '⚡ ¡Increíble! Ya llevas bastante tiempo.'
              : '🏆 ¡Eres una máquina! Récord en camino.'}
          </Text>
        </View>

        {/* End exercise button */}
        <TouchableOpacity style={styles.endBtn} onPress={handleEndExercise}>
          <Text style={styles.endBtnIcon}>🏁</Text>
          <Text style={styles.endBtnText}>Terminar ejercicio</Text>
          <Text style={styles.endBtnSub}>Cobrar {Math.round(sessionPoints)} pts</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Los puntos se asignan según el tiempo de uso detectado por el sensor de la máquina.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,82,82,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accentRed },
  liveText: { color: COLORS.accentRed, fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  machineCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  machineIcon: { fontSize: 48, marginBottom: 8 },
  machineName: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  machineId: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },

  pointsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    height: 200,
  },
  pulseRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: COLORS.accent,
    opacity: 0.4,
  },
  pointsInner: { alignItems: 'center' },
  pointsValue: { fontSize: 72, fontWeight: '900', color: COLORS.accent },
  pointsLabel: { color: COLORS.textMuted, fontSize: 15, marginTop: -8 },

  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  sensorDot: { width: 10, height: 10, borderRadius: 5 },
  sensorText: { color: COLORS.textMuted, fontSize: 13 },

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
  statVal: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: COLORS.border },

  tipBox: {
    backgroundColor: COLORS.accentDark,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.accent,
    alignItems: 'center',
  },
  tipText: { color: COLORS.text, fontSize: 14, fontWeight: '500' },

  endBtn: {
    backgroundColor: COLORS.accentRed,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.accentRed,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  endBtnIcon: { fontSize: 28, marginBottom: 4 },
  endBtnText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  endBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },

  disclaimer: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },

  // No session
  noSessionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noSessionIcon: { fontSize: 60, marginBottom: 16 },
  noSessionTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700', marginBottom: 10 },
  noSessionDesc: {
    color: COLORS.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  scanBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  scanBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
