import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  onStart: () => void;
  highScore: number;
}

export function StartOverlay({ onStart, highScore }: Props) {
  return (
    <View style={styles.root} pointerEvents="box-none">
      <Image
        source={require('../../assets/images/united_colors_top_down.png')}
        style={styles.image}
      />
      <Text style={styles.title}>United Colors</Text>
      <Text style={styles.subtitle}>Best: {highScore}</Text>
      <Pressable style={styles.button} onPress={onStart}>
        <Text style={styles.buttonText}>Start</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  title: {
    fontSize: 32,
    color: 'white',
    fontWeight: '800',
  },
  image: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
  },
  button: {
    borderWidth: 1,
    borderColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
