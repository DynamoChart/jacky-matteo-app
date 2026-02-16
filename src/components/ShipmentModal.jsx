// src/components/ShipmentModal.jsx
"use client";

import { useEffect, useState } from "react";
import { Modal, Button, Form, Input, Select, DatePicker, Table, Space, Popconfirm, Checkbox} from "antd";
import { Check, Plus, PencilToSquare, TrashBin } from "@gravity-ui/icons";
import { useAppContext } from "../context/DataContext";
import { Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";   // nice drag icon
import dayjs from "dayjs";
import { Collapse } from "antd";
const { Panel } = Collapse;
const { Option } = Select;
import { notification } from "antd";
import "antd/dist/antd.css";
export default function ShipmentModal({
  mode,          // "create" | "edit" | "delete"
  shipment,
  triggerRef,
  onSuccess,
}) {
  const isDelete = mode === "delete";
  const isEdit = mode === "edit";
  const { allSuppliers, allLocations, token,refetchShipments,currentUser } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [attachments, setAttachments] = useState([]);     // will hold [{ name, path }]
  const [uploading, setUploading] = useState(false);
  // Initial values for form
  const initialValues = {
    supplier: null,
    location: null,
    delivery_date: null,
    tracking_number: "",

  missed_delivery: false,      // ← add
    courier: "",
    items: [
      {
        po: "",
        po_line: "",
        quantity: "",
        uom: "FT",
        description: "",
      },
    ],
  };

  // Open modal when trigger is clicked
  useEffect(() => {
    if (triggerRef?.current) {
      triggerRef.current.onclick = () => setVisible(true);
    }
  }, [triggerRef]);

  // Prefill for edit mode
  useEffect(() => {
    if (!isEdit || !shipment) return;

    form.setFieldsValue({
      supplier: shipment.supplier?._id || null,
      location: shipment.location?._id || null,
      delivery_date: shipment.delivery_date ? dayjs(shipment.delivery_date) : null,
      tracking_number: shipment.tracking_number || "",
      courier: shipment.courier || "",
      status: shipment.status || "Scheduled",              // ← add
      missed_delivery: shipment.missed_delivery || false, // ← add
      items: shipment.items?.length > 0
        ? shipment.items.map(item => ({
            ...item,
            key: item._id || Math.random().toString(),
            actual_quantity: item.actual_quantity || "",
          }))
        : initialValues.items,
    });
  }, [shipment, isEdit, form]);
  useEffect(() => {
    if (!visible) {
      setAttachments([]);
      form.resetFields();
    }
  }, [visible, form]);
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const payload = {
        id: shipment?._id,  // always send id for edit AND delete
        ...(mode !== "delete" && {
          supplier: values.supplier,
          location: values.location,
          delivery_date: values.delivery_date ? dayjs(values.delivery_date).toISOString() : undefined,
          tracking_number: values.tracking_number?.trim() || undefined,
          courier: values.courier?.trim() || undefined,
          ...(isEdit && {
            status: values.status || undefined,
            missed_delivery: values.missed_delivery ?? undefined,
          }),
          // ← ADD THIS for create only
          ...(mode === "create" && {
            attachments: attachments.map((f) => f.path), // ["uploads/xxx.pdf"]
          }),
          items: values.items
            .filter(item => item.po || item.description)
            .map(item => ({
              po: item.po?.trim() || "",
              po_line: item.po_line?.trim() || "",
              quantity: Number(item.quantity) || 0,
              uom: item.uom || "FT",
              description: item.description?.trim() || "",
              ...(isEdit && { actual_quantity: Number(item.actual_quantity) || 0 }),
            })),
        }),
      };

      const url =
        mode === "create" ? `${import.meta.env.VITE_API_BASE_URL}/api/shipment/create`
        : mode === "edit" ? `${import.meta.env.VITE_API_BASE_URL}/api/shipment/update`
        : `${import.meta.env.VITE_API_BASE_URL}/api/shipment/delete`;

        const method = "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Shipment action failed");
      }

      notification.success({
        message: "Success",
        description: mode === "create" ? "Shipment created successfully!"
          : mode === "edit" ? "Shipment updated successfully!"
          : "Shipment deleted successfully!",
        placement: "topRight",
        duration: 4.5,
      });
      await refetchShipments();  // ← refresh table data
