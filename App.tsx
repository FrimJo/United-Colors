import { StatusBar } from "expo-status-bar";
import { GameScreen } from "./src/presentation/GameScreen";

export default function App() {
	return (
		<>
			<StatusBar style="light" hidden />
			<GameScreen />
		</>
	);
}
