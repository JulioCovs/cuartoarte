import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useGetEvent,
  useDeleteEvent,
  useGetPayments,
  useDeletePayment,
} from "@workspace/api-client-react";
import Colors from "@/constants/colors";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_COLORS: Record<string, string> = {
  pendiente: Colors.warning,
  confirmado: Colors.info,
  completado: Colors.success,
  cancelado: Colors.error,
};

const TYPE_LABELS: Record<string, string> = {
  anticipo: "Anticipo",
  pago_parcial: "Pago Parcial",
  pago_total: "Pago Total",
};

const METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  cheque: "Cheque",
  otro: "Otro",
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon as any} size={15} color={Colors.primary} style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const eventId = parseInt(id!);
  const isAdmin = user?.role === "admin";

  const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";

  const { data: event, isLoading } = useGetEvent(eventId);
  const { data: payments } = useGetPayments({ eventId });
  const deleteEvent = useDeleteEvent();
  const deletePayment = useDeletePayment();

  const approvedPayments = (payments ?? []).filter((p) => p.status === "approved");
  const pendingPayments = (payments ?? []).filter((p) => p.status === "pending_approval");
  const rejectedPayments = (payments ?? []).filter((p) => p.status === "rejected");

  const totalPaid = approvedPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const remaining = (event?.totalAmount ?? 0) - totalPaid;

  const statusColor = STATUS_COLORS[event?.status as string] ?? Colors.textSecondary;

  useEffect(() => {
    if (event) {
      navigation.setOptions({
        title: event.title,
        headerRight: () => (
          <View style={{ flexDirection: "row", gap: 12, marginRight: 4 }}>
            {isAdmin && (
              <Pressable
                onPress={() => router.push({ pathname: "/events/create", params: { editId: id } })}
              >
                <Feather name="edit-2" size={20} color={Colors.primary} />
              </Pressable>
            )}
            {isAdmin && (
              <Pressable onPress={handleDelete}>
                <Feather name="trash-2" size={20} color={Colors.error} />
              </Pressable>
            )}
          </View>
        ),
      });
    }
  }, [event]);

  const handleDelete = () => {
    Alert.alert("Eliminar Evento", "¿Estás seguro de eliminar este evento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteEvent.mutateAsync({ id: eventId });
          queryClient.invalidateQueries({ queryKey: ["getEvents"] });
          queryClient.invalidateQueries({ queryKey: ["getReportSummary"] });
          router.back();
        },
      },
    ]);
  };

  const handleDeletePayment = (paymentId: number) => {
    Alert.alert("Eliminar Pago", "¿Eliminar este pago?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deletePayment.mutateAsync({ id: paymentId });
          queryClient.invalidateQueries({ queryKey: ["getPayments"] });
          queryClient.invalidateQueries({ queryKey: ["getIncomeReport"] });
          queryClient.invalidateQueries({ queryKey: ["getReportSummary"] });
        },
      },
    ]);
  };

  const handleApprovePayment = async (paymentId: number) => {
    try {
      const res = await fetch(`${baseUrl}/api/payments/${paymentId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Error al aprobar");
      queryClient.invalidateQueries({ queryKey: ["getPayments"] });
      queryClient.invalidateQueries({ queryKey: ["getReportSummary"] });
    } catch {
      Alert.alert("Error", "No se pudo aprobar el pago");
    }
  };

  const handleRejectPayment = async (paymentId: number) => {
    Alert.alert("Rechazar Pago", "¿Rechazar este pago en efectivo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Rechazar",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${baseUrl}/api/payments/${paymentId}/reject`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            if (!res.ok) throw new Error("Error al rechazar");
            queryClient.invalidateQueries({ queryKey: ["getPayments"] });
          } catch {
            Alert.alert("Error", "No se pudo rechazar el pago");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Evento no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Status banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusColor + "22" }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {event.status?.toUpperCase()}
        </Text>
        <Text style={styles.eventType}>· {event.eventType}</Text>
      </View>

      {/* Event info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detalles</Text>
        <InfoRow icon="calendar" label="Fecha" value={event.date} />
        <InfoRow icon="clock" label="Hora" value={event.time} />
        <InfoRow icon="map-pin" label="Lugar" value={event.venue} />
        {event.clientName ? (
          <InfoRow icon="user" label="Cliente" value={event.clientName} />
        ) : null}
        {event.notes ? (
          <InfoRow icon="file-text" label="Notas" value={event.notes} />
        ) : null}
      </View>

      {/* Musicians */}
      {event.musicians && event.musicians.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Músicos Asignados</Text>
          {event.musicians.map((m: any) => (
            <View key={m.id} style={styles.musicianRow}>
              <View style={styles.musicianAvatar}>
                <Text style={styles.musicianAvatarText}>
                  {m.musicianName.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
                </Text>
              </View>
              <View style={styles.musicianInfo}>
                <Text style={styles.musicianName}>{m.musicianName}</Text>
                <Text style={styles.musicianInstruments}>{m.instruments}</Text>
              </View>
              {m.fee != null && (
                <Text style={styles.musicianFee}>
                  ${m.fee.toLocaleString("es-MX")}
                </Text>
              )}
            </View>
          ))}
        </View>
      ) : null}

      {/* Payments summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Finanzas</Text>
        <View style={styles.financeRow}>
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>Total</Text>
            <Text style={styles.financeAmount}>
              ${(event.totalAmount ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.financeDivider} />
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>Pagado</Text>
            <Text style={[styles.financeAmount, { color: Colors.success }]}>
              ${totalPaid.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.financeDivider} />
          <View style={styles.financeItem}>
            <Text style={styles.financeLabel}>Por cobrar</Text>
            <Text style={[styles.financeAmount, remaining > 0 ? { color: Colors.warning } : { color: Colors.success }]}>
              ${remaining.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, (event.totalAmount ?? 0) > 0 ? (totalPaid / (event.totalAmount ?? 1)) * 100 : 0)}%` as any,
              },
            ]}
          />
        </View>

        <Pressable
          style={styles.addPaymentBtn}
          onPress={() =>
            router.push({ pathname: "/payments/create", params: { eventId: id, eventTitle: event.title, eventTotal: String(event.totalAmount ?? 0), totalPaid: String(totalPaid) } })
          }
        >
          <Feather name="plus" size={16} color={Colors.dark} />
          <Text style={styles.addPaymentText}>Registrar Pago</Text>
        </Pressable>
      </View>

      {/* Pending payments (admin only) */}
      {isAdmin && pendingPayments.length > 0 ? (
        <View style={[styles.card, { borderWidth: 1, borderColor: Colors.warning + "55" }]}>
          <View style={styles.pendingHeader}>
            <Feather name="clock" size={15} color={Colors.warning} />
            <Text style={[styles.cardTitle, { color: Colors.warning, marginBottom: 0 }]}>
              Pagos Pendientes de Aprobación ({pendingPayments.length})
            </Text>
          </View>
          {pendingPayments.map((p: any) => (
            <View key={p.id} style={styles.pendingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentType}>{TYPE_LABELS[p.type] ?? p.type}</Text>
                <Text style={styles.paymentMeta}>{p.date} · {METHOD_LABELS[p.method] ?? p.method}</Text>
                {p.notes ? <Text style={styles.paymentMeta}>{p.notes}</Text> : null}
              </View>
              <View style={styles.pendingAmountCol}>
                <Text style={[styles.paymentAmount, { color: Colors.warning }]}>
                  ${p.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </Text>
                <View style={styles.pendingActions}>
                  <Pressable
                    style={styles.approveBtn}
                    onPress={() => handleApprovePayment(p.id)}
                  >
                    <Feather name="check" size={14} color={Colors.dark} />
                    <Text style={styles.approveBtnText}>Aprobar</Text>
                  </Pressable>
                  <Pressable
                    style={styles.rejectBtn}
                    onPress={() => handleRejectPayment(p.id)}
                  >
                    <Feather name="x" size={14} color={Colors.error} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Approved payment list */}
      {approvedPayments.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Historial de Pagos</Text>
          {approvedPayments.map((p: any) => (
            <Pressable
              key={p.id}
              style={styles.paymentRow}
              onLongPress={() => isAdmin && handleDeletePayment(p.id)}
            >
              <View>
                <Text style={styles.paymentType}>{TYPE_LABELS[p.type] ?? p.type}</Text>
                <Text style={styles.paymentMeta}>{p.date} · {METHOD_LABELS[p.method] ?? p.method}</Text>
              </View>
              <Text style={[styles.paymentAmount, { color: Colors.success }]}>
                +${p.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </Text>
            </Pressable>
          ))}
          {isAdmin && <Text style={styles.longPressHint}>Mantén presionado para eliminar un pago</Text>}
        </View>
      ) : null}

      {/* Rejected payments */}
      {rejectedPayments.length > 0 ? (
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: Colors.error }]}>Pagos Rechazados</Text>
          {rejectedPayments.map((p: any) => (
            <View key={p.id} style={styles.paymentRow}>
              <View>
                <Text style={[styles.paymentType, { color: Colors.textSecondary }]}>{TYPE_LABELS[p.type] ?? p.type}</Text>
                <Text style={styles.paymentMeta}>{p.date} · {METHOD_LABELS[p.method] ?? p.method}</Text>
              </View>
              <Text style={[styles.paymentAmount, { color: Colors.error }]}>
                ${p.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.dark },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 16, color: Colors.textSecondary },
  statusBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1 },
  eventType: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginTop: 12,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.textSecondary,
    marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  infoIcon: { marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
  infoValue: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.textPrimary, marginTop: 1 },
  musicianRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  musicianAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary + "33", alignItems: "center", justifyContent: "center",
  },
  musicianAvatarText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.primary },
  musicianInfo: { flex: 1 },
  musicianName: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textPrimary },
  musicianInstruments: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  musicianFee: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.success },
  financeRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  financeItem: { flex: 1, alignItems: "center" },
  financeDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  financeLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
  financeAmount: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.textPrimary },
  progressBg: { height: 6, backgroundColor: Colors.border, borderRadius: 3, marginBottom: 14 },
  progressFill: { height: 6, backgroundColor: Colors.success, borderRadius: 3 },
  addPaymentBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12,
  },
  addPaymentText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.dark },
  pendingHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  pendingRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pendingAmountCol: { alignItems: "flex-end", gap: 8 },
  pendingActions: { flexDirection: "row", gap: 6 },
  approveBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  approveBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.dark },
  rejectBtn: {
    alignItems: "center", justifyContent: "center",
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Colors.error + "22", borderWidth: 1, borderColor: Colors.error + "44",
  },
  paymentRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  paymentType: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textPrimary },
  paymentMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  paymentAmount: { fontFamily: "Inter_700Bold", fontSize: 15 },
  longPressHint: {
    fontFamily: "Inter_400Regular", fontSize: 11,
    color: Colors.textSecondary, textAlign: "center", marginTop: 10,
  },
});
