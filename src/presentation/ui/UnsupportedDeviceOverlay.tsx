import { StyleSheet, Text, View } from 'react-native';

export function UnsupportedDeviceOverlay() {
  return (
    <View style={styles.root}>
      <Text style={styles.text}>Gyroscope/device motion unavailable.</Text>
      <Text style={styles.text}>This build currently requires gyro controls.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
});
