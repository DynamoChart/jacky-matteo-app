// src/Shipments.jsx
"use client";

import { useState, useMemo, useRef,useEffect } from "react";
import { useAppContext } from "./context/DataContext";
import {
  Table,
  Spin,
  Alert,
  Space,
  Tooltip,
  DatePicker,
  Checkbox,
  Button as AntButton,
} from "antd";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react"; // nice spinning loader icon
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Modal, Button, Chip, Card, Input } from "@heroui/react";
import { notification } from "antd";
import { FileText, ExternalLink } from "lucide-react";   // ← add these

import "antd/dist/antd.css";
import {
  Truck,
  Search as SearchIcon,

  Download,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";
import ShipmentModal from "./components/ShipmentModal";
import {Envelope, Globe, LayoutHeaderCellsLarge,TrashBin,Plus} from "@gravity-ui/icons";
import * as XLSX from "xlsx";
import LoadingStates from "./components/LoadingStates";
import BulkUpload from "./components/BulkUpload";
const { RangePicker } = DatePicker;

export default function Shipments() {
  const { shipments, shipmentsLoading, shipmentsError,refetchShipments,currentUser } = useAppContext();

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState([
    "Received",
    "Not Received",
    "Scheduled",
    "Delay",
    "TBD",
  ]); // all checked by default

  const [dateRange, setDateRange] = useState(null); // [start, end]

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  useEffect(() => {
    const refreshData = async () => {
      setIsInitialLoading(true);
      try {
        await refetchShipments(); // refetch from context
      } catch (err) {
        console.error("Initial refetch failed:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
  
    refreshData();
  }, []); // empty deps → runs only once on mount

  const addRef = useRef(null);
  const editRef = useRef(null);
  const deleteRef = useRef(null);
  
  const [selectedShipment, setSelectedShipment] = useState(null);
  // ── Filter logic ────────────────────────────────────────────────────────
  const filteredShipments = useMemo(() => {
    if (!shipments) return [];

    let result = shipments;

    // 1. Status filter
   // 1. Status filter – treat null/falsy as "Scheduled"
if (statusFilter.length > 0) {
  result = result.filter((s) => {
    const effectiveStatus = s.status || "Scheduled"; // ← null becomes "Scheduled"
    return statusFilter.includes(effectiveStatus);
  });
}

    // 2. Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const [start, end] = dateRange;
      const filterStart = startOfDay(start);
      const filterEnd = endOfDay(end);

      result = result.filter((s) => {
        const dateStr = s.delivery_date || s.actual_delivery_date;
        if (!dateStr) return false;
        try {
          const parsed = parseISO(dateStr);
          return isWithinInterval(parsed, { start: filterStart, end: filterEnd });
        } catch {
          return false;
        }
      });
    }

    // 3. Text search
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter((s) => {
        const fields = [
          s.shortId,
          s.tracking_number,
          s.supplier?.name,
          s.location?.name,
          s.items?.[0]?.description,
          s.status,
        ];
        return fields.some((val) => val?.toString().toLowerCase().includes(searchLower));
      });
    }

    return result;
  }, [shipments, searchText, statusFilter, dateRange]);

  // ── Excel Export ────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (!filteredShipments.length) {
      alert("No data to export");
      return;
    }

    const exportData = filteredShipments.map((s) => ({
      "Shipment ID": s.shortId || "",
      "Delivery Date": s.delivery_date
        ? format(parseISO(s.delivery_date), "MMM d, yyyy • HH:mm")
        : "",
      Supplier: s.supplier?.name || "",
      Location: s.location?.name || "",
      Items: s.items?.length || 0,
      "Total QTY": s.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0,
      "Tracking": s.tracking_number || "",
      Carrier: s.courier || "",
      Status: s.status || "",
      "Received Date": s.actual_delivery_date
        ? format(parseISO(s.actual_delivery_date), "MMM d, yyyy • HH:mm")
        : "",
      "Received Total QTY": s.items?.reduce((sum, i) => sum + (i.actual_quantity || 0), 0) || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shipments");
    XLSX.writeFile(wb, `Shipments_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  // ── Columns ─────────────────────────────────────────────────────────────
  const columns = [
    {
      title: "Shipment ID",
      dataIndex: "shortId",
      key: "shortId",
      width: 140,
      render: (text) => (
        <Tooltip title={text || "—"}>
          <span className="font-medium text-blue-700 truncate block">
            {text || "—"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Delivery Date",
      dataIndex: "delivery_date",
      key: "delivery_date",
      width: 170,
      defaultSortOrder: "descend",
      sorter: (a, b) => new Date(a.delivery_date || 0) - new Date(b.delivery_date || 0),
      render: (date) => (
        <Tooltip title={date ? format(parseISO(date), "MMM d, yyyy • HH:mm") : "—"}>
          <span className="truncate block">
            {date ? format(parseISO(date), "MMM d, yyyy • HH:mm") : "—"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Supplier",
      dataIndex: ["supplier", "name"],
      key: "supplier",
      width: 160,
      render: (text) => (
        <Tooltip title={text || "—"}>
          <span className="font-medium truncate block">{text || "—"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Location",
      dataIndex: ["location", "name"],
      key: "location",
      width: 130,
      ellipsis:true,
      render: (text) => (
        <Tooltip title={text || "—"}>
          <span className="truncate block">{text || "—"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Items",
      key: "items",
      width: 100,
      align: "center",
      render: (_, record) => (
        <div className="text-center font-medium">
          {record.items?.length || 0}
        </div>
      ),
    },
    {
      title: "Total QTY",
      key: "totalQty",
      width: 120,
      align: "center",
      render: (_, record) => (
        <div className="font-medium">
          {record.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
        </div>
      ),
    },
    {
      title: "Tracking",
      dataIndex: "tracking_number",
      key: "tracking",
      width: 140,
      render: (text) => (
        <Tooltip title={text || "—"}>
          <span className="truncate block">{text || "—"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Carrier",
      dataIndex: "courier",
      key: "courier",
      width: 140,
      render: (text) => (
        <Tooltip title={text || "—"}>
          <span className="truncate block">{text || "—"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        // If null/undefined/empty → treat as "Scheduled" with accent color
        if (!status) {
          return (
            <Chip variant="soft" color="accent" size="sm">
              Scheduled
            </Chip>
          );
        }
      
        // Real statuses only from here
        let color = "gray"; // fallback
        if (status === "Received") color = "success";
        if (status === "Not Received") color = "danger";
        if (status === "Delay") color = "warning";
        if (status === "TBD") color = "default";
      
        return (
          <Chip variant="soft" color={color} size="sm">
            {status}
          </Chip>
        );
      },
    

      
    },
    {
      title: "Received Date",
      dataIndex: "actual_delivery_date",
      key: "receivedDate",
      width: 100,
      render: (date) => (
        <Tooltip title={date ? format(parseISO(date), "MMM d, yyyy • HH:mm") : "—"}>
          <span className="truncate block">
            {date ? format(parseISO(date), "MMM d, yyyy • HH:mm") : "—"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Received QTY",
      key: "receivedQty",
      width: 140,
      align: "center",
      render: (_, record) => (
        <div className="font-medium">
          {record.items?.reduce((sum, item) => sum + (item.actual_quantity || 0), 0) || 0}
        </div>
      ),
    },
    {
      title: "Attachment",
      key: "attachment",
      width: 60,
      maxWidth: 80,
      align: "center",
      render: (_, record) => {
        if (!record.attachments?.length) return null;
    
        const dbPath = record.attachments[0];                        // "serve/uploads/1771024027116.pdf"
        
        // Remove "serve/" prefix if present, keep the rest
        const publicPath = dbPath.replace(/^serve\//, '');           // → "uploads/1771024027116.pdf"
        
        // Make sure no leading slash duplication
        const cleanPath = publicPath.replace(/^\//, '');
        
        const fullUrl = `${import.meta.env.VITE_API_BASE_URL}${cleanPath}`;
    
        return (
          <Tooltip title="Open attachment">
            <AntButton
              type="text"
              icon={<FileText className="h-5 w-5 text-indigo-600 hover:text-indigo-800 transition-colors" />}
              onClick={() => window.open(fullUrl, "_blank", "noopener,noreferrer")}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <AntButton
            type="text"
            icon={<Edit className="h-4 w-4 text-blue-600" />}
            onClick={() => {
              setSelectedShipment(record);
              editRef.current?.click();
            }}
          />
    
          {currentUser?.role === "admin" ? (
            <AntButton
              type="text"
              danger
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => {
                setSelectedShipment(record);
                deleteRef.current?.click();
              }}
            />
          ) : (
            <Tooltip title="Delete available to admins only">
              <AntButton
                type="text"
                disabled
                icon={<Trash2 className="h-4 w-4 text-gray-400" />}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];



  return (
    <>
    <LoadingStates
      isInitialLoading={isInitialLoading}
      shipmentsLoading={shipmentsLoading}
      shipmentsError={shipmentsError}
      shipments={shipments}
      refetchShipments={refetchShipments}
      addRef={addRef}
    />
    <div className="bg-white min-h-screen py-8">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header + Actions */}
       {currentUser?.role==!"location" &&  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Truck className="h-7 w-7 text-indigo-600" />
            Shipments
          </h2>

          <Space size="middle">
          <Button
            variant="secondary"
            onClick={() => addRef.current?.click()}
          >
            <Plus />
            Add Shipment
          </Button>


            <Button
              className={"bg-[#33C866]"}
              icon={<Download className="h-4 w-4" />}
              onClick={handleExportExcel}
            >
              <LayoutHeaderCellsLarge/>
              Export Excel
            </Button>
            <BulkUpload/>
          </Space>
        </div>}
<div className="flex justify-between">
        {/* Status chips with checkboxes */}
        <Space wrap size="middle">
          {["Received", "Not Received", "Scheduled", "Delay", "TBD"].map((status) => (
            <div key={status} className="flex items-center gap-2">
              <Checkbox
                checked={statusFilter.includes(status)}
                onChange={(e) => {
                  setStatusFilter((prev) =>
                    e.target.checked
                      ? [...prev, status]
                      : prev.filter((s) => s !== status)
                  );
                }}
              />
              <Chip
                variant="soft"
                color={
                  status === "Received" ? "success" :
                  status === "Not Received" ? "danger" :
                  status === "Scheduled" ? "accent" :
                  status === "Delay" ? "warning" :
                  "default"
                }
                size="md"
                className="cursor-pointer hover:opacity-90 transition-opacity"
              >
                {status}
              </Chip>
            </div>
          ))}
        </Space>

        {/* Search + Date Range */}
        <div className="flex flex gap-4">
          <div className="w-full ">
            <Input
              placeholder="Search shipment ID, supplier, location, PO..."
              allowClear
              size="large"
              prefix={<SearchIcon className="h-5 w-5 text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="rounded-xl shadow-sm w-[300px] border border-blue-300 h-[35px]"
            />
          </div>

          <div className="w-full">
            <RangePicker
              format="MMM D, YYYY"
              onChange={(dates) => setDateRange(dates)}
              allowClear
              placeholder={["From Date", "To Date"]}
              size="large"
              className="rounded-xl shadow-sm  border border-blue-300 h-[30px]"
            />
          </div>
        </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Table
            columns={columns}
            dataSource={filteredShipments}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} shipments`,
              position: ["bottomCenter"],
            }}
            loading={shipmentsLoading}
            bordered={false}
            size="middle"
            scroll={{ x: "max-content" }}
            className="custom-ant-table"
            locale={{ emptyText: "No shipments match your filters" }}
          />
        </div>
      </div>

      {/* Add Shipment Modal – HeroUI v3 (trigger-based like your DashTable) */}
  
      <ShipmentModal
  mode="create"
  triggerRef={addRef}

/>

<ShipmentModal
  mode="edit"
  shipment={selectedShipment}
  triggerRef={editRef}
  
/>

<ShipmentModal
  mode="delete"
  shipment={selectedShipment}
  triggerRef={deleteRef}
 
/>

    </div>
    </>
  );
}