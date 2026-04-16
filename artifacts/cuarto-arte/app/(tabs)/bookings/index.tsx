import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, FlatList, Pressable, RefreshControl,
  StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import Colors from "@/constants/colors";

const STATUS_FILTERS = [
  { key: "accepted", label: "Por Confirmar", color: "#4CAF50" },
  { key: "pending", label: "Pendientes", color: "#F5A623" },
  { key: "confirmed", label: "Confirmadas", color: Colors.primary },
  { key: "rejected", label: "Rechazadas", color: "#E53935" },
  { key: "cancelled", label: "Canceladas", color: "#9A9A9A" },
];

function useBookings(status?: string) {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const baseUrl = domain ? `https://${domain}` : "";
  return useQuery({
    queryKey: ["adminBookings", status],
    queryFn: async () => {
      const url = `${baseUrl}/api/bookings${status ? `?status=${status}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al cargar solicitudes");
      return res.json() as Promise<any[]>;
    },
    refetchInterval: 15000,
  });
}

const STATUS_LABELS: Record<string, string> = {
  pending: "En espera del músico",
  accepted: "Aceptada — pendiente de confirmar",
  rejected: "Rechazada por el músico",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "#F5A623", accepted: "#4CAF50", rejected: "#E53935",
  confirmed: Colors.primary, cancelled: "#9A9A9A",
};

export default function AdminBookingsScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState("accepted");
  const { data: bookings = [], isLoading, refetch } = useBookings(activeFilter);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Solicitudes de Contratación</Text>
        <Text style={styles.subtitle}>Gestiona las solicitudes de clientes</Text>
      </View>

      {/* Status filter chips */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(f) => f.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.chip, activeFilter === item.key && { backgroundColor: item.color, borderColor: item.color }]}
            onPress={() => setActiveFilter(item.key)}
          >
            <Text style={[styles.chipText, activeFilter === item.key && { color: Colors.dark }]}>{item.label}</Text>
          </Pressable>
        )}
      />

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => String(b.id)}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.primary} />}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="inbox" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>No hay solicitudes {STATUS_FILTERS.find(f => f.key === activeFilter)?.label.toLowerCase()}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push({ pathname: "/bookings/[id]", params: { id: item.id } })}>
              <View style={styles.cardHeader}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] ?? Colors.border }]} />
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{STATUS_LABELS[item.status] ?? item.status}</Text>
                <Text style={styles.date}>{item.requestedDate}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.eventType}</Text>
              <View style={styles.infoRow}>
                <Feather name="user" size={13} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{item.clientName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Feather name="music" size={13} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{item.musicianName} · {item.musicianInstruments}</Text>
              </View>
              <View style={styles.infoRow}>
                <Feather name="map-pin" size={13} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{item.venue}</Text>
              </View>
              {item.status === "accepted" && (
                <View style={styles.actionHint}>
                  <Feather name="check-circle" size={13} color="#4CAF50" />
                  <Text style={[styles.actionHintText, { color: "#4CAF50" }]}>Toca para confirmar y crear el evento</Text>
                </View>
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
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, textAlign: "center" },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: "Inter_500Medium", fontSize: 12, flex: 1 },
  date: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.textPrimary },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, flex: 1 },
  actionHint: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  actionHintText: { fontFamily: "Inter_500Medium", fontSize: 12 },
});
