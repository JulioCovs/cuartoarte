import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator, FlatList, Pressable, RefreshControl,
  StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_LABELS: Record<string, string> = {
  pending: "Esperando respuesta del músico",
  accepted: "Aceptada — el admin confirmará",
  rejected: "Rechazada",
  confirmed: "¡Confirmada!",
  cancelled: "Cancelada",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "#F5A623", accepted: "#4CAF50", rejected: "#E53935",
  confirmed: Colors.primary, cancelled: "#9A9A9A",
};

export default function MyRequestsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const baseUrl = domain ? `https://${domain}` : "";

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ["myRequests", user?.clientId],
    enabled: !!user?.clientId,
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/bookings?clientId=${user!.clientId}`);
      if (!res.ok) throw new Error("Error al cargar solicitudes");
      return res.json() as Promise<any[]>;
    },
    refetchInterval: 20000,
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Solicitudes</Text>
        <Text style={styles.subtitle}>Seguimiento de tus contrataciones</Text>
      </View>

      <Pressable style={styles.newBtn} onPress={() => router.push("/(tabs)/catalog")}>
        <Feather name="plus" size={15} color={Colors.dark} />
        <Text style={styles.newBtnText}>Nueva Solicitud</Text>
      </Pressable>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(r) => String(r.id)}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.primary} />}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="send" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>Aún no tienes solicitudes</Text>
              <Text style={styles.emptySubtext}>Ve al catálogo de músicos para solicitar una contratación</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: item.id } })}>
              <View style={styles.cardHeader}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] ?? Colors.border }]} />
                <Text style={[styles.statusLabel, { color: STATUS_COLORS[item.status] }]}>{STATUS_LABELS[item.status] ?? item.status}</Text>
              </View>
              <Text style={styles.eventType}>{item.eventType}</Text>
              <View style={styles.row}><Feather name="music" size={13} color={Colors.textSecondary} /><Text style={styles.rowText}>{item.musicianName} · {item.musicianInstruments}</Text></View>
              <View style={styles.row}><Feather name="calendar" size={13} color={Colors.textSecondary} /><Text style={styles.rowText}>{item.requestedDate} {item.requestedTime}</Text></View>
              <View style={styles.row}><Feather name="map-pin" size={13} color={Colors.textSecondary} /><Text style={styles.rowText}>{item.venue}</Text></View>
              {item.status === "confirmed" && item.eventId && (
                <Pressable style={styles.viewEventBtn} onPress={() => router.push({ pathname: "/events/[id]", params: { id: item.eventId } })}>
                  <Feather name="external-link" size={13} color={Colors.primary} />
                  <Text style={styles.viewEventText}>Ver evento confirmado</Text>
                </Pressable>
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.textPrimary },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  newBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center",
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, margin: 16,
  },
  newBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.dark },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.textPrimary },
  emptySubtext: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, textAlign: "center" },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontFamily: "Inter_500Medium", fontSize: 12, flex: 1 },
  eventType: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.textPrimary },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, flex: 1 },
  viewEventBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  viewEventText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.primary },
});
