import { View, Text, type ViewStyle } from "react-native";
import { useTheme } from "@/theme";

type Props = {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
};

export function EmptyState({ icon = "📋", title, subtitle, action, style }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[{ alignItems: "center", paddingVertical: 48, gap: 12 }, style]}>
      <Text style={{ fontSize: 48 }}>{icon}</Text>
      <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text, textAlign: "center" }}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: "center",
            maxWidth: 260,
            lineHeight: 20,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
      {action}
    </View>
  );
}
