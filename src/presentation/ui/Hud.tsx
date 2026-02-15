import { StyleSheet, Text, View } from 'react-native';

interface Props {
  score: number;
  highScore: number;
}

export function Hud({ score, highScore }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.text}>Score: {score}</Text>
      <Text style={styles.text}>Best: {highScore}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 48,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});
