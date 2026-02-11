// src/ShipmentCard.jsx (you can put it in a separate file or inside one of the calendars)
import { useDrag } from "react-dnd";
import { format, parseISO } from "date-fns";

const ItemTypes = { SHIPMENT: "shipment" };

export default function ShipmentCard({ shipment, canDrag }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SHIPMENT,
    item: { id: shipment._id, delivery_date: shipment.delivery_date },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    canDrag,
  }));

  return (
    <div
      ref={drag}
      className={`p-2 h-[10px] rounded border text-xs shadow-sm cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-60 scale-105" : "opacity-100"}
        ${shipment.status === "Received" ? "bg-green-50 border-green-300" :
          shipment.missed_delivery ? "bg-red-50 border-red-300" :
          "bg-blue-50 border-blue-300"}`}
    >
      <div className="font-medium truncate">
        {format(parseISO(shipment.delivery_date), "HH:mm")} · {shipment.tracking_number || shipment.shortId}
      </div>
      <div className="opacity-75 truncate text-xs">
        {shipment.supplier?.name} → {shipment.location?.name}
      </div>
    </div>
  );
}