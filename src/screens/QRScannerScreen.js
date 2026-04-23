import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useApp } from '../context/AppContext';
import { COLORS } from '../utils/theme';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.65;

// Machines database (in production these would come from a server)
const MACHINES_DB = {
  'FC-TREADMILL-01': { id: 'FC-TREADMILL-01', name: 'Caminadora A1', type: 'treadmill', pointsPerSecond: 0.5, location: 'Gimnasio Principal - Piso 1' },
  'FC-TREADMILL-02': { id: 'FC-TREADMILL-02', name: 'Caminadora A2', type: 'treadmill', pointsPerSecond: 0.5, location: 'Gimnasio Principal - Piso 1' },
  'FC-BIKE-01':      { id: 'FC-BIKE-01',      name: 'Bicicleta Fija B1', type: 'bike', pointsPerSecond: 0.4, location: 'Gimnasio Principal - Piso 1' },
  'FC-BIKE-02':      { id: 'FC-BIKE-02',      name: 'Bicicleta Spinning B2', type: 'bike', pointsPerSecond: 0.6, location: 'Sala Spinning' },
  'FC-ELLIP-01':     { id: 'FC-ELLIP-01',     name: 'Elíptica E1', type: 'elliptical', pointsPerSecond: 0.45, location: 'Gimnasio Principal - Piso 2' },
  'FC-ROWING-01':    { id: 'FC-ROWING-01',    name: 'Remo R1', type: 'rowing', pointsPerSecond: 0.7, location: 'Gimnasio Principal - Piso 2' },
  'FC-WEIGHTS-01':   { id: 'FC-WEIGHTS-01',   name: 'Pesas Libres W1', type: 'weights', pointsPerSecond: 0.35, location: 'Sala de Pesas' },
};

const MACHINE_ICONS = {
  treadmill: '🏃',
  bike: '🚴',
  elliptical: '⚡',
  rowing: '🚣',
  weights: '🏋️',
};

