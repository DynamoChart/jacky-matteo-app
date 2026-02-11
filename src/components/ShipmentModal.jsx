// src/components/ShipmentModal.jsx
"use client";

import { useEffect, useState } from "react";
import { Modal, Button, Form, Input, Select, DatePicker, Table, Space, Popconfirm } from "antd";
import { Check, Plus, PencilToSquare, TrashBin } from "@gravity-ui/icons";
import { useAppContext } from "../context/DataContext";
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
  const { allSuppliers, allLocations, token,refetchShipments } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();

  // Initial values for form
  const initialValues = {
    supplier: null,
    location: null,
    delivery_date: null,
    tracking_number: "",
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
      items: shipment.items?.length > 0
        ? shipment.items.map(item => ({
            ...item,
            key: item._id || Math.random().toString(),
          }))
        : initialValues.items,
    });
  }, [shipment, isEdit, form]);

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
          items: values.items
            .filter(item => item.po || item.description)
            .map(item => ({
              po: item.po?.trim() || "",
              po_line: item.po_line?.trim() || "",
              quantity: Number(item.quantity) || 0,
              uom: item.uom || "FT",
              description: item.description?.trim() || "",
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
          <div className="flex items-center gap-3 ">
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
        width={mode === "delete"?500:800}
        destroyOnClose
      
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            {/* Delivery Date + Tracking + Carrier */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Form.Item
  name="delivery_date"
  label="Delivery Date & Time"
  rules={[{ required: true, message: "Delivery date and time is required" }]}
>
  <DatePicker
    showTime={{ format: "HH:mm:ss" }}          // ← enables time picker with seconds
    format="YYYY-MM-DD HH:mm:ss"               // ← display format
    placeholder="Select date and time"
    style={{ width: "100%" }}
    disabledDate={(current) => current && current < dayjs().startOf("day")}
    disabledTime={(current) => {
      // Optional: disable past times on today's date
      if (current && current.isSame(dayjs(), "day")) {
        return {
          disabledHours: () => Array.from({ length: dayjs().hour() }, (_, i) => i),
          disabledMinutes: (hour) =>
            hour === dayjs().hour()
              ? Array.from({ length: dayjs().minute() }, (_, i) => i)
              : [],
          disabledSeconds: (hour, minute) =>
            hour === dayjs().hour() && minute === dayjs().minute()
              ? Array.from({ length: dayjs().second() }, (_, i) => i)
              : [],
        };
      }
      return {};
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
          

            {/* Submit buttons */}
            <div className="flex justify-end gap-4 mt-10">
              <Button onClick={() => setVisible(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="primary"
                loading={loading}
                onClick={handleSubmit}
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