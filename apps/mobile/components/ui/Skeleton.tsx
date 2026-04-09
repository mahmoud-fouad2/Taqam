import { useEffect, useRef } from "react";
import { Animated, View, type ViewStyle } from "react-native";
import { useTheme } from "@/theme";

type Props = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: Props) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Card-shaped skeleton placeholder.
 */
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: 16,
          gap: 10,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Skeleton width="50%" height={12} />
      <Skeleton width="80%" height={16} />
      <Skeleton width="30%" height={12} />
    </View>
  );
}
