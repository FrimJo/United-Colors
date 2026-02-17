import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PauseOverlayProps {
	onResume: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({ onResume }) => {
	return (
		<View style={styles.container}>
			<TouchableOpacity style={styles.button} onPress={onResume}>
				<Text style={styles.buttonText}>RESUME</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	button: {
		paddingHorizontal: 40,
		paddingVertical: 16,
		backgroundColor: "#2196F3",
		borderRadius: 8,
	},
	buttonText: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#fff",
	},
});
