// Escanea un QR (cualquier formato) y devuelve su contenido vía onScanned.
// Usa expo-camera (Expo SDK 54+). Pedir permiso de cámara la primera vez.
import React, { useState, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const QRScannerModal = ({ visible, onClose, onScanned }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const lockRef = useRef(false); // evita dobles disparos en el mismo frame

  const handleScan = ({ data }) => {
    if (lockRef.current || scanned) return;
    lockRef.current = true;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    // delay corto para que el usuario vea el flash verde antes de cerrar
    setTimeout(() => {
      onScanned?.(String(data).trim().toUpperCase());
      // reset para la próxima apertura
      setScanned(false);
      lockRef.current = false;
    }, 250);
  };

  const handleClose = () => {
    setScanned(false);
    lockRef.current = false;
    onClose?.();
  };

  // ── Permiso aún no determinado
  if (!permission) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <View style={styles.center}><ActivityIndicator color="#4ade80" /></View>
      </Modal>
    );
  }

  // ── Permiso denegado
  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <View style={styles.backdrop}>
          <View style={styles.permCard}>
            <Ionicons name="camera-outline" size={48} color="#4ade80" />
            <Text style={styles.permTitle}>Permiso de cámara</Text>
            <Text style={styles.permText}>
              Necesitamos acceso a la cámara para escanear el código QR de tu sensor IoT.
            </Text>
            <View style={styles.permRow}>
              <TouchableOpacity onPress={handleClose} style={[styles.btn, styles.btnGhost]}>
                <Text style={styles.btnGhostText}>Ahora no</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  const res = await requestPermission();
                  if (!res.granted && res.canAskAgain === false) {
                    Linking.openSettings();
                  }
                }}
                style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnPrimaryText}>Permitir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Permiso concedido → cámara
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.fullScreen}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleScan}
        />

        {/* Overlay con marco */}
        <View style={styles.overlay} pointerEvents="none">
          <View style={[styles.frame, scanned && { borderColor: '#22C55E' }]} />
          <Text style={styles.hint}>
            {scanned ? '✓ CÓDIGO DETECTADO' : 'Apunta la cámara al QR del sensor'}
          </Text>
        </View>

        {/* Botón cerrar */}
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)' },
  backdrop:   { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)', padding: 24 },
  permCard:   {
    backgroundColor: '#0f172a', borderRadius: 18, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)', maxWidth: 340, width: '100%', gap: 12,
  },
  permTitle:  { color: '#fff', fontSize: 17, fontWeight: '700', marginTop: 4 },
  permText:   { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  permRow:    { flexDirection: 'row', gap: 10, marginTop: 12, width: '100%' },
  btn:        { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnGhost:   { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  btnGhostText: { color: '#cbd5e1', fontWeight: '600' },
  btnPrimary: { backgroundColor: '#4ade80' },
  btnPrimaryText: { color: '#030712', fontWeight: '700' },

  fullScreen: { flex: 1, backgroundColor: '#000' },
  overlay:    { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame:      {
    width: 250, height: 250, borderWidth: 3, borderColor: '#4ade80', borderRadius: 16,
    shadowColor: '#4ade80', shadowOpacity: 0.6, shadowRadius: 12,
  },
  hint:       {
    color: '#fff', marginTop: 24, fontSize: 14, fontWeight: '600', letterSpacing: 0.5,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  closeBtn:   {
    position: 'absolute', top: 50, right: 20,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
});

export default QRScannerModal;
