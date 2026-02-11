// src/pages/Locations.jsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAppContext } from "./context/DataContext";
import {
  Table,
  Space,
  Tooltip,
  Input as AntInput,
  Button as AntButton,
  Pagination,
} from "antd";
import { Button } from "@heroui/react";
import { Search, Download, Edit, Trash2, Plus, MapPin } from "lucide-react";
import { LayoutHeaderCellsLarge } from "@gravity-ui/icons";
import * as XLSX from "xlsx";
import LoadingStates from "./components/LoadingStates";

// Modals
import LocationModalCreate from "./components/LocationModalCreate";
import LocationModalEdit from "./components/LocationModalEdit";
import LocationModalDelete from "./components/LocationModalDelete";

export default function Locations() {
  const {
    allLocations,
    locationsLoading,
    locationsError,
    isAdmin,
    refetchAllLocations,
  } = useAppContext();

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const refreshData = async () => {
      setIsInitialLoading(true);
      try {
        await refetchAllLocations?.();
      } catch (err) {
        console.error("Locations initial refetch failed:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    refreshData();
  }, [refetchAllLocations]);

  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const addRef = useRef(null);
  const editRef = useRef(null);
  const deleteRef = useRef(null);

  const [selectedLocation, setSelectedLocation] = useState(null);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const filteredLocations = useMemo(() => {
    if (!allLocations?.length) return [];

    if (!debouncedSearch?.trim()) return allLocations;

    const searchLower = debouncedSearch.trim().toLowerCase();
    return allLocations.filter((loc) =>
      (loc.name || "").toLowerCase().includes(searchLower)
    );
  }, [allLocations, debouncedSearch]);

  const paginatedLocations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLocations.slice(start, start + pageSize);
  }, [filteredLocations, currentPage]);

  const handleExportExcel = () => {
    if (!filteredLocations.length) {
      alert("No data to export");
      return;
    }

    const exportData = filteredLocations.map((l) => ({
      Name: l.name || "—",
      "Created At": l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "—",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Locations");
    XLSX.writeFile(wb, `Locations_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 300,
      render: (text) => (
        <Tooltip title={text || "—"}>
          <span className="font-medium text-blue-700 truncate block">
            {text || "—"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date) => (date ? new Date(date).toLocaleDateString() : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          <AntButton
            type="text"
            icon={<Edit className="h-4 w-4 text-blue-600" />}
            onClick={() => {
              setSelectedLocation(record);
              editRef.current?.click();
            }}
          />
          <AntButton
            type="text"
            danger
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => {
              setSelectedLocation(record);
              deleteRef.current?.click();
            }}
            disabled={!isAdmin}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <LoadingStates
        isInitialLoading={isInitialLoading}
        shipmentsLoading={locationsLoading}
        shipmentsError={locationsError}
        shipments={allLocations}
        refetchShipments={refetchAllLocations}
        emptyIcon={<MapPin className="h-16 w-16 text-gray-400 mx-auto mb-6" />}
        emptyTitle="No Locations Found"
        emptyDescription="There are no locations registered in the system yet."
        retryButtonText="Refresh Locations"
      />

      {!isInitialLoading && (
        <div className="bg-white min-h-screen py-8">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Header + Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <MapPin className="h-7 w-7 text-indigo-600" />
                Locations
              </h2>

              <Space size="middle">
                {isAdmin && (
                  <Button
                    variant="secondary"
                    onClick={() => addRef.current?.click()}
                  >
                    <Plus className="h-4 w-4" />
                    Add Location
                  </Button>
                )}

                <Button
                  className="bg-[#33C866]"
                  icon={<Download className="h-4 w-4" />}
                  onClick={handleExportExcel}
                >
                  <LayoutHeaderCellsLarge />
                  Export Excel
                </Button>
              </Space>
            </div>

            {/* Search */}
            <div className="flex justify-right w-[25%]">
              <AntInput
                placeholder="Search location name..."
                allowClear
                size="large"
                prefix={<Search className="h-5 w-5 text-gray-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="rounded-xl shadow-sm w-[300px] border border-blue-300 h-[35px]"
              />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <Table
                columns={columns}
                dataSource={paginatedLocations}
                rowKey="_id"
                pagination={false}
                loading={locationsLoading}
                bordered={false}
                size="middle"
                scroll={{ x: "max-content" }}
                className="custom-ant-table"
                locale={{ emptyText: "No locations match your search" }}
              />
            </div>

            {/* Pagination */}
            {filteredLocations.length > pageSize && (
              <div className="flex justify-center py-6">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredLocations.length}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                  showTotal={(total) => `Showing ${paginatedLocations.length} of ${total} locations`}
                />
              </div>
            )}
          </div>

          {/* Modals – NO reloads */}
          <LocationModalCreate triggerRef={addRef} />
          <LocationModalEdit location={selectedLocation} triggerRef={editRef} />
          <LocationModalDelete location={selectedLocation} triggerRef={deleteRef} />
        </div>
      )}
    </>
  );
}