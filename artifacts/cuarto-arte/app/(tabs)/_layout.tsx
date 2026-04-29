import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function TabLayout() {
  const { user } = useAuth();
  const role = user?.role ?? "admin";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const safeAreaInsets = useSafeAreaInsets();

  const isAdmin = role === "admin";
  const isClient = role === "client";
  const isMusician = role === "musician";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : Colors.surface,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: Colors.border,
          elevation: 0,
          paddingBottom: safeAreaInsets.bottom,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
          ) : null,
      }}
    >
      {/* ── ADMIN ─────────────────────────────── */}
      <Tabs.Screen name="index" options={{ title: "Inicio", href: isAdmin ? undefined : null,
        tabBarIcon: ({ color }) => isIOS ? <SymbolView name="house" tintColor={color} size={22} /> : <Feather name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="bookings/index" options={{ title: "Solicitudes", href: isAdmin ? undefined : null,
        tabBarIcon: ({ color }) => isIOS ? <SymbolView name="bell" tintColor={color} size={22} /> : <Feather name="bell" size={22} color={color} /> }} />
      <Tabs.Screen name="events/index" options={{ title: "Eventos", href: isAdmin ? undefined : null,
        tabBarIcon: ({ color }) => isIOS ? <SymbolView name="calendar" tintColor={color} size={22} /> : <Feather name="calendar" size={22} color={color} /> }} />
      <Tabs.Screen name="clients/index" options={{ title: "Clientes", href: isAdmin ? undefined : null,
        tabBarIcon: ({ color }) => isIOS ? <SymbolView name="person.2" tintColor={color} size={22} /> : <Feather name="users" size={22} color={color} /> }} />
      <Tabs.Screen name="musicians/index" options={{ title: "Músicos", href: isAdmin ? undefined : null,
        tabBarIcon: ({ color }) => isIOS ? <SymbolView name="music.mic" tintColor={color} size={22} /> : <Feather name="music" size={22} color={color} /> }} />
      <Tabs.Screen name="reports/index" options={{ title: "Reportes", href: isAdmin ? undefined : null,
        tabBarIcon: ({ color }) => isIOS ? <SymbolView name="chart.bar" tintColor={color} size={22} /> : <Feather name="bar-chart-2" size={22} color={color} /> }} />

      {/* ── CLIENTE ───────────────────────────── */}
      <Tabs.Screen name="catalog/index" options={{ title: "Catálogo", href: isClient ? undefined : null,
        tabBarIcon: ({ color }) => isIOS ? <SymbolView name="music.mic" tintColor={color} size={22} /> : <Feather name="music" size={22} color={color} /> }} />
      <Tabs.Screen name="my-events/index" options={{ title: "Mis Eventos", href: isClient || isMusician ? undefined : null,
        tabBarIcon: ({ color }) => isIOS ? <SymbolView name="calendar" tintColor={color} size={22} /> : <Feather name="calendar" size={22} color={color} /> }} />
      <Tabs.Screen name="my-requests/index" options={{ title: "Solicitudes", href: isClient ? undefined : null,
        tabBarIcon: ({ color }) => isIOS ? <SymbolView name="bell" tintColor={color} size={22} /> : <Feather name="bell" size={22} color={color} /> }} />
      <Tabs.Screen name="my-payments/index" options={{ title: "Mis Pagos", href: isClient ? undefined : null,
        tabBarIcon: ({ color }) => isIOS ? <SymbolView name="creditcard" tintColor={color} size={22} /> : <Feather name="credit-card" size={22} color={color} /> }} />

      {/* ── MÚSICO ────────────────────────────── */}
      <Tabs.Screen name="requests/index" options={{ title: "Solicitudes", href: isMusician ? undefined : null,
        tabBarIcon: ({ color }) => isIOS ? <SymbolView name="bell" tintColor={color} size={22} /> : <Feather name="bell" size={22} color={color} /> }} />

      {/* ── TODOS ─────────────────────────────── */}
      <Tabs.Screen name="profile/index" options={{ title: "Perfil",
        tabBarIcon: ({ color }) => isIOS ? <SymbolView name="person.circle" tintColor={color} size={22} /> : <Feather name="user" size={22} color={color} /> }} />
    </Tabs>
  );
}
