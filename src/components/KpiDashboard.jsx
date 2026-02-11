// src/components/KpiDashboard.jsx
"use client";

import { Card, Chip } from "@heroui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, parseISO, isSameDay } from "date-fns";
import { Package, Truck, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function KpiDashboard({ shipments }) {
  if (!shipments || shipments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No shipment data available for KPIs.
      </div>
    );
  }

  // ── Calculations ────────────────────────────────────────────────────────

  const totalShipments = shipments.length;

  // Status counts
  const statusCounts = shipments.reduce(
    (acc, s) => {
      const key = s.missed_delivery ? "Missed" : s.status || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { Received: 0, "Not Received": 0, Delay: 0, TBD: 0, Missed: 0 }
  );

  const receivedRate = Math.round((statusCounts.Received / totalShipments) * 100) || 0;
  const missedRate = Math.round((statusCounts.Missed / totalShipments) * 100) || 0;
  const onTimeRate = Math.round(((statusCounts.Received + statusCounts["Not Received"]) / totalShipments) * 100) || 0;

  // OTIF (On-Time In-Full) – assuming "Received" + no missed = perfect
  const perfectShipments = shipments.filter(
    (s) => s.status === "Received" && !s.missed_delivery
  ).length;
  const otif = Math.round((perfectShipments / totalShipments) * 100) || 0;

  // Last 7 days trend (simple bar data)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return format(d, "MMM d");
  }).reverse();

  const dailyCounts = last7Days.map((label) => {
    const date = parseISO(label); // rough – adjust if needed
    const count = shipments.filter((s) => {
      const ds = s.delivery_date || s.actual_delivery_date;
      return ds && isSameDay(parseISO(ds), date);
    }).length;
    return { date: label, shipments: count };
  });

  // Pie chart data for status distribution
  const pieData = [
    { name: "Received", value: statusCounts.Received, color: "#198754" },
    { name: "Not Received", value: statusCounts["Not Received"], color: "#0088F6" },
    { name: "Delay", value: statusCounts.Delay, color: "#fd7e14" },
    { name: "TBD", value: statusCounts.TBD, color: "#6f42c1" },
    { name: "Missed", value: statusCounts.Missed, color: "#dc3545" },
  ].filter((d) => d.value > 0);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
 
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
        <Card className="p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Shipments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalShipments}</p>
            </div>
            <Truck className="h-10 w-10 text-blue-500 opacity-80" />
          </div>
        </Card>

        <Card className="p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">OTIF Rate</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{otif}%</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-500 opacity-80" />
          </div>
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${otif}%` }} />
          </div>
        </Card>

        <Card className="p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">On-Time Rate</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{onTimeRate}%</p>
            </div>
            <Clock className="h-10 w-10 text-blue-500 opacity-80" />
          </div>
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${onTimeRate}%` }} />
          </div>
        </Card>

        <Card className="p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Missed Deliveries</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{statusCounts.Missed || 0}</p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-500 opacity-80" />
          </div>
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${missedRate}%` }} />
          </div>
        </Card>
      </div>

  );
}