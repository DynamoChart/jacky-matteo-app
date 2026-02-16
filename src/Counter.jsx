// src/Counter.jsx
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useAppContext } from "./context/DataContext";
import {
  Table,
  Spin,
  Alert,
  Space,
  Tooltip,
  DatePicker,
	Checkbox,
} from "antd";
import { Modal, Button,ModalFooter } from "@heroui/react";
import { CalendarDays, Package ,PackageSearch} from "lucide-react";
import LoadingStates from "./components/LoadingStates";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Card, Chip, Input } from "@heroui/react";
import {
  Truck,
  Search as SearchIcon,
} from "lucide-react";


const { RangePicker } = DatePicker;
import { notification } from "antd";
import "antd/dist/antd.css";
export default function Counter() {
  const { shipments, shipmentsLoading, shipmentsError,token,refetchShipments,currentUser} = useAppContext();
  const triggerRef = useRef(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState([
    "Waiting for location",
    "Waiting for supplier",
    "Done",
  ]); // all checked by default

  const [isSuggesting, setIsSuggesting] = useState(false);          // loading state during request
  const [hasSuggested, setHasSuggested] = useState(false);          // toggle button text
  const [confirmedDate, setConfirmedDate] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
const [hasAccepted, setHasAccepted] = useState(false);
  useEffect(() => {
    const refreshData = async () => {
      setIsInitialLoading(true);
      try {
        await refetchShipments();
      } catch (err) {
        console.error("Initial refetch failed:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
  
    refreshData();
  }, [refetchShipments]);

  const [tempDateTime, setTempDateTime] = useState("");
 
  const [selectedDate, setSelectedDate] = useState(null);
  useEffect(() => {
    if (selectedDate?.delivery_date) {
      try {
        const date = new Date(selectedDate.delivery_date);
        if (!isNaN(date.getTime())) {
          setTempDateTime(date.toISOString().slice(0, 19));
        } else {
          setTempDateTime("");
        }
      } catch {
        setTempDateTime("");
      }
    } else {
      setTempDateTime("");
    }
  }, [selectedDate]);


  const [dateRange, setDateRange] = useState(null); // [startDate, endDate] or null
  const handleRowClick = (shipmenti) => {
    setSelectedDate(shipmenti);
   

   
    if (triggerRef.current) {
      triggerRef.current.click();
    }
    setHasSuggested(false);
  };
  // ── Filter & search logic ───────────────────────────────────────────────
  const filteredShipments = useMemo(() => {
    if (!shipments) return [];

    let result = shipments;

    // 1. Status filter
    if (statusFilter.length > 0) {
      result = result.filter((s) => statusFilter.includes(s.cr_status));
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
          const parsedDate = parseISO(dateStr);
          return isWithinInterval(parsedDate, { start: filterStart, end: filterEnd });
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
          s.cr_status,
          s.status,
        ];
        return fields.some((val) => val?.toString().toLowerCase().includes(searchLower));
      });
    }

    return result;
  }, [shipments, searchText, statusFilter, dateRange]);

  // ── Table columns ───────────────────────────────────────────────────────
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
      width: 100,
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
      title: "CR Status",
      dataIndex: "cr_status",
      key: "cr_status",
      width: 180,
      render: (status) => {
        let color = "gray";
        if (status === "Done") color = "success";
        if (status === "Waiting for location") color = "warning";
        if (status === "Waiting for supplier") color = "accent";

        return <Chip variant="soft" color={color} size="sm">{status || "Unknown"}</Chip>;
      },
    },
    {
      title: "Last Update",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 170,
      sorter: (a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0),
      render: (date) => (
        <Tooltip title={date ? format(parseISO(date), "MMM d, yyyy • HH:mm") : "—"}>
          <span className="truncate block">
            {date ? format(parseISO(date), "MMM d, yyyy • HH:mm") : "—"}
          </span>
        </Tooltip>
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
  // No addRef here → no "Add First" button needed
  emptyIcon={<Package className="h-16 w-16 text-gray-400" />}
  emptyTitle="No Counter Requests"
  emptyDescription="There are no pending counter requests at the moment."
  retryButtonText="Retry Loading"
/>
    <div className="bg-white min-h-screen py-8">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header row – Search on right, title + chips on left */}
        <div className="flex  sm:flex-col justify-between items-start sm:items-center gap-4">
<div className="flex items-start w-full"> 
        <h2 className="text-2xl font-bold text-gray-800 flex  gap-3">
            <PackageSearch className="h-7 w-7 text-indigo-600" />
            Counter Requests
          </h2>
          </div>
          {/* Search on top-right */}
          <div className="w-full flex justify-between">
					<Space wrap >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={statusFilter.includes("Waiting for location")}
                  onChange={(e) => {
                    setStatusFilter((prev) =>
                      e.target.checked
                        ? [...prev, "Waiting for location"]
                        : prev.filter((s) => s !== "Waiting for location")
                    );
                  }}
                />
              
                <Chip
                  variant="soft"
                  color={statusFilter.includes("Waiting for location") ? "warning" : "default"}
                  size="md"
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                  Waiting for location
                </Chip>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={statusFilter.includes("Waiting for supplier")}
                  onChange={(e) => {
                    setStatusFilter((prev) =>
                      e.target.checked
                        ? [...prev, "Waiting for supplier"]
                        : prev.filter((s) => s !== "Waiting for supplier")
                    );
                  }}
                />
                <Chip
                  variant="soft"
                  color={statusFilter.includes("Waiting for supplier") ? "accent" : "default"}
                  size="md"
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                  Waiting for supplier
                </Chip>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={statusFilter.includes("Done")}
                  onChange={(e) => {
                    setStatusFilter((prev) =>
                      e.target.checked
                        ? [...prev, "Done"]
                        : prev.filter((s) => s !== "Done")
                    );
                  }}
                />
                <Chip
                  variant="soft"
                  color={statusFilter.includes("Done") ? "success" : "default"}
                  size="md"
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                >
                  Done
                </Chip>
              </div>
            </Space>
            <Input
              placeholder="Search shipment ID, supplier, location, PO..."
              allowClear
              size="small"
              prefix={<SearchIcon className="h-5 w-5 text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="rounded-xl shadow-sm w-[400px] border border-blue-300 h-[35px]"
            />
						 <div className="max-w-md">
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

        {/* Date Range Picker */}
       

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Table
            columns={columns}
            dataSource={filteredShipments}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} counter requests`,
              position: ["bottomCenter"],
            }}
            loading={shipmentsLoading}
            bordered={false}
            size="middle"
            onRow={(_id) => ({
              onClick: () => handleRowClick(_id),
              style: { cursor: "pointer" },
              className: "hover:bg-red-50/60 transition-colors duration-150",
            })}
            scroll={{ x: "max-content" }}
            className="custom-ant-table"
            locale={{ emptyText: "No counter requests match your filters" }}
          />
        </div>
      </div>
      <Modal  className=" ">  {/* or "2xl" if you want even wider */}
  {/* Hidden trigger */}
  <Button
    variant="secondary"
    ref={triggerRef}
    className="hidden"
  >
    Open (hidden)
  </Button>

  <Modal.Backdrop >
    <Modal.Container>
      <Modal.Dialog className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <Modal.CloseTrigger />

        <Modal.Header>
          <Modal.Heading>
          <div className="flex items-center gap-3">
            <CalendarDays className="size-6 text-blue-600" />
            Shipments on{" "}
            {selectedDate?.delivery_date
              ? format(parseISO(selectedDate.delivery_date), "d MMM yyyy HH:mm")
              : "—"}
          </div>
          </Modal.Heading>

          {/* Status breakdown with Chips */}
          {(() => {
            const dayShipments = shipments.filter((s) => {
              const dateStr = s.delivery_date || s.actual_delivery_date;
              if (!dateStr) return false;
              try {
                return format(parseISO(dateStr), "yyyy-MM-dd") === selectedDate?.key;
              } catch {
                return false;
              }
            });

            // Count by status
            const statusCounts = dayShipments.reduce((acc, s) => {
              const key = s.missed_delivery ? "Missed" : s.status || "Unknown";
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {});

            return (
              <div className="mt-3 flex flex-wrap gap-2">
               
                {Object.entries(statusCounts).map(([status, count]) => {
                  let color = "default";
                  if (status === "Received") color = "success";
                  if (status === "Not Received") color = "primary";
                  if (status === "Delay") color = "warning";
                  if (status === "TBD") color = "secondary";
                  if (status === "Missed") color = "danger";

                  return (
                    <Chip key={status} variant="soft" color={color} size="sm">
                      {status}: {count}
                    </Chip>
                  );
                })}
              </div>
            );
          })()}
        </Modal.Header>

        <Modal.Body className="pt-2 pb-3">
  {selectedDate ? (
    (() => {
      const shipment = selectedDate; // ← it's the shipment object

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
     
      return (
        <Card
          className={`w-full p-6 ${colors.bg} ${colors.border} shadow-xl rounded-2xl overflow-hidden border ${colors.border}`}
        >
          <Card.Header className="pb-4 flex items-center justify-between">
            <div className="flex items-start gap-4">
              <Package className={`${colors.time} size-6`} />
              <div className="flex">
                <Card.Title className={`${colors.text} text-xl mr-3 font-bold`}>
                  {shipment.shortId || shipment.tracking_number || "No ID"}
                  {shipment.missed_delivery && (
                    <span className="ml-3 text-lg font-semibold">(Missed Delivery)</span>
                  )}
                </Card.Title>
                <Card.Description className={`${colors.time} text-base mt-1`}>
                  Delivery: {shipment.delivery_date
                    ? format(parseISO(shipment.delivery_date), "MMMM d, yyyy • HH:mm")
                    : "No date set"}
                </Card.Description>
              </div>
            </div>
          </Card.Header>

          <div className={`${colors.text} space-y-1 text-base`}>
            {/* Main info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <span className={`${colors.time} font-semibold block mb-1 underline`}>Supplier</span>
                <p className="font-medium">{shipment.supplier?.name || "—"}</p>
              </div>
              <div>
                <span className={`${colors.time} font-semibold block mb-1 underline `}>Location</span>
                <p className="font-medium">{shipment.location?.name || "—"}</p>
              </div>
              <div>
                <span className={`${colors.time} font-semibold block mb-1 underline `}>Carrier</span>
                <p className="font-medium">{shipment.courier || "—"}</p>
              </div>
              <div>
                <span className={`${colors.time} font-semibold block mb-1 underline `}>Tracking Number</span>
                <p className="font-medium">{shipment.tracking_number || "—"}</p>
              </div>
              <div>
                <span className={`${colors.time} font-semibold block mb-1 underline `}>CR Status</span>
                <Chip
                  variant="soft"
                  color={
                    shipment.cr_status === "Done" ? "success" :
                    shipment.cr_status?.includes("Waiting") ? "warning" : "default"
                  }
                  size="md"
                  className="mt-1"
                >
                  {shipment.cr_status || "—"}
                </Chip>
              </div>
              <div>
                <span className={`${colors.time} font-semibold block mb-1 underline`}>Shipment Status</span>
                <p className="font-medium">{shipment.status || "—"}</p>
              </div>
            </div>

            {/* Items List */}
            {shipment.items?.length > 0 && (
              <div className="pt-2 border-t border-white/20">
                <span className={`${colors.time} font-semibold block mb-3 text-sm`}>Items ({shipment.items.length})</span>
                <div className="space-y-1">
                  {shipment.items.map((item, i) => (
                    <div key={i} className="bg-white/10 rounded-lg p-1 pl-2 pr-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className={`${colors.time} font-medium block`}>PO</span>
                          <p>{item.po || "—"}</p>
                        </div>
                        <div>
                          <span className={`${colors.time} font-medium block`}>PO Line</span>
                          <p>{item.po_line || "—"}</p>
                        </div>
                        <div>
                          <span className={`${colors.time} font-medium block`}>Quantity</span>
                          <p>{item.quantity || "?"} {item.uom || ""}</p>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <span className={`${colors.time} font-medium block w-[400px]`}>Description</span>
                          <p>{item.description || "—"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer info */}
            <div className="pt-6 border-t border-white/20 text-sm flex flex-col md:flex-row justify-between gap-4">
              <div>
                <span className={`${colors.time} font-semibold`}>Created:</span>{" "}
                {format(parseISO(shipment.createdAt), "MMM d, yyyy • HH:mm")}
              </div>
              <div>
                <span className={`${colors.time} font-semibold`}>Last Update:</span>{" "}
                {format(parseISO(shipment.updatedAt), "MMM d, yyyy • HH:mm")}
              </div>
            </div>
          </div>
        </Card>
      );
    })()
  ) : (
    <div className="text-center py-12 text-gray-500">
      No shipment selected.
    </div>
  )}
</Modal.Body>
<ModalFooter className="flex items-center justify-end gap-3 pt-5 border-t">

{!(selectedDate?.cr_status?.toLowerCase() === "done" && currentUser?.role === "supplier") && (
    <>
      <div className="flex items-center gap-2">
     
        
        <input
          type="datetime-local"
          step="1"
          value={tempDateTime}
          onChange={(e) => setTempDateTime(e.target.value || "")}
          className="
            px-3 py-2 text-sm
            border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            shadow-sm
          "
        />

      </div>

      <Button
  variant="primary"
  size="sm"
  loading={isSuggesting}  // ← shows spinner if HeroUI Button supports loading prop
  onClick={async () => {
    if (!tempDateTime || !selectedDate?._id) {
      alert("Select a shipment and date first"); // or replace with toast
      return;
    }

    // Prepare date
    let formattedDate;
    try {
      const dateObj = new Date(tempDateTime);
      if (isNaN(dateObj.getTime())) throw new Error("Invalid date");
      formattedDate = dateObj.toISOString();
    } catch (err) {
      console.error("Date parsing failed:", err);
      // Use toast instead of alert
      notification.error({
        message: "Invalid Date",
        description: "Please select a valid date and time.",
        placement: "topRight",
      });
      return;
    }

    const payload = {
      id: selectedDate._id,
      delivery_date: formattedDate,
    };

    setIsSuggesting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/counter-request/suggest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
        } catch {}
        throw new Error(`Server error ${response.status} – ${errorText || "no details"}`);
      }

      // Success handling
      let result;
      try {
        result = await response.json();
      } catch {
        result = { message: "Success (no JSON)" };
      }

     

      // Show nice toast
      notification.success({
        message: "Suggestion Sent",
        description: "The delivery date suggestion has been submitted successfully.",
        placement: "topRight",
        duration: 4.5,
      });

      // Toggle button text
      setHasSuggested(true);

    } catch (err) {
      console.error("Suggest failed:", err);
      notification.error({
        message: "Suggestion Failed",
        description: err.message || "Network/server issue – please try again",
        placement: "topRight",
      });
    } finally {
      setIsSuggesting(false);
    }
  }}
  disabled={isSuggesting || !tempDateTime || !selectedDate?._id}
  className={`bg-indigo-600 hover:bg-indigo-700 text-white min-w-[110px] ${
    hasSuggested ? "bg-indigo-500 hover:bg-indigo-600" : ""
  }`}
>
  {hasSuggested ? "Suggest Again" : "Suggest"}
</Button>

<Button 
  className={`bg-[#33C866] hover:bg-green-600 text-white min-w-[90px] ${
    hasAccepted ? "opacity-70 cursor-not-allowed" : ""
  }`}
  loading={isAccepting}
  disabled={isAccepting || hasAccepted || !selectedDate?._id}
  onClick={async () => {
    if (!selectedDate?._id) {
      notification.warning({
        message: "No Shipment Selected",
        description: "Please select a shipment first.",
        placement: "topRight",
      });
      return;
    }

    const payload = {
      id: selectedDate._id
    };

  
    setIsAccepting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/counter-request/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("Accept HTTP status:", response.status);

      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
        } catch {}
        throw new Error(`Server error ${response.status} – ${errorText || "no details"}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonErr) {
        console.warn("Accept success - non-JSON response:", jsonErr);
        result = { message: "Accepted (empty response body)" };
      }


      refetchShipments()
      // Success toast
      notification.success({
        message: "Accepted Successfully",
        description: "The counter request has been accepted.",
        placement: "topRight",
        duration: 4.5,
      });

      // Disable button permanently after success
      setHasAccepted(true);

    } catch (err) {
      console.error("Accept failed:", err);
      notification.error({
        message: "Accept Failed",
        description: err.message || "Network/server issue – please try again",
        placement: "topRight",
        duration: 6,
      });
    } finally {
      setIsAccepting(false);
    }
  }}
>
  {hasAccepted ? "Accepted" : "Accept"}
</Button>
    </>
  )}


</ModalFooter>
      </Modal.Dialog>
    </Modal.Container>
  </Modal.Backdrop>
</Modal>

    </div>
    </>
  );
}