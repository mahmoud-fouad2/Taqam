import { View, type ViewStyle, type ViewProps } from "react-native";
import { useTheme } from "@/theme";

type Variant = "elevated" | "outlined" | "flat";

type Props = ViewProps & {
  variant?: Variant;
  style?: ViewStyle;
};

export function Card({ variant = "elevated", style, children, ...rest }: Props) {
  const { colors, radius, shadows } = useTheme();

  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
  };

  const variants: Record<Variant, ViewStyle> = {
    elevated: { ...shadows.sm, borderWidth: 0 },
    outlined: { borderWidth: 1, borderColor: colors.border },
    flat: { borderWidth: 0 },
  };

  return (
    <View style={[base, variants[variant], style]} {...rest}>
      {children}
    </View>
  );
}
