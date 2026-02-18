import { Canvas, Circle, Group, RadialGradient, vec } from "@shopify/react-native-skia";
import React, { useCallback, useMemo, useRef } from "react";
import { type LayoutChangeEvent, PanResponder, StyleSheet, View } from "react-native";
import type { DotView, RenderFrame, ScreenSize } from "../domain/types";

interface GameCanvasProps {
	frame: RenderFrame;
	onLayout: (size: ScreenSize) => void;
	/** When set (e.g. __DEV__), drag gestures report (dx, dy) for player control */
	onDragDelta?: (dx: number, dy: number) => void;
}

const DOT_GLARE_INNER_OPACITY = 0.6;

const DotCircle: React.FC<{ dot: DotView }> = React.memo(({ dot }) => (
	<Group>
		<Circle cx={dot.x} cy={dot.y} r={dot.radius} color={dot.color} />
		<Circle cx={dot.x} cy={dot.y} r={dot.radius * 0.7} opacity={DOT_GLARE_INNER_OPACITY}>
			<RadialGradient
				c={vec(dot.x - dot.radius * 0.25, dot.y - dot.radius * 0.25)}
				r={dot.radius * 0.7}
				colors={["rgba(255,255,255,0.5)", "rgba(255,255,255,0)"]}
			/>
		</Circle>
	</Group>
));

/**
 * Skia-based game canvas that renders all dots from a RenderFrame.
 * Each dot is a Circle with a RadialGradient glare overlay.
 * Player dot is rendered last (on top).
 */
export const GameCanvas: React.FC<GameCanvasProps> = ({ frame, onLayout, onDragDelta }) => {
	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { width, height } = event.nativeEvent.layout;
			onLayout({ width, height });
		},
		[onLayout],
	);

	// Use touch position (not cumulative dx/dy) so deltas are correct and no jump-back on gesture resets
	const lastTouch = useRef<{ x: number; y: number } | null>(null);
	const panResponder = useMemo(
		() =>
			onDragDelta
				? PanResponder.create({
						onStartShouldSetPanResponder: () => true,
						onMoveShouldSetPanResponder: () => true,
						onPanResponderGrant: (evt) => {
							const { pageX, pageY } = evt.nativeEvent;
							lastTouch.current = { x: pageX, y: pageY };
						},
						onPanResponderMove: (evt) => {
							const { pageX, pageY } = evt.nativeEvent;
							const prev = lastTouch.current;
							if (prev === null) return;
							onDragDelta(pageX - prev.x, pageY - prev.y);
							lastTouch.current = { x: pageX, y: pageY };
						},
						onPanResponderRelease: () => {
							lastTouch.current = null;
						},
					})
				: null,
		[onDragDelta],
	);

	// Separate player from other dots so player renders on top
	const otherDots: DotView[] = [];
	let playerDot: DotView | null = null;

	for (const dot of frame.dots) {
		if (dot.kind === "player") {
			playerDot = dot;
		} else {
			otherDots.push(dot);
		}
	}

	// When using drag, Canvas must not capture touches so the container gets them
	const canvasPointerEvents = onDragDelta ? "none" : "auto";

	return (
		<View style={styles.container} onLayout={handleLayout} {...(panResponder?.panHandlers ?? {})}>
			<Canvas style={StyleSheet.absoluteFill} pointerEvents={canvasPointerEvents}>
				<Group>
					{otherDots.map((dot) => (
						<DotCircle key={dot.id} dot={dot} />
					))}
				</Group>
				{playerDot && (
					<Group>
						<DotCircle dot={playerDot} />
					</Group>
				)}
			</Canvas>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#78B7E3",
	},
});
