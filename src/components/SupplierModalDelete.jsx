// src/components/SupplierModalDelete.jsx
"use client";

import { useEffect } from "react";
import {
  Modal,
  Button,
  ModalHeader,
  ModalIcon,
  ModalHeading,
  ModalBody,
  ModalFooter,
  useOverlayState,           // HeroUI v3 state hook
} from "@heroui/react";
import { TrashBin } from "@gravity-ui/icons";
import { useAppContext } from "../context/DataContext";
import { notification } from "antd";
import "antd/dist/antd.css";

export default function SupplierModalDelete({ triggerRef, supplier }) {
  const { token, refetchAllSuppliers } = useAppContext();

  // HeroUI v3 modal state
  const state = useOverlayState({
    defaultOpen: false,
  });

  // Connect hidden trigger button to open modal
  useEffect(() => {
    if (!triggerRef?.current) return;

    const openModal = () => state.open();
    triggerRef.current.addEventListener("click", openModal);

    return () => {
      triggerRef.current?.removeEventListener("click", openModal);
    };
  }, [triggerRef, state]);

  const handleDelete = async () => {
    if (!supplier?._id) {
      notification.warning({
        message: "Warning",
        description: "No supplier selected",
        placement: "topRight",
      });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/supplier/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: supplier._id }), // ← only send id
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete supplier");
      }

      // Success
      notification.success({
        message: "Success",
        description: `Supplier "${supplier.name || "selected supplier"}" deleted successfully!`,
        placement: "topRight",
        duration: 4.5,
      });

      await refetchAllSuppliers?.();   // refresh suppliers table
      state.close();                   // close modal
    } catch (err) {
      console.error("Delete supplier error:", err);
      notification.error({
        message: "Error",
        description: err.message || "Failed to delete supplier",
        placement: "topRight",
        duration: 6,
      });
    }
  };

  return (
    <Modal state={state}>
      {/* Hidden trigger */}
      <Button ref={triggerRef} className="hidden">
        open delete modal
      </Button>

      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />

            <ModalHeader>
              <div className="flex items-center">
                <ModalIcon className="bg-red-100 text-red-600 mr-2">
                  <TrashBin />
                </ModalIcon>
                <ModalHeading className="mt-2">
                  Delete Supplier
                </ModalHeading>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-6">
              <p className="text-gray-600">
                Are you sure you want to delete{" "}
                <strong>{supplier?.name || "this supplier"}</strong>?
              </p>
              <p className="text-sm text-red-600">
                This action cannot be undone.
              </p>
            </ModalBody>

            <ModalFooter>
              <Button slot="close" variant="outline">
                Cancel
              </Button>

              <Button
                variant="danger"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </ModalFooter>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}