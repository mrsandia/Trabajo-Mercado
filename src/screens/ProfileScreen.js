import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { COLORS } from '../utils/theme';

const LEVEL_NAMES = ['Principiante', 'Activo', 'Atleta', 'Campeón', 'Élite', 'Leyenda'];
const LEVEL_COLORS = ['#7A94B0', '#00D4AA', '#4CAF50', '#FF9800', '#F44336', '#9C27B0'];

const REWARDS = [
  { id: 1, icon: '☕', name: 'Café gratis', cost: 200, desc: 'Válido en cafetería universitaria' },
  { id: 2, icon: '🍕', name: 'Pizza universitaria', cost: 300, desc: 'Slice en el comedor estudiantil' },
  { id: 3, icon: '👕', name: 'Playera FitCampus', cost: 500, desc: 'Playera oficial del programa' },
  { id: 4, icon: '🎟️', name: 'Entrada al cine', cost: 800, desc: 'Para Cineteca o Cinépolis Campus' },
  { id: 5, icon: '📚', name: 'Libro de texto', cost: 1000, desc: 'De la librería universitaria' },
  { id: 6, icon: '🎮', name: 'Acceso sala de gaming', cost: 400, desc: 'Un día en la sala de recreación' },
];

const MACHINE_ICONS = {
  treadmill: '🏃', bike: '🚴', elliptical: '⚡', rowing: '🚣', weights: '🏋️', default: '💪',
};

