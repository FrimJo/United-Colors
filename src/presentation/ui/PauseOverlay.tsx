import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  onResume: () => void;
  onBack: () => void;
}

export function PauseOverlay({ onResume, onBack }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Paused</Text>
      <Pressable style={styles.button} onPress={onResume}>
        <Text style={styles.text}>Resume</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={onBack}>
        <Text style={styles.text}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    gap: 10,
  },
  title: {
    color: 'white',
    fontWeight: '800',
    fontSize: 28,
  },
  button: {
    borderWidth: 1,
    borderColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
  },
  text: {
    color: 'white',
    fontWeight: '700',
  },
});
