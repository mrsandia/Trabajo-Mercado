import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER: 'fitcampus_user',
  POINTS: 'fitcampus_points',
  HISTORY: 'fitcampus_history',
  STEPS: 'fitcampus_steps',
  DAILY_GOAL: 'fitcampus_daily_goal',
};

export async function saveUser(user) {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export async function loadUser() {
  const data = await AsyncStorage.getItem(KEYS.USER);
  return data ? JSON.parse(data) : null;
}

export async function saveTotalPoints(points) {
  await AsyncStorage.setItem(KEYS.POINTS, String(points));
}

export async function loadTotalPoints() {
  const data = await AsyncStorage.getItem(KEYS.POINTS);
  return data ? parseInt(data, 10) : 0;
}

export async function saveHistory(history) {
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
}

export async function loadHistory() {
  const data = await AsyncStorage.getItem(KEYS.HISTORY);
  return data ? JSON.parse(data) : [];
}

export async function addHistoryEntry(entry) {
  const history = await loadHistory();
  const updated = [entry, ...history].slice(0, 50);
  await saveHistory(updated);
  return updated;
}

export async function saveDailySteps(dateKey, steps) {
  const raw = await AsyncStorage.getItem(KEYS.STEPS);
  const allSteps = raw ? JSON.parse(raw) : {};
  allSteps[dateKey] = steps;
  await AsyncStorage.setItem(KEYS.STEPS, JSON.stringify(allSteps));
}

export async function loadDailySteps(dateKey) {
  const raw = await AsyncStorage.getItem(KEYS.STEPS);
  const allSteps = raw ? JSON.parse(raw) : {};
  return allSteps[dateKey] || 0;
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
