import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { bootstrapApp } from '@/app/bootstrap';
import { AppProviders } from '@/app/providers';
import { GameCanvas } from '@/presentation/game/GameCanvas';
import { useGameViewModel } from '@/presentation/game/useGameViewModel';
import { GameOverOverlay } from '@/presentation/ui/GameOverOverlay';
import { Hud } from '@/presentation/ui/Hud';
import { PauseOverlay } from '@/presentation/ui/PauseOverlay';
import { SensorCalibratingOverlay } from '@/presentation/ui/SensorCalibratingOverlay';
import { StartOverlay } from '@/presentation/ui/StartOverlay';
import { UnsupportedDeviceOverlay } from '@/presentation/ui/UnsupportedDeviceOverlay';

function RootApp() {
  const vm = useGameViewModel();

  useEffect(() => {
    bootstrapApp();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <GameCanvas frame={vm.frame} width={vm.width} height={vm.height} />

      <Hud score={vm.score} highScore={vm.highScore} />

      <View style={styles.topRight}>
        <Pressable style={styles.chip} onPress={vm.onToggleSound}>
          <Text style={styles.chipText}>{vm.soundEnabled ? 'Sound: On' : 'Sound: Off'}</Text>
        </Pressable>
        {vm.phase === 'RUNNING' ? (
          <Pressable style={styles.chip} onPress={vm.actions.pause}>
            <Text style={styles.chipText}>Pause</Text>
          </Pressable>
        ) : null}
      </View>

      {vm.phase === 'KIOSK' ? (
        <StartOverlay onStart={vm.actions.start} highScore={vm.highScore} />
      ) : null}
      {vm.phase === 'PAUSED' ? (
        <PauseOverlay onResume={vm.actions.resume} onBack={vm.actions.back} />
      ) : null}
      {vm.phase === 'GAME_OVER' ? (
        <GameOverOverlay score={vm.score} onRetry={vm.actions.retry} onBack={vm.actions.back} />
      ) : null}
      {vm.phase === 'RUNNING' && vm.motionAvailable && !vm.sensorReady ? (
        <SensorCalibratingOverlay />
      ) : null}
      {!vm.motionAvailable ? <UnsupportedDeviceOverlay /> : null}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AppProviders>
      <RootApp />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#78b7e2',
  },
  topRight: {
    position: 'absolute',
    top: 48,
    right: 20,
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipText: {
    color: '#fff',
    fontWeight: '700',
  },
});
