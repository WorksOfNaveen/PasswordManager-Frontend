import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';

/** Upper bound (exclusive) for "Weak"; below "Strong" threshold is "Medium". */
const STRENGTH_WEAK_BELOW = 0.34;
const STRENGTH_MEDIUM_BELOW = 0.67;

export type ProgressBarProps = {
  /** 0–1 for determinate fill; ignored when indeterminate */
  progress?: number;
  /** Force indeterminate animation (e.g. fetch with unknown duration) */
  indeterminate?: boolean;
  /** Hide entirely when false (default true) */
  visible?: boolean;
  height?: number;
  trackColor?: string;
  fillColor?: string;
  borderRadius?: number;
  style?: ViewStyle;
  trackStyle?: ViewStyle;
  fillStyle?: ViewStyle;
  testID?: string;
  /** Show Weak / Medium / Strong from determinate progress (hidden when empty). */
  showStrengthLabel?: boolean;
  /** When progress is 0, optional hint (e.g. "Password strength"); omit row if ''. */
  strengthLabelEmpty?: string;
  /** Label above or below the track. */
  strengthLabelPosition?: 'above' | 'below';
  labelStyle?: TextStyle;
};

const DEFAULT_TRACK = '#2a2a2f';
const DEFAULT_FILL = '#0a84ff';
const DEFAULT_HEIGHT = 4;
const INDETERMINATE_SEGMENT_RATIO = 0.4;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function useIsIndeterminate({
  indeterminate,
  progress,
}: Pick<ProgressBarProps, 'indeterminate' | 'progress'>): boolean {
  return indeterminate === true || typeof progress !== 'number';
}

export function strengthTierLabel(
  progress01: number,
): 'Weak' | 'Medium' | 'Strong' {
  const p = clamp01(progress01);
  if (p < STRENGTH_WEAK_BELOW) {
    return 'Weak';
  }
  if (p < STRENGTH_MEDIUM_BELOW) {
    return 'Medium';
  }
  return 'Strong';
}

export function ProgressBar({
  progress,
  indeterminate,
  visible = true,
  height = DEFAULT_HEIGHT,
  trackColor = DEFAULT_TRACK,
  fillColor = DEFAULT_FILL,
  borderRadius,
  style,
  trackStyle,
  fillStyle,
  testID,
  showStrengthLabel = false,
  strengthLabelEmpty = '',
  strengthLabelPosition = 'above',
  labelStyle,
}: ProgressBarProps) {
  const isIndeterminate = useIsIndeterminate({indeterminate, progress});
  const radius = borderRadius ?? height / 2;
  const slide = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  const clampedProgress = useMemo(
    () =>
      typeof progress === 'number' && !Number.isNaN(progress)
        ? clamp01(progress)
        : 0,
    [progress],
  );

  useEffect(() => {
    if (!visible || !isIndeterminate || trackWidth <= 0) {
      loopRef.current?.stop();
      loopRef.current = null;
      slide.setValue(0);
      return;
    }

    const segment = trackWidth * INDETERMINATE_SEGMENT_RATIO;
    slide.setValue(-segment);

    loopRef.current?.stop();
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(slide, {
          toValue: trackWidth,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: -segment,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loopRef.current = anim;
    anim.start();

    return () => {
      anim.stop();
      loopRef.current = null;
    };
  }, [visible, isIndeterminate, trackWidth, slide]);

  if (!visible) {
    return null;
  }

  const accessibilityValue =
    !isIndeterminate && typeof progress === 'number'
      ? {
          min: 0,
          max: 100,
          now: Math.round(clampedProgress * 100),
        }
      : undefined;

  const strengthLabelText =
    showStrengthLabel && !isIndeterminate && typeof progress === 'number'
      ? clampedProgress > 0
        ? strengthTierLabel(clampedProgress)
        : strengthLabelEmpty
      : '';

  const showLabelRow = strengthLabelText !== '';

  const accessibilityLabel = showLabelRow
    ? `${strengthLabelText} password strength`
    : undefined;

  const trackEl = (
    <View
      onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
      style={[
        styles.track,
        {
          height,
          borderRadius: radius,
          backgroundColor: trackColor,
        },
        trackStyle,
      ]}>
      {isIndeterminate ? (
        <Animated.View
          style={[
            styles.indeterminateFill,
            {
              height,
              borderRadius: radius,
              backgroundColor: fillColor,
              width: `${INDETERMINATE_SEGMENT_RATIO * 100}%`,
              transform: [{translateX: slide}],
            },
            fillStyle,
          ]}
        />
      ) : (
        <View
          style={[
            styles.determinateFill,
            {
              height,
              borderRadius: radius,
              backgroundColor: fillColor,
              width: `${clampedProgress * 100}%`,
            },
            fillStyle,
          ]}
        />
      )}
    </View>
  );

  const labelEl = showLabelRow ? (
    <Text
      style={[
        styles.strengthLabel,
        {color: fillColor},
        strengthLabelPosition === 'below' ? styles.strengthLabelBelow : null,
        labelStyle,
      ]}>
      {strengthLabelText}
    </Text>
  ) : null;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={accessibilityValue}
      importantForAccessibility="yes"
      testID={testID}
      style={[styles.wrapper, style]}>
      {strengthLabelPosition === 'above' ? (
        <>
          {labelEl}
          {trackEl}
        </>
      ) : (
        <>
          {trackEl}
          {labelEl}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
    width: '100%',
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  strengthLabelBelow: {
    marginBottom: 0,
    marginTop: 6,
  },
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  determinateFill: {
    alignSelf: 'flex-start',
  },
  indeterminateFill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
