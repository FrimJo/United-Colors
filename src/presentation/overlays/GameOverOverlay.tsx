import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GameOverOverlayProps {
	score: number;
	onRetry: () => void;
	onBack: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({ score, onRetry, onBack }) => {
	return (
		<View style={styles.container}>
			<Text style={styles.scoreLabel}>Score: {score}</Text>
			<TouchableOpacity style={styles.retryButton} onPress={onRetry}>
				<Text style={styles.buttonText}>RETRY</Text>
			</TouchableOpacity>
			<TouchableOpacity style={styles.backButton} onPress={onBack}>
				<Text style={styles.buttonText}>MENU</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.7)",
	},
	scoreLabel: {
		fontSize: 32,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 30,
	},
	retryButton: {
		paddingHorizontal: 40,
		paddingVertical: 16,
		backgroundColor: "#E91E63",
		borderRadius: 8,
		marginBottom: 16,
	},
	backButton: {
		paddingHorizontal: 40,
		paddingVertical: 16,
		backgroundColor: "#666",
		borderRadius: 8,
	},
	buttonText: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#fff",
	},
});
