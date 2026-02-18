import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

const isDev = typeof __DEV__ !== "undefined" && __DEV__;

/** Dev only: 'gyro' | 'touch' | 'pending' (waiting for first gyro sample or timeout) */
type DevControlMode = "gyro" | "touch" | "pending";

const GYRO_DETECT_MS = 800;

export const GameScreen: React.FC = () => {
	const frame = useStore(store, (s) => s.frame);
	const soundEnabled = useStore(store, (s) => s.settings.soundEnabled);
	const engineRef = useRef<GameEngine | null>(null);
	const clockRef = useRef<FrameClock | null>(null);
	const [screenReady, setScreenReady] = useState(false);
	const screenRef = useRef<ScreenSize>(DEFAULT_SCREEN);

	// Dev only: prefer gyro, fallback to touch when gyro not available (e.g. simulator)
	const [devControlMode, setDevControlMode] = useState<DevControlMode>("pending");
	const useTouchInputRef = useRef(false);
	const devGyroTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const setDevControlModeRef = useRef(setDevControlMode);
	setDevControlModeRef.current = setDevControlMode;

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

	// Keep useTouchInputRef in sync so sensor callback can skip feeding when touch is active
	useEffect(() => {
		useTouchInputRef.current = isDev && devControlMode === "touch";
	}, [devControlMode]);

	// Sync store sound setting to audio service
	useEffect(() => {
		audio.setEnabled(soundEnabled);
	}, [soundEnabled]);

	// Setup sensor and audio (await preload so sounds are ready before game starts)
	useEffect(() => {
		let cancelled = false;
		(async () => {
			await audio.preload(
				require("../../assets/sounds/blop.ogg"),
				require("../../assets/sounds/jump.ogg"),
			);
			if (cancelled) return;
			sensor.onSample((sample) => {
				if (isDev && useTouchInputRef.current) return;
				// Dev: first gyro sample → prefer gyro, cancel touch fallback
				if (isDev) {
					setDevControlModeRef.current((prev) => {
						if (prev !== "pending") return prev;
						if (devGyroTimeoutRef.current) {
							clearTimeout(devGyroTimeoutRef.current);
							devGyroTimeoutRef.current = null;
						}
						return "gyro";
					});
				}
				engineRef.current?.onSensorInput(sample.x, sample.y);
			});
		})();
		return () => {
			cancelled = true;
			if (devGyroTimeoutRef.current) clearTimeout(devGyroTimeoutRef.current);
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
		if (isDev) {
			setDevControlMode("pending");
			if (devGyroTimeoutRef.current) clearTimeout(devGyroTimeoutRef.current);
			devGyroTimeoutRef.current = setTimeout(() => {
				devGyroTimeoutRef.current = null;
				setDevControlMode((prev) => (prev === "pending" ? "touch" : prev));
			}, GYRO_DETECT_MS);
		}
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
			<SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
				<GameCanvas
					frame={frame}
					onLayout={handleLayout}
					onDragDelta={
						isDev && devControlMode === "touch"
							? (dx, dy) => {
									const engine = engineRef.current;
									if (engine) {
										engine.onMovementDelta(dx, dy);
										store.getState().updateFrame(engine.getFrame());
									}
								}
							: undefined
					}
				/>

				{isDev && (
					<View style={styles.devBadge} pointerEvents="none">
						<Text style={styles.devBadgeText}>
							Control:{" "}
							{devControlMode === "pending"
								? frame.phase === "RUNNING"
									? "Checking…"
									: "—"
								: devControlMode === "gyro"
									? "Gyro"
									: "Touch"}
						</Text>
					</View>
				)}

				{frame.phase === "RUNNING" && <HUD score={frame.score} onPause={handlePause} />}

				{frame.phase === "KIOSK" && <KioskOverlay onStart={handleStart} />}

				{frame.phase === "PAUSED" && <PauseOverlay onResume={handleResume} />}

				{frame.phase === "GAME_OVER" && (
					<GameOverOverlay score={frame.score} onRetry={handleRetry} onBack={handleBack} />
				)}
			</SafeAreaView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#78B7E3",
	},
	safeArea: {
		flex: 1,
	},
	devBadge: {
		position: "absolute",
		bottom: 12,
		left: 12,
		backgroundColor: "rgba(0,0,0,0.7)",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
	},
	devBadgeText: {
		color: "#8BC34A",
		fontSize: 12,
	},
});
