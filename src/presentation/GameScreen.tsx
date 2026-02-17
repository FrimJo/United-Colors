import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useStore } from "zustand";
import { createGameStore } from "../application/GameStore";
import { handleGameOver } from "../application/useCases/GameOver";
import { pauseGame } from "../application/useCases/PauseGame";
import { resumeGame } from "../application/useCases/ResumeGame";
import { startGame } from "../application/useCases/StartGame";
import { GameEngine } from "../domain/engine/GameEngine";
import type { ScreenSize } from "../domain/types";
import { AsyncStorageRepository } from "../infrastructure/AsyncStorageRepository";
import { AudioService } from "../infrastructure/AudioService";
import { DeviceMotionAdapter } from "../infrastructure/DeviceMotionAdapter";
import { FrameClock } from "../infrastructure/FrameClock";
import { GameCanvas } from "./GameCanvas";
import { HUD } from "./components/HUD";
import { GameOverOverlay } from "./overlays/GameOverOverlay";
import { KioskOverlay } from "./overlays/KioskOverlay";
import { PauseOverlay } from "./overlays/PauseOverlay";

const DEFAULT_SCREEN: ScreenSize = { width: 400, height: 800 };
const DEFAULT_DENSITY = 400;

const store = createGameStore();
const storage = new AsyncStorageRepository();
const sensor = new DeviceMotionAdapter();
const audio = new AudioService();

export const GameScreen: React.FC = () => {
	const frame = useStore(store, (s) => s.frame);
	const engineRef = useRef<GameEngine | null>(null);
	const clockRef = useRef<FrameClock | null>(null);
	const [screenReady, setScreenReady] = useState(false);
	const screenRef = useRef<ScreenSize>(DEFAULT_SCREEN);

	const getEngine = useCallback((): GameEngine => {
		if (!engineRef.current) {
			engineRef.current = new GameEngine({
				density: DEFAULT_DENSITY,
				screen: screenRef.current,
				audio,
			});
		}
		return engineRef.current;
	}, []);

	const startClock = useCallback(() => {
		if (clockRef.current) clockRef.current.stop();
		const engine = getEngine();
		clockRef.current = new FrameClock(() => {
			engine.tick();
			store.getState().updateFrame(engine.getFrame());
		});
		clockRef.current.start();
	}, [getEngine]);

	const stopClock = useCallback(() => {
		clockRef.current?.stop();
	}, []);

	// Setup sensor and audio
	useEffect(() => {
		sensor.onSample((sample) => {
			engineRef.current?.onSensorInput(sample.x, sample.y);
		});

		audio.preload(require("../../assets/sounds/blop.ogg"), require("../../assets/sounds/jump.ogg"));

		return () => {
			sensor.stop();
			clockRef.current?.stop();
			audio.unload();
		};
	}, []);

	// Start kiosk on mount
	useEffect(() => {
		if (screenReady) {
			const engine = getEngine();
			engine.startKiosk();
			store.getState().updateFrame(engine.getFrame());
			startClock();
		}
	}, [screenReady, getEngine, startClock]);

	// Watch for game over
	useEffect(() => {
		if (frame.phase === "GAME_OVER") {
			stopClock();
			sensor.stop();
			handleGameOver(getEngine(), store, storage);
		}
	}, [frame.phase, getEngine, stopClock]);

	const handleLayout = useCallback(
		(size: ScreenSize) => {
			screenRef.current = size;
			engineRef.current?.setScreen(size);
			if (!screenReady) setScreenReady(true);
		},
		[screenReady],
	);

	const handleStart = useCallback(() => {
		const engine = getEngine();
		startGame(engine, store);
		sensor.start();
		startClock();
	}, [getEngine, startClock]);

	const handlePause = useCallback(() => {
		stopClock();
		sensor.stop();
		pauseGame(getEngine(), store);
	}, [getEngine, stopClock]);

	const handleResume = useCallback(() => {
		resumeGame(getEngine(), store);
		sensor.start();
		startClock();
	}, [getEngine, startClock]);

	const handleRetry = useCallback(() => {
		handleStart();
	}, [handleStart]);

	const handleBack = useCallback(() => {
		const engine = getEngine();
		engine.startKiosk();
		store.getState().updateFrame(engine.getFrame());
		startClock();
	}, [getEngine, startClock]);

	return (
		<View style={styles.container}>
			<GameCanvas frame={frame} onLayout={handleLayout} />

			{frame.phase === "RUNNING" && <HUD score={frame.score} onPause={handlePause} />}

			{frame.phase === "KIOSK" && <KioskOverlay onStart={handleStart} />}

			{frame.phase === "PAUSED" && <PauseOverlay onResume={handleResume} />}

			{frame.phase === "GAME_OVER" && (
				<GameOverOverlay score={frame.score} onRetry={handleRetry} onBack={handleBack} />
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#000",
	},
});
