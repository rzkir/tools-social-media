/**
 * Shared Motion (motion/react) presets — viewport + once by default.
 */
import {
	animate,
	useInView,
	useMotionValue,
	useMotionValueEvent,
	useReducedMotion,
	type Transition,
	type Variants,
} from "motion/react";
import { useEffect, useRef, useState, type RefObject } from "react";

/** Material-ish ease — smooth, no overshoot. */
export const easeOut: [number, number, number, number] = [0.4, 0, 0.2, 1];

export const transitionSoft: Transition = {
	duration: 0.7,
	ease: easeOut,
};

export const transitionDraw: Transition = {
	duration: 1.4,
	ease: easeOut,
};

export const transitionBar: Transition = {
	duration: 0.9,
	ease: easeOut,
};

/** Fire animation once when element enters the viewport. */
export const viewportOnce = {
	once: true,
	amount: 0.35,
	margin: "0px 0px -8% 0px",
} as const;

export const fadeUp: Variants = {
	hidden: { opacity: 0, y: 8 },
	show: (delay = 0) => ({
		opacity: 1,
		y: 0,
		transition: { ...transitionSoft, delay },
	}),
};

export const fadeIn: Variants = {
	hidden: { opacity: 0 },
	show: (delay = 0) => ({
		opacity: 1,
		transition: { duration: 0.45, ease: easeOut, delay },
	}),
};

export const pathDraw: Variants = {
	hidden: { pathLength: 0, opacity: 0.2 },
	show: (delay = 0) => ({
		pathLength: 1,
		opacity: 1,
		transition: { ...transitionDraw, delay },
	}),
};

export const dotPulse = {
	initial: { opacity: 0, scale: 0.6 },
	show: {
		opacity: [0, 1, 0.45, 1],
		scale: [0.6, 1, 1.45, 1],
		transition: {
			duration: 2.6,
			ease: easeOut,
			repeat: Infinity,
			repeatType: "loop" as const,
			times: [0, 0.12, 0.55, 1],
			delay: 0.35,
		},
	},
};

/**
 * Standard props for variant-based enter animations (once + viewport).
 * Spread onto motion.* : `{...inViewProps(reduce)}`
 */
export function inViewProps(reduce?: boolean | null) {
	if (reduce) {
		return {
			initial: false as const,
			whileInView: "show" as const,
			viewport: viewportOnce,
		};
	}
	return {
		initial: "hidden" as const,
		whileInView: "show" as const,
		viewport: viewportOnce,
	};
}

/** Ref + once-in-view flag for imperative animations (numbers, etc.). */
export function useInViewOnce(amount = 0.35): {
	ref: RefObject<HTMLElement | null>;
	inView: boolean;
} {
	const ref = useRef<HTMLElement | null>(null);
	const inView = useInView(ref, { once: true, amount, margin: "0px 0px -8% 0px" });
	return { ref, inView };
}

/** Animate a numeric display value; pass `enabled` (e.g. inView) to start. */
export function useAnimatedNumber(
	target: number,
	duration = 0.9,
	enabled = true,
) {
	const reduce = useReducedMotion();
	const mv = useMotionValue(0);
	const [value, setValue] = useState(0);

	useMotionValueEvent(mv, "change", (v) => setValue(v));

	useEffect(() => {
		if (!enabled && !reduce) return;
		if (reduce) {
			mv.set(target);
			setValue(target);
			return;
		}
		const controls = animate(mv, target, {
			duration,
			ease: easeOut,
		});
		return () => controls.stop();
	}, [target, duration, mv, reduce, enabled]);

	return value;
}

export {
	animate,
	motion,
	useInView,
	useMotionValue,
	useReducedMotion,
} from "motion/react";
