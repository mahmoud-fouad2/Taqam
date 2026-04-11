"use client";

import * as React from "react";

type AppDir = "ltr" | "rtl";

const DirectionContext = React.createContext<AppDir>("ltr");

export function AppDirectionProvider({
  dir,
  children
}: {
  dir: AppDir;
  children: React.ReactNode;
}) {
  return <DirectionContext.Provider value={dir}>{children}</DirectionContext.Provider>;
}

export function useAppDir(): AppDir {
  return React.useContext(DirectionContext);
}
