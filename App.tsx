import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { GameScreen } from "./src/presentation/GameScreen";

export default function App() {
	return (
		<SafeAreaProvider>
			<StatusBar style="light" hidden />
			<GameScreen />
		</SafeAreaProvider>
	);
}
