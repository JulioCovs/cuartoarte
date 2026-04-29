import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetEvents } from "@workspace/api-client-react";
import Colors from "@/constants/colors";

const STATUS_OPTIONS = ["todos", "pendiente", "confirmado", "completado", "cancelado"] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

const STATUS_COLORS: Record<string, string> = {
  pendiente: Colors.warning,
  confirmado: Colors.info,
  completado: Colors.success,
  cancelado: Colors.error,
};

function EventCard({ event }: { event: any }) {
  const statusColor = STATUS_COLORS[event.status as string] ?? Colors.textSecondary;
  const remaining = (event.totalAmount ?? 0) - (event.advanceAmount ?? 0);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
      onPress={() => router.push({ pathname: "/events/[id]", params: { id: event.id } })}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{event.title}</Text>
          <Text style={styles.cardEventType}>{event.eventType}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusColor + "22" }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{event.status}</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <View style={styles.metaRow}>
          <Feather name="calendar" size={13} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{event.date} · {event.time}</Text>
        </View>
        <View style={styles.metaRow}>
          <Feather name="map-pin" size={13} color={Colors.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>{event.venue}</Text>
        </View>
        {event.clientName ? (
          <View style={styles.metaRow}>
            <Feather name="user" size={13} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{event.clientName}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>
            ${(event.totalAmount ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.divider} />
        <View>
          <Text style={styles.amountLabel}>Anticipo</Text>
          <Text style={[styles.amountValue, { color: Colors.success }]}>
            ${(event.advanceAmount ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.divider} />
        <View>
          <Text style={styles.amountLabel}>Pendiente</Text>
          <Text style={[styles.amountValue, remaining > 0 ? { color: Colors.warning } : { color: Colors.success }]}>
            ${remaining.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </Text>
        </View>
        {event.musicians && event.musicians.length > 0 ? (
          <View style={styles.musicianBadge}>
            <Feather name="music" size={12} color={Colors.primary} />
            <Text style={styles.musicianCount}>{event.musicians.length}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const { data: events, isLoading, refetch } = useGetEvents(
    statusFilter !== "todos" ? { status: statusFilter } : {}
  );

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 80;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Eventos</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push("/events/create")}>
          <Feather name="plus" size={20} color={Colors.dark} />
        </Pressable>
      </View>

      {/* Filter tabs */}
      <FlatList
        data={STATUS_OPTIONS as unknown as StatusFilter[]}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.filterChip,
              statusFilter === item && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(item)}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === item && styles.filterTextActive,
              ]}
            >
              {item === "todos" ? "Todos" : item}
            </Text>
          </Pressable>
        )}
      />

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={events ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: bottomPadding,
          }}
          onRefresh={refetch}
          refreshing={isLoading}
          scrollEnabled={!!(events && events.length > 0)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="calendar" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>Sin eventos</Text>
              <Text style={styles.emptyText}>Toca + para crear un evento</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  filterList: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  filterTextActive: {
    color: Colors.dark,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 10,
  },
  cardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.textPrimary,
  },
  cardEventType: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  badgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "capitalize",
  },
  cardMeta: {
    gap: 5,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  amountLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  amountValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  musicianBadge: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary + "22",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  musicianCount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.primary,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
