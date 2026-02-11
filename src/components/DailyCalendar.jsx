// src/DailyCalendar.jsx
import { useDrop, useDrag } from "react-dnd";
import { format, parseISO, getHours, getMinutes, isSameDay } from "date-fns";
import { Chip } from "@heroui/react";

const ItemTypes = { SHIPMENT: "shipment" };

const hours = Array.from({ length: 15 }, (_, i) => 6 + i); // 06:00 to 20:00

export default function DailyCalendar({ day, shipments, canDrag, onUpdate }) {
  // Filter shipments for this exact day
  const dayShipments = shipments.filter(
    (s) => s.delivery_date && isSameDay(parseISO(s.delivery_date), day)
  );

  // ── Summary calculations ─────────────────────────────────────
  const total = dayShipments.length;

  const byStatus = {
    Received: dayShipments.filter((s) => s.status === "Received").length,
    "Not Received": dayShipments.filter((s) => s.status === "Not Received").length,
    Delay: dayShipments.filter((s) => s.status === "Delay").length,
    TBD: dayShipments.filter((s) => s.status === "TBD").length,
    Missed: dayShipments.filter((s) => s.missed_delivery).length,
  };

  // Top couriers
  const courierCounts = dayShipments.reduce((acc, s) => {
    const c = s.courier || "Unknown";
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const topCouriers = Object.entries(courierCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Top suppliers
  const supplierCounts = dayShipments.reduce((acc, s) => {
    const sup = s.supplier?.name || "Unknown";
    acc[sup] = (acc[sup] || 0) + 1;
    return acc;
  }, {});
  const topSuppliers = Object.entries(supplierCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Total items quantity
  const totalQuantity = dayShipments.reduce((sum, s) => {
    return (
      sum +
      (s.items || []).reduce((itemSum, item) => itemSum + (item.quantity || 0), 0)
    );
  }, 0);

  // Earliest & latest time
  const times = dayShipments
    .map((s) => parseISO(s.delivery_date))
    .filter(Boolean);
  const earliest = times.length ? new Date(Math.min(...times)) : null;
  const latest = times.length ? new Date(Math.max(...times)) : null;

  return (
    <div className="flex h-full border border-gray-200 rounded-xl shadow-sm bg-white overflow-hidden">
      {/* Main timeline – left 50% */}
      <div className="w-1/2 overflow-hidden">
        {/* Header: Date */}
        <div className="sticky top-0 z-10 bg-gray-50 border-b h-9 flex items-center px-4 text-sm font-semibold text-gray-800">
          {format(day, "EEEE, MMMM d, yyyy")}
        </div>

        {/* Hours rows */}
        {hours.map((hour) => {
          const hourShipments = dayShipments.filter(
            (s) => getHours(parseISO(s.delivery_date)) === hour
          );

          const [{ isOver }, drop] = useDrop(() => ({
            accept: ItemTypes.SHIPMENT,
            drop: (item) => {
              const original = parseISO(item.delivery_date);
              const newDate = new Date(day); // day comes from prop – it's the current displayed day
              newDate.setHours(hour, original.getMinutes(), original.getSeconds(), original.getMilliseconds());
              onUpdate(item.id, newDate.toISOString());
            },
            collect: (monitor) => ({ isOver: !!monitor.isOver() }),
          }));

          return (
            <div
              key={hour}
              ref={drop}
              className="grid border-b last:border-b-0 h-[60px]"
              style={{ gridTemplateColumns: "60px 1fr" }}
            >
              <div className="border-r pl-3 text-xs text-gray-600 bg-gray-50/80 flex items-center">
                {hour.toString().padStart(2, "0")}:00
              </div>

              <div
                className={`
                  relative h-full p-1 transition-all duration-150
                  ${isOver ? "bg-amber-50/60 ring-1 ring-amber-300/40" : "hover:bg-gray-50/40"}
                `}
              >
                {(() => {
                  const sorted = [...hourShipments].sort((a, b) =>
                    parseISO(a.delivery_date) - parseISO(b.delivery_date)
                  );

                  const maxVisible = 1;
                  const visible = sorted.slice(0, maxVisible);
                  const hidden = sorted.length - maxVisible;

                  return (
                    <>
                      {visible.map((s) => (
                        <TimedShipmentCard
                          key={s._id}
                          shipment={s}
                          canDrag={canDrag}
                        />
                      ))}

                      {hidden > 0 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20">
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-800/85 text-white rounded-full shadow">
                            +{hidden}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Right summary – now 50% width */}
      <div className="w-1/2 border-l bg-gray-50/70 p-4 flex flex-col gap-5 text-sm overflow-y-auto">
        <div>
          <Chip color="warning" variant="soft" size="sm" className="text-xl p-2 -ml-1 mb-3 ">Daily Overview</Chip>
          <div>
         <span className="font-bold tracking-wide">SUMMARY:</span>
          <div className="grid grid-cols-2 gap-3 mt-2 text-gray-700">
          
            <div>
              <div className="text-xs text-gray-500">Total Shipments</div>
              <div className="text-lg font-medium">{total}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Total Quantity</div>
              <div className="text-lg font-medium">{totalQuantity.toLocaleString()}</div>
            </div>
            {earliest && (
              <div>
                <div className="text-xs text-gray-500">Earliest</div>
                <div className="font-medium">{format(earliest, "HH:mm")}</div>
              </div>
            )}
            {latest && (
              <div>
                <div className="text-xs text-gray-500">Latest</div>
                <div className="font-medium">{format(latest, "HH:mm")}</div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Status breakdown with HeroUI Chips */}
        <div>
          <h4 className=" font-bold mb-2 uppercase tracking-wide">
            Status Breakdown:
          </h4>
          <div className="flex flex-wrap gap-2">
            {byStatus.Received > 0 && (
              <Chip color="success" variant="soft" size="sm">
                Received: {byStatus.Received}
              </Chip>
            )}
            {byStatus["Not Received"] > 0 && (
              <Chip color="accent" variant="soft" size="sm">
                Not Received: {byStatus["Not Received"]}
              </Chip>
            )}
            {byStatus.Delay > 0 && (
              <Chip color="warning" variant="soft" size="sm">
                Delay: {byStatus.Delay}
              </Chip>
            )}
            {byStatus.TBD > 0 && (
              <Chip color="secondary" variant="soft" size="sm">
                TBD: {byStatus.TBD}
              </Chip>
            )}
            {byStatus.Missed > 0 && (
              <Chip color="danger" variant="soft" size="sm">
                Missed: {byStatus.Missed}
              </Chip>
            )}
            {total === 0 && (
              <span className="text-gray-500 text-xs">No shipments today</span>
            )}
          </div>
        </div>
        <div>

       
        <span className="font-bold uppercase tracking-wide">Couriers:</span>
<div className="flex pr-[28%] items-center justify-between mt-2">

        {/* Top Couriers */}
        {topCouriers.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Top Couriers
            </h4>
            <div className="space-y-1 text-xs">
              {topCouriers.map(([courier, count]) => (
                <div key={courier} className="flex justify-between">
                  <span className="text-gray-600">{courier}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Suppliers */}
        {topSuppliers.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
              Top Suppliers
            </h4>
            <div className="space-y-1 text-xs">
              {topSuppliers.map(([supplier, count]) => (
                <div key={supplier} className="flex justify-between">
                  <span className="text-gray-600">{supplier}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
</div>
</div>
        {/* All Shipments list */}
        {total > 0 && (
          <div className="flex-1">
            <h4 className=" font-bold mb-2 uppercase tracking-wide">
              All Shipments ({total})
            </h4>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
              {dayShipments.map((s) => (
                <div
                  key={s._id}
                  className="text-[11px] p-2.5 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="font-medium truncate flex items-center gap-1.5">
                    <span className="text-gray-700">
                      {format(parseISO(s.delivery_date), "HH:mm")}
                    </span>
                    <span className="text-gray-400">·</span>
                    <span>{s.tracking_number || s.shortId}</span>
                  </div>
                  <div className="text-gray-600 truncate mt-0.5">
                    {s.supplier?.name || "—"} → {s.location?.name || "—"}
                  </div>
                  <div className="mt-1 text-[10px] text-gray-500">
                    Courier: {s.courier || "—"} | Items:{" "}
                    {s.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Timed Shipment Card (same compact style as Weekly)
function TimedShipmentCard({ shipment, canDrag }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SHIPMENT,
    item: { id: shipment._id, delivery_date: shipment.delivery_date },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    canDrag,
  }));

  const date = parseISO(shipment.delivery_date);
  const minutes = getMinutes(date);
  const topPercent = (minutes / 60) * 100;

  let colors = {
    bg: "bg-[#0088F6]",
    border: "border-blue-700/50",
    text: "text-white",
    time: "text-blue-100",
  };

  if (shipment.status === "Received") {
    colors = {
      bg: "bg-[#198754]",
      border: "border-green-700/50",
      text: "text-white",
      time: "text-green-100",
    };
  } else if (shipment.status === "Not Received") {
    colors = {
      bg: "bg-[#0088F6]",
      border: "border-blue-700/50",
      text: "text-white",
      time: "text-blue-100",
    };
  } else if (shipment.status === "Delay") {
    colors = {
      bg: "bg-[#fd7e14]",
      border: "border-orange-800/50",
      text: "text-white",
      time: "text-orange-100",
    };
  } else if (shipment.status === "TBD") {
    colors = {
      bg: "bg-[#6f42c1]",
      border: "border-purple-700/50",
      text: "text-white",
      time: "text-purple-100",
    };
  }

  if (shipment.missed_delivery) {
    colors = {
      bg: "bg-[#dc3545]",
      border: "border-red-700/50",
      text: "text-white",
      time: "text-red-100",
    };
  }

  const timeStr = format(date, "HH:mm");

  return (
    <div
      ref={drag}
      style={{ top: `${topPercent}%`, transform: "translateY(+5%)" }}
      className={`
        absolute left-1 right-1 z-10 rounded border px-1.5 py-1 text-[10px] shadow-sm
        cursor-grab active:cursor-grabbing transition-all duration-150
        leading-tight
        ${isDragging
          ? "opacity-50 scale-95 rotate-[0.5deg] shadow-lg z-30"
          : "hover:shadow  hover:z-20"}
        ${colors.bg} ${colors.border} ${colors.text}
      `}
    >
      <div className="font-medium truncate flex items-center gap-1">
        <span className={colors.time}>{timeStr}</span>
        <span className="opacity-60">·</span>
        <span className="truncate">
          {shipment.tracking_number || shipment.shortId}
        </span>
      </div>
      <div className="mt-0.5 text-[9px] opacity-85 truncate">
        {shipment.supplier?.name || "—"} → {shipment.location?.name || "—"}
      </div>
    </div>
  );
}