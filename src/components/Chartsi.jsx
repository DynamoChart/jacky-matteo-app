import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Card } from '@heroui/react';   // ← HeroUI v3 Card (main)
import { Package, CalendarDays } from 'lucide-react'; // optional icons like your example

// Adjust path to your context
import { useAppContext } from '../context/DataContext'; // ← CHANGE THIS PATH IF NEEDED

// Date-fns for weekly grouping (install if missing: npm i date-fns)
import { getISOWeek, getYear, format } from 'date-fns';

function Chartsi() {
  const { shipments } = useAppContext();

  // ────────────────────────────────────────────────
  // Metrics (On-Time proxy – add In-Full when you have actual_quantity)
  // ────────────────────────────────────────────────
  const metrics = useMemo(() => {
    let total = shipments.length;
    let goodCount = 0;
    let totalLbs = 0;
    const supplierSet = new Set();

    shipments.forEach((s) => {
      const sup = s.supplier?.name || 'Unknown';
      supplierSet.add(sup);

      const received = s.status === 'Received';
      const notMissed = s.missed_delivery !== true;
      let onTime = received;

      if (s.actual_delivery_date && s.delivery_date) {
        onTime = new Date(s.actual_delivery_date) <= new Date(s.delivery_date);
      }

      if (received && notMissed && onTime) goodCount++;

      s.items?.forEach((i) => (totalLbs += i.quantity || 0));
    });

    return {
      totalShipments: total,
      onTimeRate: total > 0 ? Math.round((goodCount / total) * 100) : 0,
      totalLbs: Math.round(totalLbs),
      uniqueSuppliers: supplierSet.size,
    };
  }, [shipments]);

  // Top 10 Suppliers by On-Time Rate
  const topSuppliers = useMemo(() => {
    const map = {};

    shipments.forEach((s) => {
      const name = s.supplier?.name?.trim() || 'Unknown Supplier';
      if (!map[name]) map[name] = { total: 0, good: 0 };
      map[name].total++;

      const received = s.status === 'Received';
      const notMissed = s.missed_delivery !== true;
      let onTime = received;
      if (s.actual_delivery_date && s.delivery_date) {
        onTime = new Date(s.actual_delivery_date) <= new Date(s.delivery_date);
      }

      if (received && notMissed && onTime) map[name].good++;
    });

    return Object.entries(map)
      .map(([supplier, { total, good }]) => ({
        supplier: supplier.length > 24 ? supplier.slice(0, 21) + '…' : supplier,
        fullName: supplier,
        rate: total > 0 ? Math.round((good / total) * 100) : 0,
        shipments: total,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 10);
  }, [shipments]);

  // Weekly Incoming Volume
  const weeklyIncoming = useMemo(() => {
    const weekMap = {};

    shipments.forEach((s) => {
      if (!s.actual_delivery_date) return;
      const d = new Date(s.actual_delivery_date);
      const year = getYear(d);
      const week = getISOWeek(d);
      const key = `${year}-W${String(week).padStart(2, '0')}`;

      if (!weekMap[key]) weekMap[key] = 0;
      s.items?.forEach((i) => (weekMap[key] += i.quantity || 0));
    });

    return Object.entries(weekMap)
      .map(([week, lbs]) => ({ week, lbs: Math.round(lbs) }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [shipments]);

  // Top 10 Items (prefer name if exists, fallback to description)
  const topItems = useMemo(() => {
    const map = {};

    shipments.forEach((s) => {
      s.items?.forEach((i) => {
        const key = i.name?.trim() || i.description?.trim() || 'Unknown Item';
        map[key] = (map[key] || 0) + (i.quantity || 0);
      });
    });

    return Object.entries(map)
      .map(([name, qty]) => ({
        name: name.length > 32 ? name.slice(0, 29) + '…' : name,
        qty: Math.round(qty),
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }, [shipments]);

  // Clean tooltip (minimal, shadcn/heroui style)
  const CleanTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm px-4 py-3 text-sm">
        <p className="font-medium text-gray-900 dark:text-white">
          {data.fullName || data.name || label}
        </p>
        {payload.map((p, i) => (
          <p key={i} className="flex items-center gap-2 mt-1">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">{p.name || p.dataKey}:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {p.value.toLocaleString()} {p.dataKey.includes('rate') ? '%' : 'lbs'}
            </span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-10 bg-gray-50/40 dark:bg-gray-950/40 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Supply Chain Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1.5">
          On-Time Delivery • Weekly Intake • Top Items
        </p>
      </div>

      {/* KPI Cards – HeroUI style */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl">
          <Card.Header className="pb-2">
            <Card.Title className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Shipments
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.totalShipments.toLocaleString()}
            </div>
          </Card.Content>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl">
          <Card.Header className="pb-2">
            <Card.Title className="text-sm font-medium text-gray-600 dark:text-gray-400">
              On-Time Rate (proxy)
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.onTimeRate}%
            </div>
          </Card.Content>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl">
          <Card.Header className="pb-2">
            <Card.Title className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Received Inventory
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.totalLbs.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">LBS</p>
          </Card.Content>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl">
          <Card.Header className="pb-2">
            <Card.Title className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Suppliers
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics.uniqueSuppliers}
            </div>
          </Card.Content>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Suppliers */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl">
          <Card.Header>
            <Card.Title>Top 10 Suppliers – On-Time Rate</Card.Title>
            <Card.Description>Percentage of shipments received on time</Card.Description>
          </Card.Header>
          <Card.Content className="pt-4 h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSuppliers} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb dark:#374151" vertical={false} />
                <XAxis
                  dataKey="supplier"
                  angle={-35}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
                <Tooltip content={<CleanTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        {/* Weekly Volume */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl">
          <Card.Header>
            <Card.Title>Weekly Received Volume</Card.Title>
            <Card.Description>Based on actual delivery dates</Card.Description>
          </Card.Header>
          <Card.Content className="pt-4 h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyIncoming} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb dark:#374151" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip content={<CleanTooltip />} />
                <Line
                  type="monotone"
                  dataKey="lbs"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>
      </div>

      {/* Top Items */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl">
        <Card.Header>
          <Card.Title>Top 10 Items by Quantity</Card.Title>
          <Card.Description>Total ordered quantity (LBS)</Card.Description>
        </Card.Header>
        <Card.Content className="pt-4 h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topItems}
              layout="vertical"
              margin={{ top: 20, right: 40, left: 180, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb dark:#374151" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 13 }} />
              <Tooltip content={<CleanTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Bar dataKey="qty" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </Card.Content>
      </Card>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-8">
        On-Time proxy calculation (In-Full pending actual_quantity data) • {shipments.length} shipments
      </p>
    </div>
  );
}

export default Chartsi;