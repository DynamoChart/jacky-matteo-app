import React, { useState, useRef } from 'react';
import { Button } from "@heroui/react";
import * as XLSX from 'xlsx';
import { useAppContext } from "../context/DataContext";
import { notification } from 'antd';
import { DownloadOutlined } from '@ant-design/icons'; // ← Ant Design icon for download

const BulkUpload = () => {
  const { allSuppliers, allLocations, token, currentUser, refetchShipments } = useAppContext();

  const [processedShipments, setProcessedShipments] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'parse-success' | 'uploading'
  const fileInputRef = useRef(null);

  // Download sample Excel file from /public/Sample_Excel.xlsx
  const handleDownloadSample = () => {
    const link = document.createElement('a');
    link.href = '/Sample_Excel.xlsx'; // assumes file is in public/ folder
    link.download = 'Sample_Excel.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  };

  const handleButtonClick = () => {
    // If we have processed data → trigger upload
    if (processedShipments && uploadStatus === 'parse-success') {
      handleUploadToServer();
      return;
    }

    // Otherwise → open file picker
    fileInputRef.current?.click();
  };

  const findSupplierId = (name) => {
    if (!name || !allSuppliers) return null;
    const supplier = allSuppliers.find(
      (s) => s.name?.trim().toLowerCase() === name.trim().toLowerCase()
    );
    return supplier?._id || null;
  };

  const findLocationId = (name) => {
    if (!name || !allLocations) return null;
    const location = allLocations.find(
      (l) => l.name?.trim().toLowerCase() === name.trim().toLowerCase()
    );
    return location?._id || null;
  };

  const parseExcelDateToDateOnly = (serial) => {
    if (!serial || isNaN(parseFloat(serial))) return null;

    const utcDays = Math.floor(serial - 25569);
    const fraction = serial % 1;
    const totalSeconds = utcDays * 86400 + fraction * 86400;
    const date = new Date(totalSeconds * 1000);

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus(null);
    setProcessedShipments(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (typeof data !== 'string') throw new Error('Invalid file data');

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rawRows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          blankrows: false,
        });

        if (rawRows.length < 1) throw new Error('No headers found');

        const headers = rawRows[0].map(h => (h || '').toString().trim().toLowerCase());

        const colIndices = {
          supplier: headers.indexOf('supplier'),
          location: headers.indexOf('location'),
          delivery_date: headers.indexOf('delivery_date'),
          tracking_number: headers.indexOf('tracking_number'),
          courier: headers.indexOf('courier'),
        };

        if (Object.values(colIndices).some(idx => idx === -1)) {
          throw new Error('Missing required headers: supplier, location, delivery_date, tracking_number, courier');
        }

        const dataRows = rawRows.slice(1).filter(row => row.some(cell => cell !== ''));

        const shipments = [];
        const userId = currentUser?.id;

        if (!userId) {
          console.warn("No currentUser.id found — created_by will be missing");
        }

        dataRows.forEach((row) => {
          const supplierName = (row[colIndices.supplier] || '').toString().trim();
          const locationName = (row[colIndices.location] || '').toString().trim();
          const deliveryDateRaw = row[colIndices.delivery_date]?.toString().trim() || '';
          const trackingNumber = (row[colIndices.tracking_number] || 'None').toString().trim();
          const courier = (row[colIndices.courier] || 'Our truck').toString().trim();

          if (!supplierName) return;

          const supplierId = findSupplierId(supplierName);
          const locationId = findLocationId(locationName);

          if (!supplierId || !locationId) return;

          const items = [];
          const startItemCol = Math.max(...Object.values(colIndices)) + 1;

          for (let i = startItemCol; i < headers.length; i += 5) {
            const po = (row[i] || '').toString().trim();
            if (!po) continue;

            const po_line = (row[i + 1] || '001').toString().trim();
            const quantityStr = row[i + 2]?.toString().trim() || '0';
            const uom = (row[i + 3] || 'LBS').toString().trim();

            const quantity = Number(quantityStr.replace(/[^0-9.-]+/g, '')) || 0;

            items.push({ po, po_line, quantity, uom });
          }

          if (items.length === 0) return;

          const parsedDate = parseExcelDateToDateOnly(deliveryDateRaw);
          if (!parsedDate) return;

          shipments.push({
            supplier: supplierId,
            location: locationId,
            delivery_date: parsedDate,
            tracking_number: trackingNumber,
            courier: courier,
            items,
            attachments: [],
            created_by: userId
          });
        });

        if (shipments.length === 0) {
          throw new Error('No valid shipments created from the file');
        }

        setProcessedShipments(shipments);
        setUploadStatus('parse-success');
      } catch (err) {
        console.error('Processing error:', err);
        notification.error({
          message: 'Error',
          description: err.message || 'Failed to process Excel file',
          placement: 'topRight',
        });
      }

      e.target.value = '';
    };

    reader.readAsBinaryString(file);
  };

  const handleUploadToServer = async () => {
    if (!processedShipments || !token) return;

    setUploadStatus('uploading');

    try {
      const payload = { shipments: processedShipments };

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/shipment/createBulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || `Server error (${res.status})`);
      }

      const createdCount = responseData.created_count || 0;
      const failedCount = responseData.failed_count || 0;
      const hasErrors = responseData.errors?.length > 0;

      if (failedCount > 0 || hasErrors) {
        notification.warning({
          message: 'Partial Success',
          description: `${createdCount} shipment${createdCount !== 1 ? 's' : ''} created, ${failedCount} failed.`,
          placement: 'topRight',
          duration: 6,
        });
      } else if (createdCount > 0) {
        notification.success({
          message: 'Success',
          description: `${createdCount} shipment${createdCount !== 1 ? 's' : ''} created successfully!`,
          placement: 'topRight',
          duration: 4.5,
        });
      } else {
        notification.warning({
          message: 'No Shipments Created',
          description: 'Server processed the request but created 0 shipments.',
          placement: 'topRight',
          duration: 6,
        });
      }

      if (createdCount > 0) {
        refetchShipments?.();
      }

      setProcessedShipments(null);
      setUploadStatus(null);

    } catch (err) {
      console.error('Upload failed:', err);
      notification.error({
        message: 'Error',
        description: err.message || 'Failed to upload shipments',
        placement: 'topRight',
        duration: 6,
      });
      setUploadStatus(null);
    }
  };

  const buttonText = uploadStatus === 'parse-success'
    ? 'Confirm & Upload'
    : uploadStatus === 'uploading'
    ? 'Uploading...'
    : 'Bulk Upload Excel';

  const buttonDisabled = uploadStatus === 'uploading';

  return (
    <div className="p-0 relative">
      <input
        type="file"
        accept=".xls,.xlsx"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main button with download icon on the top-right */}
      <div className="relative inline-block">
        <Button
          className={`${
            uploadStatus === 'parse-success'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-warning-soft text-yellow-600'
          }`}
          onPress={handleButtonClick}
          disabled={buttonDisabled}
        >
          {buttonText}
        </Button>

        {/* Download icon - positioned top-right of the button */}
        {uploadStatus !== 'parse-success' && uploadStatus !== 'uploading' && (
          <button
            onClick={handleDownloadSample}
            className="absolute -top-0 -right-4 bg-blue cursor-pointer rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
            title="Download sample Excel template"
          >
            <DownloadOutlined className="text-blue-400 text-lg" />
          </button>
        )}
      </div>
    </div>
  );
};

export default BulkUpload;