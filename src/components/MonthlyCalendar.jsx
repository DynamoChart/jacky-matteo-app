// src/MonthlyCalendar.jsx
import { useState } from "react";
import { useDrop, useDrag } from "react-dnd";
import {
  format,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";

const ItemTypes = { SHIPMENT: "shipment" };

export default function MonthlyCalendar({
  days,
  currentDate,
  shipments,
  canDrag,
  onUpdate,
  onDayClick,
}) {
  const [selectedDay, setSelectedDay] = useState(null);

  const handleDayClick = (date) => {
    setSelectedDay(date);
    if (onDayClick) onDayClick(date);
  };

  return (
    <div className="grid grid-cols-7 gap-px  overflow-hidden shadow-sm border border-gray-200/70">
      {/* Weekday headers */}
      {["Sun","Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div
          key={day}
          className="bg-[#F9C97C] backdrop-blur-sm py-1.5 text-center text-xs font-semibold tracking-wide text-black uppercase"
        >
          {day}
        </div>
      ))}

      {days.map((date) => (
        <DayCell
          key={date.toISOString()}
          date={date}
          currentDate={currentDate}
          selectedDay={selectedDay}
          dayShipments={shipments.filter((s) =>
            s.delivery_date ? isSameDay(parseISO(s.delivery_date), date) : false
          )}
          canDrag={canDrag}
          onUpdate={onUpdate}
          onDayClick={handleDayClick}
        />
      ))}
    </div>
  );
}

function DayCell({
  date,
  currentDate,
  selectedDay,
  dayShipments,
  canDrag,
  onUpdate,
  onDayClick,
}) {
  const isCurrentMonth = isSameMonth(date, currentDate);
  const isToday = isSameDay(date, new Date());
  const isSelected = selectedDay && isSameDay(date, selectedDay);

  const visibleShipments = dayShipments.slice(0, 2);
  const hiddenCount = dayShipments.length - 2;

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.SHIPMENT,
    drop: (item) => {
      const original = parseISO(item.delivery_date);
      const newDate = new Date(date);
      newDate.setHours(original.getHours(), original.getMinutes(), 0, 0);
      onUpdate(item.id, newDate.toISOString());
    },
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));

  return (
    <div
      ref={drop}
      onClick={() => onDayClick(date)}
      className={`
        group relative h-[7.5rem] rounded-sm lg:min-h-[7rem] p-2 
        flex flex-col bg-white transition-all duration-200
        hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)]
        active:scale-[0.995]
        border-b border-r border-gray-100 last:border-r-0
        ${!isCurrentMonth ? "opacity-10 bg-gray-50/40" : ""}
        ${isToday ? "bg-blue-50/30 ring-1 ring-blue-200/70" : ""}
        ${isOver ? "bg-amber-50/60 ring-2 ring-amber-300/50 scale-[1.1]" : ""}
        ${isSelected ? "ring-2 ring-indigo-400/60 bg-indigo-50/20 shadow-sm" : ""}
      `}
    >
      <div className="flex">
        {/* Day number – keeping your edited small size */}
        <div
          className={`
            text-right text-[10px] tracking-tight
            ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}
            ${isToday ? "text-blue-600" : ""}
            ${isSelected ? "text-indigo-600" : ""}
          `}
        >
          {format(date, "d")}
        </div>

        {/* Shipments */}
        <div className="mt-1 ml-2 flex-1 space-y-1 overflow-hidden">
          {visibleShipments.map((s) => (
            <ShipmentCard
              key={s._id}
              shipment={s}
              canDrag={canDrag}
            />
          ))}

          {hiddenCount > 0 && (
            <div className="text-xs text-blue-500/90 font-medium pl-1 pt-1">
              +{hiddenCount} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShipmentCard({ shipment, canDrag }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SHIPMENT,
    item: { id: shipment._id, delivery_date: shipment.delivery_date },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    canDrag,
  }));

  const time = format(parseISO(shipment.delivery_date), "HH:mm");

  // Default (TBD / unknown / Not Received fallback)
  let colors = {
    bg: "bg-[#0088F6]",           // your primary blue
    border: "border-blue-700/40",  // darker subtle border to match
    text: "text-white",            // white text for contrast on dark bg
    time: "text-blue-100/90",      // light blue tint for time
  };

  if (shipment.status === "Received") {
    colors = {
      bg: "bg-[#198754]",          // bootstrap-like success green
      border: "border-green-700/40",
      text: "text-white",
      time: "text-green-100/90",
    };
  } else if (shipment.status === "Not Received") {
    colors = {
      bg: "bg-[#0088F6]",         // same blue as default, or change if you want
      border: "border-blue-700/40",
      text: "text-white",
      time: "text-blue-100/90",
    };
  } else if (shipment.status === "Delay") {
    colors = {
      bg: "bg-[#fd7e14]",         // strong orange for warning/delay
      border: "border-orange-800/40",
      text: "text-white",
      time: "text-orange-100/90",
    };
  } else if (shipment.status === "TBD") {
    colors = {
      bg: "bg-[#6f42c1]",         // purple-ish for TBD (or keep blue)
      border: "border-purple-700/40",
      text: "text-white",
      time: "text-purple-100/90",
    };
  }

  // missed_delivery has highest priority (red override)
  if (shipment.missed_delivery) {
    colors = {
      bg: "bg-[#dc3545]",         // strong red
      border: "border-red-700/40",
      text: "text-white",
      time: "text-red-100/90",
    };
  }

  return (
    <div
      ref={drag}
      className={`
        px-1.5 py-1 h-[40px] rounded-lg border text-xs leading-snug
        transition-all duration-150 cursor-grab active:cursor-grabbing
        shadow-sm hover:shadow-md hover:brightness-110
        ${isDragging ? "opacity-60 scale-95 rotate-1 shadow-lg" : ""}
        ${colors.bg} ${colors.border} ${colors.text}
      `}
    >
      <div className="font-semibold truncate text-[10px] flex items-baseline gap-1.5">
        <span className={`font-medium ${colors.time}`}>{time}</span>
        <span className="opacity-70">·</span>
        <span className="truncate">
          {shipment.tracking_number || shipment.shortId}
        </span>
      </div>

      <div className="mt-0.5 text-[12px] truncate line-clamp-1 opacity-90">
        {shipment.supplier?.name || "—"} → {shipment.location?.name || "—"}
      </div>
    </div>
  );
}