setVisible(false);         // ← close modal immediately


      onSuccess?.();
      form.resetFields();
   
    } catch (err) {
      console.error("Shipment error:", err);
      notification.error({
        message: "Error",
        description: err.message || "Something went wrong",
        placement: "topRight",
        duration: 6,
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      {/* Hidden trigger button */}
      <Button ref={triggerRef} className="hidden" style={{ display: 'none' }}>
        open modal
      </Button>

      <Modal
        title={
          <div className="flex items-center gap-1 ">
            {mode === "create" && <Plus />}
            {mode === "edit" && <PencilToSquare />}
            {mode === "delete" && <TrashBin />}
            <span>
              {mode === "create" && "Add Shipment"}
              {mode === "edit" && "Edit Shipment"}
              {mode === "delete" && "Delete Shipment"}
            </span>
          </div>
        }
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={mode === "delete"?500:850}
        destroyOnClose
        style={{ top: 20 }}
      
      >
        {isDelete ? (
          <div className="py-2 ">
            <p className="text-lg text-gray-700">
              Are you sure you want to delete shipment{" "}
              <strong>{shipment?.shortId || "this shipment"}</strong>?
            </p>
            <p className="text-red-600 mt-2">This action cannot be undone.</p>
            <div className="flex justify-end gap-3 mt-8">
              <Button onClick={() => setVisible(false)}>Cancel</Button>
              <Button
                type="primary"
                danger
                loading={loading}
                onClick={handleSubmit}
              >
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onFinish={handleSubmit}
            className="mt-4"
          >
            {/* Supplier & Location */}
          {/* Supplier & Location – role-based visibility in edit mode */}
{/* Supplier & Location – role-based in edit mode */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Supplier dropdown rules:
       - admin: always show
       - location: show
       - supplier: hide */}
  {(currentUser?.role === "admin" || currentUser?.role === "location") && (
    <Form.Item
      name="supplier"
      label="Supplier"
      rules={[{ required: true, message: "Please select supplier" }]}
    >
      <Select
        placeholder="Select Supplier"
        allowClear
        showSearch
        optionFilterProp="label"
      >
        {allSuppliers.map((sup) => (
          <Option key={sup._id} value={sup._id} label={sup.name}>
            {sup.name}
          </Option>
        ))}
      </Select>
    </Form.Item>
  )}

  {/* Location dropdown rules:
       - admin: show
       - supplier: show
       - location: hide */}
  {(currentUser?.role === "admin" || currentUser?.role === "supplier") && (
    <Form.Item
      name="location"
      label="Location"
      rules={[{ required: true, message: "Please select location" }]}
    >
      <Select
        placeholder="Select Location"
        allowClear
        showSearch
        optionFilterProp="label"
      >
        {allLocations.map((loc) => (
          <Option key={loc._id} value={loc._id} label={loc.name}>
            {loc.name}
          </Option>
        ))}
      </Select>
    </Form.Item>
  )}
</div>

            {/* Delivery Date + Tracking + Carrier */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Form.Item
  name="delivery_date"
  label="Delivery Date & Time"
  rules={[{ required: true, message: "Delivery date and time is required" }]}
>
  <DatePicker
    showTime={{ format: "HH:mm:ss" }}
    format="YYYY-MM-DD HH:mm:ss"
    placeholder="Select date and time"
    style={{ width: "100%" }}
    
    // 1. No past dates allowed
    disabledDate={(current) => current && current < dayjs().startOf("day")}
    
    // 2. Time restrictions: 06:30 – 22:00 + today's past time protection
    disabledTime={(current) => {
      // If no date is selected yet → allow all for smooth UX
      if (!current) {
        return {
          disabledHours: () => [],
          disabledMinutes: () => [],
          disabledSeconds: () => [],
        };
      }

      const now = dayjs();
      const isToday = current.isSame(now, "day");

      // Current real time values (computed once)
      const nowHour = now.hour();
      const nowMinute = now.minute();
      const nowSecond = now.second();

      return {
        // Always disable hours 00–05 and 23
        disabledHours: () => {
          const alwaysDisabled = [
            ...Array.from({ length: 6 }, (_, i) => i),     // 00–05
            23,                                            // 23
          ];

          if (isToday) {
            // On today: also disable hours before current hour
            return [...alwaysDisabled, ...Array.from({ length: nowHour }, (_, i) => i)];
          }

          return alwaysDisabled;
        },

        // Minutes restriction
        disabledMinutes: (selectedHour) => {
          let disabledMins = [];

          // 06:xx → disable 00–29 minutes
          if (selectedHour === 6) {
            disabledMins = Array.from({ length: 30 }, (_, i) => i);
          }

          // 22:xx → disable 01–59 minutes (only :00 allowed)
          if (selectedHour === 22) {
            disabledMins = Array.from({ length: 59 }, (_, i) => i + 1);
          }

          // Today + current hour selected → disable past minutes
          if (isToday && selectedHour === nowHour) {
            // Merge with existing restrictions (use Set to avoid duplicates)
            disabledMins = [
              ...new Set([
                ...disabledMins,
                ...Array.from({ length: nowMinute }, (_, i) => i),
              ]),
            ];
          }

          return disabledMins;
        },

        // Seconds restriction (only relevant if current minute is selected today)
        disabledSeconds: (selectedHour, selectedMinute) => {
          if (
            isToday &&
            selectedHour === nowHour &&
            selectedMinute === nowMinute
          ) {
            return Array.from({ length: nowSecond }, (_, i) => i);
          }
          return [];
        },
      };
    }}
  />
</Form.Item>

              <Form.Item name="tracking_number" label="Tracking Number">
                <Input placeholder="Enter tracking number" />
              </Form.Item>

              <Form.Item name="courier" label="Carrier">
                <Input placeholder="e.g. DHL, FedEx, UPS" />
              </Form.Item>
            </div>

           
              <div className="mt-2">
  <div className="flex justify-between items-center mb-2">
    <h4 className="text-lg font-semibold">Items</h4>
    <Button
      type="primary"
      icon={<Plus />}
      onClick={() => {
        const items = form.getFieldValue("items") || [];
        form.setFieldsValue({
          items: [
            ...items,
            { po: "", po_line: "", quantity: "", uom: "FT", description: "" },
          ],
        });
      }}
    >
      Add Item
    </Button>
  </div>

  <Form.List name="items">
    {(fields, { remove }) => (
      <div className="space-y-1">
        {fields.map(({ key, name, ...restField }, index) => (
          <Collapse
            key={key}
            size="small"
            defaultActiveKey={["0"]}
            items={[
              {
                key: String(index),
                label: `Item ${index + 1} ${form.getFieldValue(["items", index, "po"]) ? ` - PO: ${form.getFieldValue(["items", index, "po"])}` : ""}`,
                children: (
                  <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-5 gap-2 p-0 bg-gray-50 rounded-lg ">
                    <Form.Item
                      {...restField}
                      name={[name, "po"]}
                      label="PO"
                      rules={[{ required: true, message: "PO is required" }]}
                    >
                      <Input placeholder="PO number" />
                    </Form.Item>

                    <Form.Item {...restField} name={[name, "po_line"]} label="PO Line">
                      <Input placeholder="Line" />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, "quantity"]}
                      label="Quantity"
                      rules={[{ required: true, message: "Quantity required" }]}
                    >
                      <Input type="number" min={1} placeholder="Qty" />
                    </Form.Item>
                    {isEdit && (
                      <Form.Item
                        {...restField}
                        name={[name, "actual_quantity"]}
                        label="Actual Qty"
                       
                      >
                        <Input type="number" min={0} placeholder="Received" />
                      </Form.Item>
                    )}

                    <Form.Item {...restField} name={[name, "uom"]} label="UOM">
                      <Select defaultValue="FT">
                        <Option value="FT">FT</Option>
                        <Option value="LBS">LBS</Option>
                        <Option value="EACH">EACH</Option>
                        <Option value="PIECE">PIECE</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item {...restField} name={[name, "description"]} label="Description">
                      <Input placeholder="Item description" />
                    </Form.Item>

                    <div className="flex items-end">
                      <Popconfirm
                        title="Remove this item?"
                        onConfirm={() => remove(name)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button danger icon={<TrashBin />}>
                          Remove
                        </Button>
                      </Popconfirm>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        ))}
      </div>
    )}
  </Form.List>
</div>
{isEdit && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
    <Form.Item
      name="status"
      label="Status"
      // no required rule → backend + role decides if it's mandatory
    >
      <Select placeholder="Select status">
        <Option value="Received">Received</Option>
        <Option value="Not Received">Not Received</Option>
        <Option value="Delay">Delay</Option>
        <Option value="TBD">TBD</Option>
   
      </Select>
    </Form.Item>

    <Form.Item
      name="missed_delivery"
      label=" "
      valuePropName="checked"
    >
      <Checkbox className="mt-8">
        Missed Delivery
      </Checkbox>
    </Form.Item>
  </div>
)}
{mode === "create" && (
  <div className="mt-6">
    <h4 className="text-lg font-semibold mb-2">Attachment (optional)</h4>
    <Upload.Dragger
      name="attachment"
      multiple={false}                    // change to true if you want multiple later
      showUploadList={true}
      maxCount={1}                        // optional - limit to 1 file
      customRequest={async ({ file, onSuccess, onError }) => {
        try {
          setUploading(true);
          const formData = new FormData();
          formData.append("attachment", file);

          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/shipment/attachment`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                // Do NOT set Content-Type — browser sets multipart with boundary
              },
              body: formData,
            }
          );

          if (!res.ok) {
            const err = await res.text();
            throw new Error(err || "Upload failed");
          }

          const data = await res.json(); // { filename: "uploads/xxx.pdf" }
          const uploadedFile = {
            name: file.name,
            path: data.filename,
          };

          setAttachments([uploadedFile]); // or .push() if multiple=true
          onSuccess("ok");
          notification.success({
            message: "File uploaded",
            description: file.name,
          });
        } catch (err) {
          console.error(err);
          onError(err);
          notification.error({
            message: "Upload failed",
            description: err.message,
          });
        } finally {
          setUploading(false);
        }
      }}
      onRemove={() => {
        setAttachments([]);
        return true;
      }}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">Click or drag file to this area to upload</p>
      <p className="ant-upload-hint">
        Support for single file upload (PDF, images, docs, etc.)
      </p>
    </Upload.Dragger>
  </div>
)}

            {/* Submit buttons */}
            <div className="flex justify-end gap-4 mt-10">
              <Button onClick={() => setVisible(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="primary"
                loading={loading || uploading}
                onClick={handleSubmit}
                disabled={uploading}
              >
                {isEdit ? "Update Shipment" : "Create Shipment"}
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </>
  );
}