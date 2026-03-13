import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { hasCachedNativeAvatar, markNativeAvatarCached } from "./nativeAvatarCache";

export function NativeAvatar({
  fallback,
  size = 44,
  uri,
}: {
  fallback: string;
  size?: number;
  uri?: string;
}) {
  const [ready, setReady] = React.useState(() => hasCachedNativeAvatar(uri));

  React.useEffect(() => {
    if (!uri) {
      setReady(false);
      return;
    }

    if (hasCachedNativeAvatar(uri)) {
      setReady(true);
      return;
    }

    let cancelled = false;
    void Image.prefetch(uri)
      .then(() => {
        if (cancelled) {
          return;
        }

        markNativeAvatarCached(uri);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [uri]);

  const borderRadius = size / 2;

  if (!uri || !ready) {
    return (
      <View style={[styles.fallback, { width: size, height: size, borderRadius }]}>
        <Text style={styles.fallbackText}>{fallback.slice(0, 1).toUpperCase()}</Text>
      </View>
    );
  }

  return (
    <Image
      onLoad={() => markNativeAvatarCached(uri)}
      source={{ uri, cache: "force-cache" }}
      style={{ width: size, height: size, borderRadius }}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
  },
  fallbackText: {
    color: "#111827",
    fontFamily: "SemiBold",
    fontSize: 16,
  },
});
