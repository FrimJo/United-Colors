import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  score: number;
  onRetry: () => void;
  onBack: () => void;
}

export function GameOverOverlay({ score, onRetry, onBack }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Game Over</Text>
      <Text style={styles.score}>Score: {score}</Text>
      <Pressable style={styles.button} onPress={onRetry}>
        <Text style={styles.text}>Retry</Text>
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
    gap: 10,
  },
  title: {
    color: 'white',
    fontWeight: '800',
    fontSize: 28,
  },
  score: {
    color: 'white',
    fontSize: 18,
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
