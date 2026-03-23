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

const METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  cheque: "Cheque",
  otro: "Otro",
};

const TYPE_LABELS: Record<string, string> = {
  anticipo: "Anticipo",
  pago_parcial: "Pago Parcial",
  pago_total: "Pago Total",
};

export default function MyPaymentsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { data: allEvents = [], isLoading } = useGetEvents({});

  const myEvents = useMemo(
    () => allEvents.filter((e) => e.clientId === user?.clientId),
    [allEvents, user]
  );

  const paymentsWithEvent = useMemo(() => {
    const result: Array<{ payment: any; event: any }> = [];
    for (const e of myEvents) {
      for (const p of (e.payments ?? [])) {
        result.push({ payment: p, event: e });
      }
    }
    return result.sort(
      (a, b) => new Date(b.payment.date).getTime() - new Date(a.payment.date).getTime()
    );
  }, [myEvents]);

  const totalPaid = paymentsWithEvent.reduce((sum, { payment }) => sum + parseFloat(payment.amount ?? "0"), 0);
  const totalOwed = myEvents.reduce((sum, e) => sum + parseFloat(e.totalAmount ?? "0"), 0);
  const pending = totalOwed - totalPaid;

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
          <Text style={styles.summaryLabel}>Pendiente</Text>
          <Text style={[styles.summaryValue, { color: pending > 0 ? "#F5A623" : "#4CAF50" }]}>
            ${pending.toLocaleString("es-MX")}
          </Text>
        </View>
      </View>

      {pending > 0 && myEvents.length > 0 && (
        <Pressable
          style={styles.payBtn}
          onPress={() =>
            router.push({
              pathname: "/payments/create",
              params: {
                eventId: String(myEvents[0]?.id),
                eventTitle: myEvents[0]?.title,
              },
            })
          }
        >
          <Feather name="plus" size={16} color={Colors.dark} />
          <Text style={styles.payBtnText}>Registrar Pago</Text>
        </Pressable>
      )}

      <Text style={styles.sectionTitle}>Historial</Text>

      <FlatList
        data={paymentsWithEvent}
        keyExtractor={(item) => String(item.payment.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="credit-card" size={40} color={Colors.border} />
            <Text style={styles.emptyText}>No hay pagos registrados</Text>
          </View>
        }
        renderItem={({ item: { payment, event } }) => (
          <View style={styles.paymentCard}>
            <View style={styles.paymentTop}>
              <View style={styles.paymentTypeChip}>
                <Text style={styles.paymentTypeText}>{TYPE_LABELS[payment.type] ?? payment.type}</Text>
              </View>
              <Text style={styles.paymentDate}>{payment.date}</Text>
            </View>
            <Text style={styles.paymentEvent} numberOfLines={1}>{event.title}</Text>
            <View style={styles.paymentBottom}>
              <View style={styles.methodRow}>
                <Feather name="credit-card" size={13} color={Colors.textSecondary} />
                <Text style={styles.paymentMethod}>{METHOD_LABELS[payment.method] ?? payment.method}</Text>
              </View>
              <Text style={styles.paymentAmount}>
                ${parseFloat(payment.amount ?? "0").toLocaleString("es-MX")}
              </Text>
            </View>
          </View>
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
});
