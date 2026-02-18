import type React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface KioskOverlayProps {
	onStart: () => void;
}

export const KioskOverlay: React.FC<KioskOverlayProps> = ({ onStart }) => {
	return (
		<View style={styles.container}>
			<Image
				source={require("../../../assets/united_colors_logo.png")}
				style={styles.logo}
				resizeMode="contain"
				accessibilityLabel="United Colors"
			/>
			<View style={styles.buttonContainer}>
				<TouchableOpacity style={styles.button} onPress={onStart}>
					<Text style={styles.buttonText}>START</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
		alignItems: "center",
		paddingTop: 10,
	},
	logo: {
		width: "100%",
		paddingHorizontal: 20,
		height: 160,
	},
	buttonContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	button: {
		paddingVertical: 12,
		paddingHorizontal: 20,
		backgroundColor: "transparent",
	},
	buttonText: {
		fontSize: 16,
		color: "#fff",
	},
});
