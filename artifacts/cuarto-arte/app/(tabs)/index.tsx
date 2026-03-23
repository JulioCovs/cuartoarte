import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetReportSummary, useGetEvents } from "@workspace/api-client-react";
import Colors from "@/constants/colors";

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Feather name={icon as any} size={20} color={color} style={styles.statIcon} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EventRow({ event }: { event: any }) {
  const statusColor = {
    pendiente: Colors.warning,
    confirmado: Colors.info,
    completado: Colors.success,
    cancelado: Colors.error,
  }[event.status as string] ?? Colors.textSecondary;

  return (
    <Pressable
      style={({ pressed }) => [styles.eventRow, pressed && { opacity: 0.7 }]}
      onPress={() => router.push({ pathname: "/events/[id]", params: { id: event.id } })}
    >
      <View style={[styles.eventDot, { backgroundColor: statusColor }]} />
      <View style={styles.eventRowContent}>
        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.eventMeta}>{event.date} · {event.venue}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {event.status}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: summary, isLoading: summaryLoading } = useGetReportSummary();
  const { data: events, isLoading: eventsLoading } = useGetEvents({ status: "confirmado" });

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 80;

  const upcomingEvents = events?.slice(0, 5) ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandName}>CUARTO ARTE</Text>
          <Text style={styles.subtitle}>Panel de Control</Text>
        </View>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push("/events/create")}
        >
          <Feather name="plus" size={20} color={Colors.dark} />
        </Pressable>
      </View>

      {/* Stats */}
      {summaryLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
      ) : summary ? (
        <View style={styles.statsGrid}>
          <StatCard
            label="Eventos"
            value={String(summary.totalEvents ?? 0)}
            icon="calendar"
            color={Colors.primary}
          />
          <StatCard
            label="Próximos"
            value={String(summary.upcomingEvents ?? 0)}
            icon="clock"
            color={Colors.info}
          />
          <StatCard
            label="Clientes"
            value={String(summary.totalClients ?? 0)}
            icon="users"
            color={Colors.success}
          />
          <StatCard
            label="Músicos"
            value={String(summary.totalMusicians ?? 0)}
            icon="music"
            color={Colors.warning}
          />
        </View>
      ) : null}

      {/* Income card */}
      {summary ? (
        <View style={styles.incomeCard}>
          <View style={styles.incomeRow}>
            <View>
              <Text style={styles.incomeLabel}>Ingresos Totales</Text>
              <Text style={styles.incomeAmount}>
                ${(summary.totalIncome ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.incomeSeparator} />
            <View>
              <Text style={styles.incomeLabel}>Este Mes</Text>
              <Text style={[styles.incomeAmount, { color: Colors.success }]}>
                ${(summary.incomeThisMonth ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
          {(summary.pendingPayments ?? 0) > 0 && (
            <View style={styles.pendingRow}>
              <Feather name="alert-circle" size={14} color={Colors.warning} />
              <Text style={styles.pendingText}>
                ${(summary.pendingPayments ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} pendientes por cobrar
              </Text>
            </View>
          )}
        </View>
      ) : null}

      {/* Upcoming Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Eventos Confirmados</Text>
          <Pressable onPress={() => router.push("/(tabs)/events/index")}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </Pressable>
        </View>
        {eventsLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
        ) : upcomingEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={32} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No hay eventos confirmados</Text>
          </View>
        ) : (
          upcomingEvents.map((event) => (
            <EventRow key={event.id} event={event} />
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.quickActions}>
          <Pressable
            style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.7 }]}
            onPress={() => router.push("/events/create")}
          >
            <Feather name="calendar" size={22} color={Colors.primary} />
            <Text style={styles.quickActionText}>Evento</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.7 }]}
            onPress={() => router.push("/clients/create")}
          >
            <Feather name="user-plus" size={22} color={Colors.info} />
            <Text style={styles.quickActionText}>Cliente</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.7 }]}
            onPress={() => router.push("/musicians/create")}
          >
            <Feather name="music" size={22} color={Colors.success} />
            <Text style={styles.quickActionText}>Músico</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.7 }]}
            onPress={() => router.push("/payments/create")}
          >
            <Feather name="dollar-sign" size={22} color={Colors.warning} />
            <Text style={styles.quickActionText}>Pago</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
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
    marginBottom: 20,
  },
  brandName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.textPrimary,
    lineHeight: 32,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  incomeCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  incomeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  incomeSeparator: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  incomeLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  incomeAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.textPrimary,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pendingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.warning,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  seeAll: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.primary,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  eventRowContent: {
    flex: 1,
  },
  eventTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  eventMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "capitalize",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
  },
  quickAction: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
  },
  quickActionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
