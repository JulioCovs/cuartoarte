import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetEvents } from "@workspace/api-client-react";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_COLORS: Record<string, string> = {
  pendiente: "#F5A623",
  confirmado: "#4CAF50",
  realizado: Colors.primary,
  cancelado: "#E53935",
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

export default function MyEventsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { data: allEvents = [], isLoading } = useGetEvents({});

  const events = useMemo(() => {
    if (user?.role === "client") {
      return allEvents.filter((e) => e.clientId === user.clientId);
    }
    if (user?.role === "musician" && user.musicianId) {
      return allEvents.filter((e) =>
        (e.musicians ?? []).some((m: any) => m.id === user.musicianId)
      );
    }
    return allEvents;
  }, [allEvents, user]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bienvenido,</Text>
        <Text style={styles.name}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Feather
            name={user?.role === "client" ? "user" : "music"}
            size={12}
            color={Colors.primary}
          />
          <Text style={styles.roleBadgeText}>
            {user?.role === "client" ? "Cliente" : "Músico"}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Mis Eventos ({events.length})</Text>

      <FlatList
        data={events}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="calendar" size={40} color={Colors.border} />
            <Text style={styles.emptyText}>No tienes eventos asignados</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/events/${item.id}`)}
          >
            <View style={styles.cardTop}>
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] ?? Colors.border }]} />
              <Text style={styles.cardStatus}>{STATUS_LABELS[item.status] ?? item.status}</Text>
              <Text style={styles.cardDate}>{item.date}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.cardMeta}>
              <Feather name="map-pin" size={13} color={Colors.textSecondary} />
              <Text style={styles.cardMetaText}>{item.venue}</Text>
            </View>
            <View style={styles.cardMeta}>
              <Feather name="clock" size={13} color={Colors.textSecondary} />
              <Text style={styles.cardMetaText}>{item.time}</Text>
            </View>
            {user?.role === "client" && (
              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterLabel}>Total:</Text>
                <Text style={styles.cardFooterValue}>
                  ${parseFloat(item.totalAmount ?? "0").toLocaleString("es-MX")}
                </Text>
              </View>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary },
  name: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.textPrimary },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: Colors.primary + "20",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.primary },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardStatus: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary, flex: 1 },
  cardDate: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.textPrimary, marginBottom: 8 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  cardMetaText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 10,
    paddingTop: 10,
  },
  cardFooterLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  cardFooterValue: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.primary },
});
