import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Theme } from "../types/mqtt";

export const storageService = {
  async load() {
    const values = await AsyncStorage.multiGet(["brokerUrl", "theme"]);
    return { url: values[0][1], theme: values[1][1] };
  },
  saveUrl(url: string) {
    return AsyncStorage.setItem("brokerUrl", url);
  },
  saveTheme(theme: Theme) {
    return AsyncStorage.setItem("theme", theme);
  },
};
