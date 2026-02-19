// WeeklyShipmentsByStatusChart.jsx
import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@heroui/react';

import { useAppContext } from '../context/DataContext'; // adjust path if needed

import { getISOWeek, getYear, format, startOfWeek, isValid } from 'date-fns';

// Colors matching your design
const statusColors = {
  Received: '#198754',
  Delay: '#fd7e14',
  TBD: '#6f42c1',
  Missed: '#dc3545',
  Scheduled: '#0088F6',
};

function WeeklyShipmentsByStatusChart() {
  const { shipments } = useAppContext();

  const weeklyData = useMemo(() => {
    const weekMap = {};

    shipments.forEach((shipment) => {
      let dateStr = shipment.actual_delivery_date || shipment.delivery_date;
      if (!dateStr) return;

      const date = new Date(dateStr);
      if (!isValid(date)) return;

      const year = getYear(date);
      const week = getISOWeek(date);
      const key = `${year}-W${String(week).padStart(2, '0')}`;

      let status;
      if (shipment.actual_delivery_date) {
        status = shipment.status || 'Scheduled';
      } else {
        status = 'Scheduled';
      }

      if (shipment.missed_delivery === true) {
        status = 'Missed';
      }

      if (!weekMap[key]) {
        weekMap[key] = {
          week: key,
          total: 0,
          year,
          statuses: new Set(),
        };
      }

      weekMap[key][status] = (weekMap[key][status] || 0) + 1;
      weekMap[key].total += 1;
      weekMap[key].statuses.add(status);
    });

    return Object.values(weekMap)
      .sort((a, b) => a.week.localeCompare(b.week))
      .map((entry) => ({
        ...entry,
        weeklabel: format(
          startOfWeek(
            new Date(Number(entry.week.split('-')[0]), 0, 1 + (Number(entry.week.split('-W')[1]) - 1) * 7),
            { weekStartsOn: 1 }
          ),
          'MMM d, yyyy'
        ),
        statusCount: entry.statuses.size,
      }));
  }, [shipments]);

  const statusKeys = useMemo(() => {
    const all = new Set();
    weeklyData.forEach((w) => {
      Object.keys(w).forEach((k) => {
        if (!['week', 'total', 'weeklabel', 'year', 'statuses', 'statusCount'].includes(k)) {
          all.add(k);
        }
      });
    });

    const preferredOrder = ['Received', 'Missed', 'Delay', 'TBD', 'Scheduled'];
    return Array.from(all).sort((a, b) => {
      const ia = preferredOrder.indexOf(a);
      const ib = preferredOrder.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [weeklyData]);

  // Custom shape for rounded corners only on top (or single bar)
  const CustomBarShape = (props) => {
    const { fill, x, y, width, height, payload } = props;
    const statusCount = payload?.statusCount || 1;

    // Determine if this bar is the top of its stack for this week
    const isTopOfStack = props.index === statusKeys.length - 1;

    const radius = statusCount === 1 || isTopOfStack ? [4, 4, 0, 0] : [0, 0, 0, 0];

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={radius[0]}
        ry={radius[1]}
        clipPath={`inset(0 round ${radius[0]}px ${radius[1]}px ${radius[2]}px ${radius[3]}px)`}
      />
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;

    return (
      <div className="
        bg-white dark:bg-gray-950 
        border border-gray-200 dark:border-gray-800 
        rounded-lg shadow-md 
        px-4 py-3 text-sm 
        min-w-[180px]
      ">
        <p className="font-medium text-gray-900 dark:text-gray-100 mb-2 border-b pb-1.5 border-gray-200 dark:border-gray-800">
          {data.weeklabel}
        </p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-6 py-0.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-gray-600 dark:text-gray-400">{p.name}</span>
            </div>
            <span className="font-medium">{p.value}</span>
          </div>
        ))}
        <div className="flex justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-800 font-medium">
          <span>Total</span>
          <span>{data.total}</span>
        </div>
      </div>
    );
  };

  const CustomLabel = (props) => {
    const { x, y, width, height, value } = props;
    if (!value || value < 1) return null;
    const isLightBg = ['#fd7e14', '#6f42c1'].includes(props.fill);
    return (
      <text
        x={x + width / 2}
        y={y + height / 2 + 1}
        fill={isLightBg ? '#000000' : '#ffffff'}
        fontSize={11}
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="middle"
        pointerEvents="none"
      >
        {value}
      </text>
    );
  };

  if (weeklyData.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No shipments with delivery or actual delivery dates.
      </Card>
    );
  }

  return (
    <div className='p-10 pt-0 bg-white'>
    <Card className="border border-border bg-card text-card-foreground shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          Weekly Shipments by Status
        </CardTitle>
        <CardDescription>
          Number of Shipments based on Actual Delivery Date (Or Delivery Date when there is no Actual Delivery Date)  
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyData}
              margin={{ top: 24, right: 16, left: -8, bottom: 40 }}
              barCategoryGap={0}
            >
              <CartesianGrid 
                vertical={false} 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.4} 
              />

              <XAxis
                dataKey="weeklabel"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                dy={10}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                width={32}
              />

              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: 'rgba(59, 130, 246, 0.15)' }}
              />

              <Legend 
                wrapperStyle={{ 
                  fontSize: '13px', 
                  paddingTop: '8px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '16px'
                }} 
              />

{statusKeys.map((status, idx) => (
  <Bar
  key={status}
  dataKey={status}
  stackId="a"
  fill={statusColors[status] || statusColors.Scheduled}
  shape={(props) => {
    const { x, y, width, height, fill, payload, index: barIdx } = props;
    const count = payload?.statusCount ?? 1;
  
    let radiusArr = [0, 0, 0, 0];
  
    // Your existing logic (simplified a bit)
    if (count === 1) {
      radiusArr = [4, 4, 0, 0];
    } else if (count > 1) {
      // Top bar of the stack gets rounded top corners
      if (barIdx === statusKeys.length - 1) {
        radiusArr = [4, 4, 0, 0];
      }
    }
  
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={radiusArr[0]}
        ry={radiusArr[1]}
        // Optional: better rounding control
        // clipPath={`inset(0 round ${radiusArr[0]}px ${radiusArr[1]}px ${radiusArr[2]}px ${radiusArr[3]}px)`}
      />
    );
  }}
  maxBarSize={60}
  
>
<LabelList 
                    dataKey={status} 
                    position="top" 
                    content={<CustomLabel />} 
                  />
                </Bar>
))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}

export default WeeklyShipmentsByStatusChart;