function ScanFrame({ scanAnim }) {
  return (
    <View style={[styles.scanFrame, { width: SCAN_SIZE, height: SCAN_SIZE }]}>
      {/* Corners */}
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
      {/* Scan line */}
      <Animated.View
        style={[
          styles.scanLine,
          {
            transform: [
              {
                translateY: scanAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, SCAN_SIZE - 4],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

function MachinePreview({ machine, onConfirm, onCancel }) {
  const icon = MACHINE_ICONS[machine.type] || '💪';
  const ppm = Math.round(machine.pointsPerSecond * 60);

  return (
    <View style={styles.previewOverlay}>
      <View style={styles.previewCard}>
        <Text style={styles.previewIcon}>{icon}</Text>
        <Text style={styles.previewTitle}>{machine.name}</Text>
        <Text style={styles.previewLocation}>{machine.location}</Text>

        <View style={styles.previewStats}>
          <View style={styles.previewStat}>
            <Text style={styles.previewStatVal}>{ppm}</Text>
            <Text style={styles.previewStatLabel}>pts / min</Text>
          </View>
          <View style={styles.previewDivider} />
          <View style={styles.previewStat}>
            <Text style={styles.previewStatVal}>{machine.type}</Text>
            <Text style={styles.previewStatLabel}>tipo</Text>
          </View>
        </View>

        <Text style={styles.previewHint}>
          ¡La máquina detectará automáticamente cuando estés ejercitándote!
        </Text>

        <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
          <Text style={styles.confirmBtnText}>Iniciar sesión ⚡</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function QRScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [detectedMachine, setDetectedMachine] = useState(null);
  const { state, startSession } = useApp();
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  function handleBarCodeScanned({ data }) {
    if (scanned) return;
    setScanned(true);

    const machine = MACHINES_DB[data];
    if (machine) {
      setDetectedMachine(machine);
    } else {
      Alert.alert(
        'QR no reconocido',
        'Este código QR no corresponde a ninguna máquina de FitCampus.',
        [{ text: 'Intentar de nuevo', onPress: () => setScanned(false) }]
      );
    }
  }

  function handleConfirm() {
    if (state.activeSession) {
      Alert.alert(
        'Sesión activa',
        `Ya tienes una sesión activa en ${state.activeSession.machineName}. ¿Deseas terminarla y comenzar en esta máquina?`,
        [
          { text: 'Cancelar', onPress: () => { setScanned(false); setDetectedMachine(null); } },
          {
            text: 'Cambiar máquina',
            onPress: () => {
              startSession(detectedMachine);
              setDetectedMachine(null);
              navigation.navigate('Exercise');
            },
          },
        ]
      );
      return;
    }
    startSession(detectedMachine);
    setDetectedMachine(null);
    navigation.navigate('Exercise');
  }

  function handleCancel() {
    setScanned(false);
    setDetectedMachine(null);
  }

  // Demo mode: simulate scanning for testing
  function handleDemoScan() {
    const machines = Object.values(MACHINES_DB);
    const random = machines[Math.floor(Math.random() * machines.length)];
    setDetectedMachine(random);
    setScanned(true);
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.permText}>Cargando permisos de cámara...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permContainer}>
          <Text style={styles.permIcon}>📷</Text>
          <Text style={styles.permTitle}>Acceso a cámara requerido</Text>
          <Text style={styles.permDesc}>
            FitCampus necesita usar tu cámara para escanear los códigos QR de las máquinas de ejercicio.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Permitir acceso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.demoBtn} onPress={handleDemoScan}>
            <Text style={styles.demoBtnText}>Probar con demo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Dark overlay with cutout */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <ScanFrame scanAnim={scanAnim} />
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* UI on top */}
      <SafeAreaView style={styles.uiOverlay} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ Volver</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Escanear Máquina</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={styles.scanHint}>
          <Text style={styles.scanHintText}>
            Apunta la cámara al código QR de la máquina
          </Text>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.demoScanBtn} onPress={handleDemoScan}>
            <Text style={styles.demoScanText}>🎮 Modo demo (sin QR físico)</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {detectedMachine && (
        <MachinePreview
          machine={detectedMachine}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </View>
  );
}

const OVERLAY_COLOR = 'rgba(13,27,42,0.82)';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#000' },

  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayMiddle: { flexDirection: 'row', height: SCAN_SIZE },
  overlaySide: { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayBottom: { flex: 1, backgroundColor: OVERLAY_COLOR },

  uiOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: { padding: 8 },
  backBtnText: { color: COLORS.text, fontSize: 17 },
  topBarTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700' },

  scanFrame: {
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.accent,
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  scanHint: {
    alignItems: 'center',
    marginTop: SCAN_SIZE / 2 + 30,
  },
  scanHintText: {
    color: COLORS.text,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(13,27,42,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },

  bottomBar: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  demoScanBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  demoScanText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },

  // Permission screen
  permContainer: { alignItems: 'center', padding: 40 },
  permIcon: { fontSize: 60, marginBottom: 20 },
  permTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  permDesc: { color: COLORS.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  permBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginBottom: 12,
  },
  permBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  permText: { color: COLORS.text },
  demoBtn: {
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  demoBtnText: { color: COLORS.textMuted, fontSize: 15 },

  // Preview overlay
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  previewCard: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  previewIcon: { fontSize: 52, marginBottom: 8 },
  previewTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  previewLocation: { color: COLORS.textMuted, fontSize: 13, marginBottom: 20 },
  previewStats: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  previewStat: { alignItems: 'center', paddingHorizontal: 24 },
  previewStatVal: { color: COLORS.accent, fontSize: 20, fontWeight: '700' },
  previewStatLabel: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  previewDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  previewHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  confirmBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmBtnText: { color: '#000', fontSize: 17, fontWeight: '700' },
  cancelBtn: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  cancelBtnText: { color: COLORS.textMuted, fontSize: 15 },
});
