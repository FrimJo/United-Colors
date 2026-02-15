import { StyleSheet, Text, View } from 'react-native';

export function SensorCalibratingOverlay() {
  return (
    <View style={styles.root}>
      <Text style={styles.text}>Calibrating gyro...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 92,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
