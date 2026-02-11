// src/WeeklyCalendar.jsx
import { useDrop, useDrag } from "react-dnd";
import { format, parseISO, isSameDay, getHours, getMinutes } from "date-fns";

const ItemTypes = { SHIPMENT: "shipment" };

const hours = Array.from({ length: 15 }, (_, i) => 6 + i); // 06:00 to 20:00

export default function WeeklyCalendar({ days, shipments, canDrag, onUpdate }) {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
      {/* Header: Weekdays + Dates – smaller */}
      <div
        className="grid sticky top-0 z-10 h-9 bg-gray-50 border-b"
        style={{ gridTemplateColumns: "60px repeat(7, minmax(100px, 1fr))" }}
      >
        <div className="border-r pl-3 text-xs font-medium text-gray-600 bg-gray-100 flex items-center">
          Time
        </div>
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="p-1.5 text-center text-xs font-semibold text-gray-800 border-r last:border-r-0 flex flex-col justify-center"
          >
            <div>{format(day, "EEE")}</div>
            <div className="text-[10px] text-gray-500">{format(day, "MMM d")}</div>
          </div>
        ))}
      </div>

      {/* Hours rows – much smaller */}
      {hours.map((hour) => (
        <div
          key={hour}
          className="grid border-b last:border-b-0 h-[60px]"
          style={{ gridTemplateColumns: "60px repeat(7, minmax(100px, 1fr))" }}
        >
          {/* Hour label – smaller */}
          <div className="border-r pl-3 text-xs text-gray-600 bg-gray-50/80 flex items-center">
            {hour.toString().padStart(2, "0")}:00
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayShipments = shipments.filter(
              (s) =>
                s.delivery_date &&
                isSameDay(parseISO(s.delivery_date), day) &&
                getHours(parseISO(s.delivery_date)) === hour
            );

            const [{ isOver }, drop] = useDrop(() => ({
              accept: ItemTypes.SHIPMENT,
              drop: (item) => {
                const original = parseISO(item.delivery_date);
                const newDate = new Date(day);
                newDate.setHours(hour, original.getMinutes(), original.getSeconds(), 0);
                onUpdate(item.id, newDate.toISOString());
              },
              collect: (monitor) => ({ isOver: !!monitor.isOver() }),
            }));

            return (
              <div
                key={day.toISOString()}
                ref={drop}
                className={`
                  relative h-full p-1 transition-all duration-150
                  ${isOver ? "bg-amber-50/60 ring-1 ring-amber-300/40" : "hover:bg-gray-50/40"}
                  border-r last:border-r-0
                `}
              >
                {(() => {
                  const sorted = [...dayShipments].sort((a, b) =>
                    parseISO(a.delivery_date) - parseISO(b.delivery_date)
                  );

                  const maxVisible = 1; // you had 1 in your last version – can change to 2
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
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Smaller, tighter card
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
      style={{
        top: `${topPercent}%`,
        transform: "translateY(+5%)",
      }}
      className={`
        absolute left-1 right-1 z-10 rounded border px-1.5 py-1 text-[10px] shadow-sm
        cursor-grab active:cursor-grabbing transition-all duration-150
        leading-tight
        ${isDragging
          ? "opacity-50 scale-95 rotate-[0.5deg] shadow-lg z-30"
          : "hover:shadow hover:scale-[1.02] hover:z-20"}
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