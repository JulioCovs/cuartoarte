import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator, Dimensions, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const { width } = Dimensions.get("window");
const BAR_MAX_HEIGHT = 100;
const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

function useSummary() {
  return useQuery({
    queryKey: ["reportSummary"],
    queryFn: () => fetch(`${BASE_URL}/api/reports/summary`).then(r => r.json()),
    refetchInterval: 30000,
  });
}

function useProfit(period: string) {
  return useQuery({
    queryKey: ["profitReport", period],
    queryFn: () => fetch(`${BASE_URL}/api/reports/profit?groupBy=${period}`).then(r => r.json()),
    refetchInterval: 30000,
  });
}

function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: () => fetch(`${BASE_URL}/api/expenses`).then(r => r.json()),
    refetchInterval: 30000,
  });
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n ?? 0);
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View style={[styles.statCard, color ? { borderColor: color + "40" } : {}]}>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

function ProfitChart({ data }: { data: { label: string; income: number; expenses: number; profit: number }[] }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expenses]), 1);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10, paddingVertical: 8, paddingHorizontal: 4 }}>
        {data.map((d) => {
          const incomeH = Math.max(4, (d.income / maxVal) * BAR_MAX_HEIGHT);
          const expH = Math.max(4, (d.expenses / maxVal) * BAR_MAX_HEIGHT);
          return (
            <View key={d.label} style={styles.chartBar}>
              <View style={{ height: BAR_MAX_HEIGHT, justifyContent: "flex-end", flexDirection: "row", gap: 3, alignItems: "flex-end" }}>
                <View style={{ width: 12, height: incomeH, backgroundColor: Colors.primary, borderRadius: 4 }} />
                <View style={{ width: 12, height: expH, backgroundColor: "#E53935", borderRadius: 4 }} />
              </View>
              <Text style={styles.chartLabel}>{d.label.slice(2, 7)}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const CAT_LABELS: Record<string, string> = {
  musician_payment: "Músicos",
  venue: "Lugar",
  equipment: "Equipo",
  transport: "Transporte",
  otro: "Otro",
};

export default function ReportsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isAdmin = user?.role === "admin";
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");
  const { data: summary, isLoading: loadingSum, refetch } = useSummary();
  const { data: profit, isLoading: loadingProfit } = useProfit(period);
  const { data: expenses = [], isLoading: loadingExp } = useExpenses();

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      refreshControl={<RefreshControl refreshing={loadingSum} onRefresh={refetch} tintColor={Colors.primary} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Reportes Financieros</Text>
          <Text style={styles.subtitle}>Resumen de rendimiento</Text>
        </View>
        {isAdmin && (
          <Pressable style={styles.addExpenseBtn} onPress={() => router.push("/expenses/create")}>
            <Feather name="minus-circle" size={14} color={Colors.textPrimary} />
            <Text style={styles.addExpenseBtnText}>Gasto</Text>
          </Pressable>
        )}
      </View>

      {/* KPI grid */}
      <View style={styles.statsGrid}>
        <StatCard label="Ingresos totales" value={fmt(summary?.totalIncome)} color={Colors.primary} />
        <StatCard label="Gastos totales" value={fmt(summary?.totalExpenses)} color="#E53935" />
        <StatCard
          label="Utilidad neta"
          value={fmt(summary?.totalProfit)}
          color={(summary?.totalProfit ?? 0) >= 0 ? "#4CAF50" : "#E53935"}
        />
        <StatCard label="Cobros pendientes" value={fmt(summary?.pendingPayments)} color="#F5A623" />
        <StatCard label="Eventos" value={String(summary?.totalEvents ?? 0)} />
        <StatCard
          label="Este mes"
          value={`${summary?.eventsThisMonth ?? 0} ev.`}
          sub={fmt(summary?.incomeThisMonth)}
          color={Colors.primary}
        />
      </View>

      {/* Income vs Expenses chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ingresos vs Gastos</Text>
          <View style={styles.periodRow}>
            {(["day", "week", "month"] as const).map(p => (
              <Pressable key={p} style={[styles.periodBtn, period === p && styles.periodBtnActive]} onPress={() => setPeriod(p)}>
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                  {p === "day" ? "Día" : p === "week" ? "Sem" : "Mes"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {loadingProfit ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : profit?.data?.length > 0 ? (
          <>
            <ProfitChart data={profit.data} />
            <View style={styles.legend}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.legendText}>Ingresos: {fmt(profit.totalIncome)}</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: "#E53935" }]} />
                <Text style={styles.legendText}>Gastos: {fmt(profit.totalExpenses)}</Text>
              </View>
              <View style={[styles.legendRow, { marginTop: 6 }]}>
                <Feather name="trending-up" size={13} color={(profit.totalProfit ?? 0) >= 0 ? "#4CAF50" : "#E53935"} />
                <Text style={[styles.legendText, {
                  color: (profit.totalProfit ?? 0) >= 0 ? "#4CAF50" : "#E53935",
                  fontFamily: "Inter_600SemiBold",
                }]}>
                  Utilidad: {fmt(profit.totalProfit)}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>No hay datos para el período</Text>
        )}
      </View>

      {/* Recent expenses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gastos Recientes</Text>
          {isAdmin && (
            <Pressable onPress={() => router.push("/expenses/create")}>
              <Feather name="plus" size={18} color={Colors.primary} />
            </Pressable>
          )}
        </View>

        {loadingExp ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (expenses as any[]).length === 0 ? (
          <Text style={styles.emptyText}>No hay gastos registrados</Text>
        ) : (
          (expenses as any[]).slice(0, 8).map((e: any) => (
            <View key={e.id} style={styles.expenseRow}>
              <View style={styles.expenseCatIcon}>
                <Feather name="arrow-down-circle" size={15} color="#E53935" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.expenseDesc} numberOfLines={1}>{e.description}</Text>
                <Text style={styles.expenseMeta}>{CAT_LABELS[e.category] ?? e.category} · {e.date}</Text>
              </View>
              <Text style={styles.expenseAmount}>-{fmt(parseFloat(e.amount))}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.textPrimary },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addExpenseBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#E53935", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  addExpenseBtnText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textPrimary },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 10 },
  statCard: {
    flex: 1, minWidth: (width - 56) / 2, backgroundColor: Colors.surface,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 4,
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.textPrimary },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  statSub: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.primary },
  section: {
    backgroundColor: Colors.surface, borderRadius: 16,
    marginHorizontal: 14, marginBottom: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.textPrimary },
  periodRow: { flexDirection: "row", gap: 6 },
  periodBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  periodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary },
  periodTextActive: { color: Colors.dark },
  chartBar: { alignItems: "center", gap: 6, minWidth: 36 },
  chartLabel: { fontFamily: "Inter_400Regular", fontSize: 9, color: Colors.textSecondary },
  legend: { gap: 5, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, textAlign: "center", paddingVertical: 12 },
  expenseRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: Colors.border + "50",
  },
  expenseCatIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "#E5393520", alignItems: "center", justifyContent: "center",
  },
  expenseDesc: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textPrimary },
  expenseMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  expenseAmount: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#E53935" },
});
