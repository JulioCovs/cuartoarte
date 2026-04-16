import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { useCreatePayment, useGetEvents } from "@workspace/api-client-react";
import Colors from "@/constants/colors";

const PAYMENT_TYPES = ["anticipo", "pago_parcial", "pago_total"];
const PAYMENT_METHODS = ["efectivo", "tarjeta", "transferencia", "cheque", "otro"];
const TYPE_LABELS: Record<string, string> = { anticipo: "Anticipo", pago_parcial: "Pago Parcial", pago_total: "Pago Total" };
const METHOD_LABELS: Record<string, string> = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia", cheque: "Cheque", otro: "Otro" };
const METHOD_ICONS: Record<string, string> = { efectivo: "dollar-sign", tarjeta: "credit-card", transferencia: "send", cheque: "file-text", otro: "help-circle" };

export default function CreatePaymentScreen() {
  const { eventId: prefillEventId, eventTitle: prefillTitle } = useLocalSearchParams<{ eventId?: string; eventTitle?: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: events } = useGetEvents({});
  const createPayment = useCreatePayment();

  const [selectedEventId, setSelectedEventId] = useState<number | null>(prefillEventId ? parseInt(prefillEventId) : null);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<string>("anticipo");
  const [method, setMethod] = useState<string>("efectivo");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedEventId || !amount || !date) {
      Alert.alert("Error", "Selecciona un evento, ingresa el monto y la fecha"); return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Error", "El monto debe ser un número mayor a 0"); return;
    }
    setSaving(true);
    try {
      await createPayment.mutateAsync({ data: { eventId: selectedEventId, amount: parsedAmount, type: type as any, method: method as any, date, notes: notes.trim() || null } });
      queryClient.invalidateQueries({ queryKey: ["getPayments"] });
      queryClient.invalidateQueries({ queryKey: ["reportSummary"] });
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "No se pudo registrar el pago");
    } finally {
      setSaving(false);
    }
  };

  const activeEvents = (events ?? []).filter(e => e.status !== "cancelado");

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
              {activeEvents.map(e => (
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
            <><Feather name="check" size={18} color={Colors.dark} /><Text style={styles.saveBtnText}>Registrar Pago</Text></>
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
  field: { marginBottom: 20 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  selectedEvent: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.primary },
  selectedEventText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.primary, flex: 1 },
  eventList: { maxHeight: 180, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  eventOption: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  eventOptionActive: { backgroundColor: Colors.primary },
  eventOptionTitle: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textPrimary },
  eventOptionMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
  optionRow: { flexDirection: "row", gap: 8 },
  optionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  optionBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary },
  optionTextActive: { color: Colors.dark },
  methodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  methodBtn: { width: "30%", flexGrow: 1, alignItems: "center", gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  methodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary },
  methodTextActive: { color: Colors.dark },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16 },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.dark },
});
