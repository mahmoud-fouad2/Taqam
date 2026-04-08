import { Image, StyleProp, View, ViewStyle } from "react-native";

// Login screen always has a dark background — always use the dark logo.
const logoDark = require("../assets/brand/logo-dark.png");

export function BrandLogo({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image
        source={logoDark}
        resizeMode="contain"
        style={{ width: 160, height: 48 }}
        accessibilityLabel="طاقم - Taqam"
      />
    </View>
  );
}
