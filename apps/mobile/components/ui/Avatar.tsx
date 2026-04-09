import { View, Text, type ViewStyle } from "react-native";
import { useTheme } from "@/theme";

type Props = {
  size?: number;
  name?: string;
  imageUri?: string;
  style?: ViewStyle;
};

export function Avatar({ size = 48, name, style }: Props) {
  const { colors } = useTheme();

  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${colors.primary}18`,
          borderWidth: 2,
          borderColor: `${colors.primary}40`,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text
        style={{
          color: colors.primary,
          fontSize: size * 0.35,
          fontWeight: "900",
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
