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
import { useQuery } from "@tanstack/react-query";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  cheque: "Cheque",
  otro: "Otro",
};

const TYPE_LABELS: Record<string, string> = {
  anticipo: "Anticipo",
  pago_parcial: "Pago Parcial",
  pago_total: "Pago Total",
};

function useClientPayments(clientId: number | null | undefined) {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const baseUrl = domain ? `https://${domain}` : "";

  return useQuery({
    queryKey: ["clientPayments", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/payments?clientId=${clientId}`);
      if (!res.ok) throw new Error("Error al cargar pagos");
      return res.json() as Promise<any[]>;
    },
  });
}

function useClientEvents(clientId: number | null | undefined) {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const baseUrl = domain ? `https://${domain}` : "";

  return useQuery({
    queryKey: ["clientEvents", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/events`);
      if (!res.ok) throw new Error("Error al cargar eventos");
      const all = await res.json() as any[];
      return all.filter((e) => e.clientId === clientId);
    },
  });
}

export default function MyPaymentsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { data: payments = [], isLoading: paymentsLoading } = useClientPayments(user?.clientId);
  const { data: myEvents = [], isLoading: eventsLoading } = useClientEvents(user?.clientId);

  const isLoading = paymentsLoading || eventsLoading;

  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [payments]
  );

  // Only approved payments count toward the paid balance
  const totalPaid = payments
    .filter((p: any) => p.status === "approved" || !p.status)
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount ?? "0"), 0);
  const totalOwed = myEvents.reduce((sum: number, e: any) => sum + parseFloat(e.totalAmount ?? "0"), 0);
  const remaining = Math.max(0, totalOwed - totalPaid);
  const pendingApproval = payments.filter((p: any) => p.status === "pending_approval").length;

  const firstOpenEvent = myEvents.find((e: any) => e.status !== "cancelado");

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
        <Text style={styles.headerTitle}>Mis Pagos</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Pagado</Text>
          <Text style={[styles.summaryValue, { color: "#4CAF50" }]}>
            ${totalPaid.toLocaleString("es-MX")}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Por Pagar</Text>
          <Text style={[styles.summaryValue, { color: remaining > 0 ? "#F5A623" : "#4CAF50" }]}>
            ${remaining.toLocaleString("es-MX")}
          </Text>
        </View>
      </View>

      {/* Pending approval notice */}
      {pendingApproval > 0 && (
        <View style={styles.pendingNotice}>
          <Feather name="clock" size={14} color={Colors.warning} />
          <Text style={styles.pendingNoticeText}>
            {pendingApproval} pago{pendingApproval > 1 ? "s" : ""} en efectivo pendiente{pendingApproval > 1 ? "s" : ""} de confirmación por el admin
          </Text>
        </View>
      )}

      {remaining > 0 && firstOpenEvent && (
        <Pressable
          style={styles.payBtn}
          onPress={() =>
            router.push({
              pathname: "/payments/create",
              params: {
                eventId: String(firstOpenEvent.id),
                eventTitle: firstOpenEvent.title,
                eventTotal: String(firstOpenEvent.totalAmount ?? 0),
                totalPaid: String(totalPaid),
              },
            })
          }
        >
          <Feather name="plus" size={16} color={Colors.dark} />
          <Text style={styles.payBtnText}>Registrar Pago</Text>
        </Pressable>
      )}

      <Text style={styles.sectionTitle}>Historial ({sortedPayments.length})</Text>

      <FlatList
        data={sortedPayments}
        keyExtractor={(item: any) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="credit-card" size={40} color={Colors.border} />
            <Text style={styles.emptyText}>No hay pagos registrados</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isPending = item.status === "pending_approval";
          const isRejected = item.status === "rejected";
          return (
            <View style={[
              styles.paymentCard,
              isPending && { borderColor: Colors.warning + "66" },
              isRejected && { borderColor: Colors.error + "44", opacity: 0.7 },
            ]}>
              <View style={styles.paymentTop}>
                <View style={styles.paymentTypeChip}>
                  <Text style={styles.paymentTypeText}>{TYPE_LABELS[item.type] ?? item.type}</Text>
                </View>
                {isPending && (
                  <View style={styles.statusChip}>
                    <Feather name="clock" size={10} color={Colors.warning} />
                    <Text style={[styles.statusChipText, { color: Colors.warning }]}>Por confirmar</Text>
                  </View>
                )}
                {isRejected && (
                  <View style={[styles.statusChip, { backgroundColor: Colors.error + "22" }]}>
                    <Feather name="x-circle" size={10} color={Colors.error} />
                    <Text style={[styles.statusChipText, { color: Colors.error }]}>Rechazado</Text>
                  </View>
                )}
                <Text style={styles.paymentDate}>{item.date}</Text>
              </View>
              {item.eventTitle && (
                <Text style={styles.paymentEvent} numberOfLines={1}>{item.eventTitle}</Text>
              )}
              <View style={styles.paymentBottom}>
                <View style={styles.methodRow}>
                  <Feather name="credit-card" size={13} color={Colors.textSecondary} />
                  <Text style={styles.paymentMethod}>{METHOD_LABELS[item.method] ?? item.method}</Text>
                </View>
                <Text style={[
                  styles.paymentAmount,
                  isPending && { color: Colors.warning },
                  isRejected && { color: Colors.error },
                ]}>
                  ${parseFloat(item.amount ?? "0").toLocaleString("es-MX")}
                </Text>
              </View>
            </View>
          );
        }}
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
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.textPrimary },
  summaryRow: { flexDirection: "row", gap: 12, padding: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  summaryValue: { fontFamily: "Inter_700Bold", fontSize: 20 },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  payBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.dark },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary },
  paymentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  paymentTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  paymentTypeChip: {
    backgroundColor: Colors.primary + "25",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  paymentTypeText: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.primary },
  paymentDate: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginLeft: "auto" },
  paymentEvent: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textPrimary },
  paymentBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  methodRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  paymentMethod: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  paymentAmount: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.primary },
  pendingNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.warning + "18",
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.warning + "44",
  },
  pendingNoticeText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.warning, flex: 1 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.warning + "22",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusChipText: { fontFamily: "Inter_500Medium", fontSize: 10 },
});
