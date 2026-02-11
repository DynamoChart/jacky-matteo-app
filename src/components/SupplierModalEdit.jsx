// src/components/SupplierModalEdit.jsx
"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  ModalHeader,
  ModalIcon,
  ModalHeading,
  ModalBody,
  ModalFooter,
  Form,
  Input,
  Label,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { Check, PencilToSquare } from "@gravity-ui/icons";
import { useAppContext } from "../context/DataContext";
import { notification } from "antd";
import "antd/dist/antd.css";

export default function SupplierModalEdit({ triggerRef, supplier }) {
  const { token, refetchAllSuppliers } = useAppContext();

  // HeroUI v3 modal state
  const state = useOverlayState({
    defaultOpen: false,
  });

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Prefill name when supplier prop changes (when modal opens)
  useEffect(() => {
    if (supplier?.name) {
      setName(supplier.name);
    }
  }, [supplier]);

  // Connect hidden trigger to open modal
  useEffect(() => {
    if (!triggerRef?.current) return;

    const openModal = () => state.open();
    triggerRef.current.addEventListener("click", openModal);

    return () => {
      triggerRef.current?.removeEventListener("click", openModal);
    };
  }, [triggerRef, state]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      notification.warning({
        message: "Warning",
        description: "Supplier name is required",
        placement: "topRight",
      });
      return;
    }

    if (!supplier?._id) {
      notification.error({
        message: "Error",
        description: "No supplier selected for update",
        placement: "topRight",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/supplier/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: supplier._id,
          name: name.trim(),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to update supplier");
      }

      // Success
      notification.success({
        message: "Success",
        description: "Supplier updated successfully!",
        placement: "topRight",
        duration: 4.5,
      });

      await refetchAllSuppliers?.();   // refresh table
      state.close();                   // close modal
    } catch (err) {
      console.error("Update supplier error:", err);
      notification.error({
        message: "Error",
        description: err.message || "Failed to update supplier",
        placement: "topRight",
        duration: 6,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal state={state}>
      {/* Hidden trigger */}
      <Button ref={triggerRef} className="hidden">
        open edit modal
      </Button>

      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />

            <ModalHeader>
              <div className="flex items-center">
                <ModalIcon className="bg-blue-100 text-blue-600 mr-2">
                  <PencilToSquare />
                </ModalIcon>
                <ModalHeading className="mt-2">
                  Edit Supplier
                </ModalHeading>
              </div>
            </ModalHeader>

            <ModalBody>
              <Form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
                <TextField isRequired>
                  <Label>Supplier Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="rounded-xl border border-border/70 bgsurface px-4 py-2 shadow-sm focus-visible:border-primary"
                  />
                </TextField>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    <Check />
                    {loading ? "Updating..." : "Update"}
                  </Button>
                  <Button slot="close" variant="secondary" disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </Form>
            </ModalBody>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}