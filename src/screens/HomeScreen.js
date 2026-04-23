import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { COLORS, FONTS } from '../utils/theme';

const LEVEL_NAMES = [
  'Principiante',
  'Activo',
  'Atleta',
  'Campeón',
  'Élite',
  'Leyenda',
];

const MACHINE_ICONS = {
  treadmill: '🏃',
  bike: '🚴',
  elliptical: '⚡',
  rowing: '🚣',
  weights: '🏋️',
  default: '💪',
};

function PointsRing({ points, level }) {
  const pointsForNext = level * 500;
  const pointsInLevel = points - (level - 1) * 500;
  const progress = Math.min(pointsInLevel / 500, 1);

  return (
    <View style={styles.ringContainer}>
      <View style={styles.ringOuter}>
        <View style={styles.ringInner}>
          <Text style={styles.ringPoints}>{points}</Text>
          <Text style={styles.ringLabel}>puntos</Text>
        </View>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.levelText}>
        Nivel {level} · {LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)]}
      </Text>
      <Text style={styles.nextLevelText}>
        {Math.max(0, pointsForNext - points)} pts para nivel {level + 1}
      </Text>
    </View>
  );
}

function SessionBanner({ session, sessionPoints, onGoToExercise }) {
  if (!session) return null;
  return (
    <TouchableOpacity style={styles.activeBanner} onPress={onGoToExercise}>
      <Text style={styles.bannerIcon}>⚡</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerTitle}>Sesión activa: {session.machineName}</Text>
        <Text style={styles.bannerSub}>{Math.round(sessionPoints)} pts acumulados</Text>
      </View>
      <Text style={styles.bannerArrow}>›</Text>
    </TouchableOpacity>
  );
}

function HistoryItem({ item }) {
  const date = new Date(item.date);
  const icon = MACHINE_ICONS[item.machineType] || MACHINE_ICONS.default;
  const mins = Math.floor(item.duration / 60);
  const secs = item.duration % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <View style={styles.historyItem}>
      <Text style={styles.historyIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyName}>{item.machineName}</Text>
        <Text style={styles.historyDate}>
          {date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} · {timeStr}
        </Text>
      </View>
      <Text style={styles.historyPoints}>+{item.points} pts</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { state } = useApp();
  const { user, totalPoints, history, activeSession, sessionPoints } = state;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {user.name.split(' ')[0]} 👋</Text>
            <Text style={styles.university}>{user.university}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active session banner */}
        <SessionBanner
          session={activeSession}
          sessionPoints={sessionPoints}
          onGoToExercise={() => navigation.navigate('Exercise')}
        />

        {/* Points ring */}
        <PointsRing points={totalPoints} level={user.level} />

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Scanner')}
          >
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionLabel}>Escanear{'\n'}Máquina</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Steps')}
          >
            <Text style={styles.actionIcon}>👟</Text>
            <Text style={styles.actionLabel}>Contador{'\n'}de Pasos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.actionIcon}>🏆</Text>
            <Text style={styles.actionLabel}>Mis{'\n'}Logros</Text>
          </TouchableOpacity>
        </View>

        {/* Rewards preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recompensas disponibles</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {REWARDS.map((r) => (
              <View
                key={r.id}
                style={[styles.rewardCard, totalPoints >= r.cost && styles.rewardUnlocked]}
              >
                <Text style={styles.rewardIcon}>{r.icon}</Text>
                <Text style={styles.rewardName}>{r.name}</Text>
                <Text style={styles.rewardCost}>{r.cost} pts</Text>
                {totalPoints >= r.cost && (
                  <View style={styles.rewardBadge}>
                    <Text style={styles.rewardBadgeText}>¡Disponible!</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad reciente</Text>
          {history.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🏋️</Text>
              <Text style={styles.emptyText}>
                Escanea una máquina para comenzar tu primera sesión
              </Text>
            </View>
          ) : (
            history.slice(0, 5).map((item) => (
              <HistoryItem key={item.id} item={item} />
            ))
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const REWARDS = [
  { id: 1, icon: '☕', name: 'Café gratis', cost: 200 },
  { id: 2, icon: '👕', name: 'Playera FitCampus', cost: 500 },
  { id: 3, icon: '🎟️', name: 'Entrada al cine', cost: 800 },
  { id: 4, icon: '🍕', name: 'Pizza universitaria', cost: 300 },
  { id: 5, icon: '📚', name: 'Libro de texto', cost: 1000 },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1, paddingHorizontal: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  university: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },

  activeBanner: {
    backgroundColor: COLORS.accentDark,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  bannerIcon: { fontSize: 22, marginRight: 10 },
  bannerTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  bannerSub: { color: COLORS.accent, fontSize: 12, marginTop: 2 },
  bannerArrow: { color: COLORS.accent, fontSize: 24, fontWeight: '300' },

  ringContainer: { alignItems: 'center', marginVertical: 20 },
  ringOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  ringInner: { alignItems: 'center' },
  ringPoints: { fontSize: 36, fontWeight: '900', color: COLORS.text },
  ringLabel: { fontSize: 13, color: COLORS.textMuted, marginTop: -4 },
  progressBarBg: {
    width: 200,
    height: 6,
    backgroundColor: COLORS.card,
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 3 },
  levelText: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginTop: 8 },
  nextLevelText: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: { color: COLORS.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },

  section: { marginBottom: 24 },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },

  rewardCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 110,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rewardUnlocked: { borderColor: COLORS.accent },
  rewardIcon: { fontSize: 30, marginBottom: 8 },
  rewardName: { color: COLORS.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  rewardCost: { color: COLORS.accent, fontSize: 12, marginTop: 4 },
  rewardBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
  },
  rewardBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyIcon: { fontSize: 24, marginRight: 12 },
  historyName: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  historyDate: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  historyPoints: { color: COLORS.accent, fontSize: 15, fontWeight: '700' },

  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', fontSize: 13, lineHeight: 20 },
});
