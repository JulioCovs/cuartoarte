import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import Colors from "@/constants/colors";

const CATEGORIES = [
  { key: "musician_payment", label: "Pago a Músico", icon: "music" },
  { key: "venue", label: "Lugar / Renta", icon: "map-pin" },
  { key: "equipment", label: "Equipo", icon: "speaker" },
  { key: "transport", label: "Transporte", icon: "truck" },
  { key: "otro", label: "Otro", icon: "more-horizontal" },
];

export default function CreateExpenseScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const baseUrl = domain ? `https://${domain}` : "";

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("musician_payment");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!description.trim() || !amount || !date) {
      Alert.alert("Error", "Completa los campos requeridos");
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) { Alert.alert("Error", "El monto debe ser mayor a 0"); return; }

    setSaving(true);
    try {
      const res = await fetch(`${baseUrl}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), amount: parsed, category, date, notes: notes.trim() || null }),
      });
      if (!res.ok) throw new Error("Error al registrar gasto");
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["profitReport"] });
      router.back();
    } catch {
      Alert.alert("Error", "No se pudo registrar el gasto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
        {/* Amount */}
        <View style={styles.amountRow}>
          <Text style={styles.amountSymbol}>-$</Text>
          <TextInput
            style={styles.amountInput} value={amount} onChangeText={setAmount}
            placeholder="0.00" placeholderTextColor={Colors.border} keyboardType="decimal-pad" autoFocus
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((c) => (
              <Pressable key={c.key} style={[styles.catBtn, category === c.key && styles.catBtnActive]} onPress={() => setCategory(c.key)}>
                <Feather name={c.icon as any} size={17} color={category === c.key ? Colors.dark : Colors.textSecondary} />
                <Text style={[styles.catText, category === c.key && styles.catTextActive]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Descripción *</Text>
          <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Ej: Pago honorarios Carlos Martínez" placeholderTextColor={Colors.textSecondary} />
        </View>

        {/* Date */}
        <View style={styles.field}>
          <Text style={styles.label}>Fecha</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textSecondary} />
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={styles.label}>Notas</Text>
          <TextInput style={[styles.input, { height: 70, textAlignVertical: "top" }]} value={notes} onChangeText={setNotes} placeholder="Información adicional..." placeholderTextColor={Colors.textSecondary} multiline />
        </View>

        <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.dark} /> : (
            <><Feather name="check" size={18} color={Colors.dark} /><Text style={styles.saveBtnText}>Registrar Gasto</Text></>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  amountRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 24, gap: 4 },
  amountSymbol: { fontFamily: "Inter_700Bold", fontSize: 36, color: "#E53935" },
  amountInput: { fontFamily: "Inter_700Bold", fontSize: 48, color: Colors.textPrimary, minWidth: 160 },
  field: { marginBottom: 20 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catBtn: { alignItems: "center", gap: 4, padding: 12, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, minWidth: 90, flex: 1 },
  catBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.textSecondary, textAlign: "center" },
  catTextActive: { color: Colors.dark },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#E53935", borderRadius: 14, paddingVertical: 16 },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.textPrimary },
});
