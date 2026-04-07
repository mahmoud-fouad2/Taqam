import { Image, StyleProp, View, ViewStyle } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";

const logoLight = require("../assets/brand/logo-light.png");
const logoDark = require("../assets/brand/logo-dark.png");

export function BrandLogo({ style }: { style?: StyleProp<ViewStyle> }) {
  const scheme = useColorScheme();
  const source = scheme === "dark" ? logoDark : logoLight;

  return (
    <View style={style}>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image
        source={source}
        resizeMode="contain"
        style={{ width: 160, height: 48 }}
        accessibilityLabel="طاقم - Taqam"
      />
    </View>
  );
}
