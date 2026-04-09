import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle, type TextStyle } from "react-native";
import { useTheme } from "@/theme";

type Variant = "primary" | "secondary" | "ghost" | "destructive";

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: "sm" | "md" | "lg";
};

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
  size = "md",
}: Props) {
  const { colors, radius: r, shadows: s } = useTheme();
  const isDisabled = disabled || loading;

  const bg: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.surface,
    ghost: "transparent",
    destructive: colors.error,
  };

  const fg: Record<Variant, string> = {
    primary: "#fff",
    secondary: colors.text,
    ghost: colors.primary,
    destructive: "#fff",
  };

  const borderW: Record<Variant, number> = {
    primary: 0,
    secondary: 1,
    ghost: 0,
    destructive: 0,
  };

  const pad = size === "sm" ? 10 : size === "lg" ? 18 : 14;
  const fSize = size === "sm" ? 13 : size === "lg" ? 17 : 15;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg[variant],
          borderRadius: r.lg,
          paddingVertical: pad,
          paddingHorizontal: pad * 1.5,
          alignItems: "center" as const,
          justifyContent: "center" as const,
          borderWidth: borderW[variant],
          borderColor: colors.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        variant === "primary" && s.sm,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} size="small" />
      ) : (
        <Text style={[{ color: fg[variant], fontSize: fSize, fontWeight: "700" }, textStyle]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
