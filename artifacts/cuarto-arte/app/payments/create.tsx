import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { useCreatePayment, useGetEvents } from "@workspace/api-client-react";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const PAYMENT_TYPES = ["anticipo", "pago_parcial", "pago_total"];
const PAYMENT_METHODS = ["efectivo", "tarjeta", "transferencia", "cheque", "otro"];
const TYPE_LABELS: Record<string, string> = { anticipo: "Anticipo", pago_parcial: "Pago Parcial", pago_total: "Pago Total" };
const METHOD_LABELS: Record<string, string> = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia", cheque: "Cheque", otro: "Otro" };
const METHOD_ICONS: Record<string, string> = { efectivo: "dollar-sign", tarjeta: "credit-card", transferencia: "send", cheque: "file-text", otro: "help-circle" };

export default function CreatePaymentScreen() {
  const {
    eventId: prefillEventId,
    eventTitle: prefillTitle,
    eventTotal: prefillTotal,
    totalPaid: prefillTotalPaid,
  } = useLocalSearchParams<{
    eventId?: string;
    eventTitle?: string;
    eventTotal?: string;
    totalPaid?: string;
  }>();

  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isClient = user?.role === "client";

  const { data: events } = useGetEvents({});
  const createPayment = useCreatePayment();

  const [selectedEventId, setSelectedEventId] = useState<number | null>(prefillEventId ? parseInt(prefillEventId) : null);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<string>("anticipo");
  const [method, setMethod] = useState<string>("efectivo");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Remaining balance based on passed params or event data
  const eventTotal = prefillTotal ? parseFloat(prefillTotal) : 0;
  const alreadyPaid = prefillTotalPaid ? parseFloat(prefillTotalPaid) : 0;
  const remaining = Math.max(0, eventTotal - alreadyPaid);

  // Auto-fill amount when "pago total" is selected
  useEffect(() => {
    if (type === "pago_total" && remaining > 0) {
      setAmount(remaining.toFixed(2));
    }
  }, [type, remaining]);

  const handleSave = async () => {
    if (!selectedEventId || !amount || !date) {
      Alert.alert("Error", "Selecciona un evento, ingresa el monto y la fecha"); return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Error", "El monto debe ser un número mayor a 0"); return;
    }

    // Warn client if they're paying more than remaining
    if (isClient && remaining > 0 && parsedAmount > remaining) {
      Alert.alert("Aviso", `El monto ($${parsedAmount.toLocaleString("es-MX")}) supera el saldo pendiente ($${remaining.toLocaleString("es-MX")}). ¿Continuar?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Continuar", onPress: () => submitPayment(parsedAmount) },
      ]);
      return;
    }

    await submitPayment(parsedAmount);
  };

  const submitPayment = async (parsedAmount: number) => {
    setSaving(true);
    try {
      await createPayment.mutateAsync({
        data: {
          eventId: selectedEventId!,
          amount: parsedAmount,
          type: type as any,
          method: method as any,
          date,
          notes: notes.trim() || null,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["getPayments"] });
      queryClient.invalidateQueries({ queryKey: ["reportSummary"] });

      // Inform client their cash payment is pending admin approval
      if (isClient && method === "efectivo") {
        Alert.alert(
          "Pago Registrado",
          "Tu pago en efectivo fue registrado y está pendiente de confirmación por el administrador. Te notificaremos cuando sea aprobado.",
          [{ text: "Entendido", onPress: () => router.back() }]
        );
      } else {
        router.back();
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "No se pudo registrar el pago");
    } finally {
      setSaving(false);
    }
  };

  const activeEvents = (events ?? []).filter((e: any) => e.status !== "cancelado");

  const isCashPendingApproval = isClient && method === "efectivo";

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16, paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom + 16) + 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountSymbol}>$</Text>
          <TextInput
            style={styles.amountInput} value={amount} onChangeText={setAmount}
            placeholder="0.00" placeholderTextColor={Colors.border}
            keyboardType="decimal-pad" autoFocus
          />
        </View>

        {/* Remaining balance hint */}
        {prefillEventId && eventTotal > 0 ? (
          <View style={styles.remainingBadge}>
            <Feather name="info" size={13} color={remaining > 0 ? Colors.warning : Colors.success} />
            <Text style={[styles.remainingText, { color: remaining > 0 ? Colors.warning : Colors.success }]}>
              {remaining > 0
                ? `Saldo pendiente: $${remaining.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                : "Evento completamente pagado"}
            </Text>
          </View>
        ) : null}

        {/* Event selector */}
        <View style={styles.field}>
          <Text style={styles.label}>Evento *</Text>
          {prefillEventId && prefillTitle ? (
            <View style={styles.selectedEvent}>
              <Feather name="calendar" size={15} color={Colors.primary} />
              <Text style={styles.selectedEventText}>{prefillTitle}</Text>
            </View>
          ) : (
            <ScrollView style={styles.eventList} nestedScrollEnabled showsVerticalScrollIndicator>
              {activeEvents.map((e: any) => (
                <Pressable
                  key={e.id}
                  style={[styles.eventOption, selectedEventId === e.id && styles.eventOptionActive]}
                  onPress={() => setSelectedEventId(e.id)}
                >
                  <Feather name="calendar" size={14} color={selectedEventId === e.id ? Colors.dark : Colors.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.eventOptionTitle, selectedEventId === e.id && { color: Colors.dark }]} numberOfLines={1}>{e.title}</Text>
                    <Text style={[styles.eventOptionMeta, selectedEventId === e.id && { color: Colors.dark + "99" }]}>{e.date}</Text>
                  </View>
                </Pressable>
              ))}
              {activeEvents.length === 0 && <Text style={[styles.eventOptionMeta, { padding: 12 }]}>No hay eventos disponibles</Text>}
            </ScrollView>
          )}
        </View>

        {/* Type */}
        <View style={styles.field}>
          <Text style={styles.label}>Tipo de pago</Text>
          <View style={styles.optionRow}>
            {PAYMENT_TYPES.map(t => (
              <Pressable key={t} style={[styles.optionBtn, type === t && styles.optionBtnActive]} onPress={() => setType(t)}>
                <Text style={[styles.optionText, type === t && styles.optionTextActive]}>{TYPE_LABELS[t]}</Text>
              </Pressable>
            ))}
          </View>
          {type === "pago_total" && remaining > 0 && (
            <View style={styles.autoFillBadge}>
              <Feather name="zap" size={12} color={Colors.primary} />
              <Text style={styles.autoFillText}>Monto llenado automáticamente con el saldo pendiente</Text>
            </View>
          )}
          {type === "anticipo" && (
            <Text style={styles.hintText}>Ingresa el monto del anticipo manualmente</Text>
          )}
        </View>

        {/* Method */}
        <View style={styles.field}>
          <Text style={styles.label}>Forma de pago</Text>
          <View style={styles.methodGrid}>
            {PAYMENT_METHODS.map(m => (
              <Pressable key={m} style={[styles.methodBtn, method === m && styles.methodBtnActive]} onPress={() => setMethod(m)}>
                <Feather name={METHOD_ICONS[m] as any} size={20} color={method === m ? Colors.dark : Colors.textSecondary} />
                <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{METHOD_LABELS[m]}</Text>
              </Pressable>
            ))}
          </View>

          {/* Warning for client cash payments */}
          {isCashPendingApproval && (
            <View style={styles.cashWarning}>
              <Feather name="clock" size={14} color={Colors.warning} />
              <Text style={styles.cashWarningText}>
                Los pagos en efectivo requieren confirmación del administrador antes de reflejarse en tu saldo.
              </Text>
            </View>
          )}
        </View>

        {/* Date */}
        <View style={styles.field}>
          <Text style={styles.label}>Fecha</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textSecondary} />
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={styles.label}>Notas</Text>
          <TextInput style={[styles.input, { height: 70, textAlignVertical: "top" }]} value={notes} onChangeText={setNotes} placeholder="Notas adicionales..." placeholderTextColor={Colors.textSecondary} multiline />
        </View>

        <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.dark} /> : (
            <>
              <Feather name="check" size={18} color={Colors.dark} />
              <Text style={styles.saveBtnText}>
                {isCashPendingApproval ? "Enviar para Aprobación" : "Registrar Pago"}
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  amountContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 24, gap: 8 },
  amountSymbol: { fontFamily: "Inter_700Bold", fontSize: 36, color: Colors.primary },
  amountInput: { fontFamily: "Inter_700Bold", fontSize: 48, color: Colors.textPrimary, minWidth: 160 },
  remainingBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.surface, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
  },
  remainingText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  field: { marginBottom: 20 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  selectedEvent: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.primary,
  },
  selectedEventText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.primary, flex: 1 },
  eventList: { maxHeight: 180, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  eventOption: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  eventOptionActive: { backgroundColor: Colors.primary },
  eventOptionTitle: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textPrimary },
  eventOptionMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
  optionRow: { flexDirection: "row", gap: 8 },
  optionBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: "center",
  },
  optionBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary },
  optionTextActive: { color: Colors.dark },
  autoFillBadge: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8,
    backgroundColor: Colors.primary + "22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  autoFillText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.primary, flex: 1 },
  hintText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 6 },
  methodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  methodBtn: {
    width: "30%", flexGrow: 1, alignItems: "center", gap: 6, paddingVertical: 12,
    borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  methodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary },
  methodTextActive: { color: Colors.dark },
  cashWarning: {
    flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 10,
    backgroundColor: Colors.warning + "18", borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: Colors.warning + "44",
  },
  cashWarningText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.warning, flex: 1, lineHeight: 18 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
  },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.dark },
});
