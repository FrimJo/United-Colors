import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface KioskOverlayProps {
	onStart: () => void;
}

export const KioskOverlay: React.FC<KioskOverlayProps> = ({ onStart }) => {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>United Colors</Text>
			<TouchableOpacity style={styles.button} onPress={onStart}>
				<Text style={styles.buttonText}>START</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		fontSize: 36,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 40,
	},
	button: {
		paddingHorizontal: 40,
		paddingVertical: 16,
		backgroundColor: "#E91E63",
		borderRadius: 8,
	},
	buttonText: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#fff",
	},
});
