import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HUDProps {
	score: number;
	onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({ score, onPause }) => {
	return (
		<View style={styles.container} pointerEvents="box-none">
			<View style={styles.topRow}>
				<Text style={styles.score}>{score}</Text>
				<TouchableOpacity style={styles.pauseButton} onPress={onPause}>
					<Text style={styles.pauseText}>| |</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
	},
	topRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingTop: 60,
		paddingHorizontal: 24,
	},
	score: {
		fontSize: 48,
		fontWeight: "bold",
		color: "#fff",
	},
	pauseButton: {
		padding: 12,
	},
	pauseText: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#fff",
	},
});