function StatCard({ icon, value, label }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RewardCard({ reward, points, onRedeem }) {
  const unlocked = points >= reward.cost;
  return (
    <View style={[styles.rewardCard, unlocked && styles.rewardUnlocked]}>
      <Text style={styles.rewardIcon}>{reward.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.rewardName}>{reward.name}</Text>
        <Text style={styles.rewardDesc}>{reward.desc}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.rewardCost, unlocked && { color: COLORS.accent }]}>
          {reward.cost} pts
        </Text>
        {unlocked && (
          <TouchableOpacity style={styles.redeemBtn} onPress={() => onRedeem(reward)}>
            <Text style={styles.redeemBtnText}>Canjear</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function HistoryItem({ item }) {
  const date = new Date(item.date);
  const icon = MACHINE_ICONS[item.machineType] || MACHINE_ICONS.default;
  const mins = Math.floor(item.duration / 60);
  return (
    <View style={styles.historyItem}>
      <Text style={styles.historyIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyName}>{item.machineName}</Text>
        <Text style={styles.historyDate}>
          {date.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })}
          {mins > 0 && ` · ${mins} min`}
        </Text>
      </View>
      <Text style={styles.historyPoints}>+{item.points}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { state, updateUser } = useApp();
  const { user, totalPoints, history } = state;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    university: user.university,
    career: user.career,
  });

  const levelIdx = Math.min(user.level - 1, LEVEL_NAMES.length - 1);
  const levelName = LEVEL_NAMES[levelIdx];
  const levelColor = LEVEL_COLORS[levelIdx];
  const pointsForNext = user.level * 500;
  const pointsInLevel = totalPoints - (user.level - 1) * 500;
  const levelProgress = Math.min(pointsInLevel / 500, 1);

  const totalSessions = history.length;
  const totalTime = history.reduce((acc, h) => acc + (h.duration || 0), 0);
  const totalMins = Math.round(totalTime / 60);

  async function handleSave() {
    await updateUser(form);
    setEditing(false);
  }

  function handleRedeem(reward) {
    Alert.alert(
      `Canjear: ${reward.name}`,
      `¿Deseas canjear "${reward.name}" por ${reward.cost} puntos?\n\nSe generará un código único para reclamar tu recompensa.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar canje',
          onPress: () => {
            const code = `FC-${Date.now().toString(36).toUpperCase()}`;
            Alert.alert(
              '¡Recompensa canjeada! 🎉',
              `Tu código de canje es:\n\n${code}\n\nPresentalo en el lugar indicado para reclamar tu recompensa.`,
              [{ text: 'Entendido' }]
            );
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { borderColor: levelColor }]}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Nombre"
                placeholderTextColor={COLORS.textMuted}
              />
              <TextInput
                style={styles.input}
                value={form.university}
                onChangeText={(v) => setForm((f) => ({ ...f, university: v }))}
                placeholder="Universidad"
                placeholderTextColor={COLORS.textMuted}
              />
              <TextInput
                style={styles.input}
                value={form.career}
                onChangeText={(v) => setForm((f) => ({ ...f, career: v }))}
                placeholder="Carrera"
                placeholderTextColor={COLORS.textMuted}
              />
              <View style={styles.editBtns}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileUniversity}>{user.university}</Text>
              <Text style={styles.profileCareer}>{user.career}</Text>
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                <Text style={styles.editBtnText}>✏️ Editar perfil</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Level card */}
        <View style={[styles.levelCard, { borderColor: levelColor }]}>
          <View style={styles.levelRow}>
            <Text style={styles.levelLabel}>NIVEL</Text>
            <View style={[styles.levelBadge, { backgroundColor: levelColor + '30', borderColor: levelColor }]}>
              <Text style={[styles.levelBadgeText, { color: levelColor }]}>
                {user.level} · {levelName}
              </Text>
            </View>
          </View>
          <View style={styles.levelProgress}>
            <View style={[styles.levelFill, { width: `${levelProgress * 100}%`, backgroundColor: levelColor }]} />
          </View>
          <Text style={styles.levelHint}>
            {totalPoints} / {pointsForNext} pts · {Math.max(0, pointsForNext - totalPoints)} para subir de nivel
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="⭐" value={totalPoints} label="Puntos totales" />
          <StatCard icon="🏋️" value={totalSessions} label="Sesiones" />
          <StatCard icon="⏱" value={`${totalMins}m`} label="Tiempo activo" />
        </View>

        {/* Rewards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recompensas</Text>
          <Text style={styles.sectionSub}>Tienes {totalPoints} puntos disponibles</Text>
          {REWARDS.map((r) => (
            <RewardCard key={r.id} reward={r} points={totalPoints} onRedeem={handleRedeem} />
          ))}
        </View>

        {/* Full history */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial completo</Text>
          {history.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No hay sesiones registradas aún.</Text>
            </View>
          ) : (
            history.map((item) => <HistoryItem key={item.id} item={item} />)
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1, paddingHorizontal: 20 },

  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
  },
  avatarText: { fontSize: 40, fontWeight: '700', color: COLORS.text },
  profileInfo: { alignItems: 'center' },
  profileName: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  profileUniversity: { color: COLORS.accent, fontSize: 14, marginBottom: 2 },
  profileCareer: { color: COLORS.textMuted, fontSize: 13, marginBottom: 12 },
  editBtn: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editBtnText: { color: COLORS.textMuted, fontSize: 13 },

  editForm: { width: '100%', gap: 10 },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editBtns: { flexDirection: 'row', gap: 10 },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: { color: COLORS.textMuted, fontSize: 15 },

  levelCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  levelLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  levelBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
  },
  levelBadgeText: { fontSize: 13, fontWeight: '700' },
  levelProgress: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  levelFill: { height: '100%', borderRadius: 3 },
  levelHint: { color: COLORS.textMuted, fontSize: 12 },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' },

  section: { marginBottom: 24 },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  sectionSub: { color: COLORS.textMuted, fontSize: 12, marginBottom: 12 },

  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  rewardUnlocked: { borderColor: COLORS.accent + '60' },
  rewardIcon: { fontSize: 30 },
  rewardName: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  rewardDesc: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  rewardCost: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  redeemBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
  },
  redeemBtnText: { color: '#000', fontSize: 11, fontWeight: '700' },

  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  historyIcon: { fontSize: 24 },
  historyName: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  historyDate: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  historyPoints: { color: COLORS.accent, fontSize: 15, fontWeight: '700' },

  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },
});
