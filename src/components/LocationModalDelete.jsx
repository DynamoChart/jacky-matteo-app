// src/components/LocationModalDelete.jsx
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
  useOverlayState,
} from "@heroui/react";
import { TrashBin } from "@gravity-ui/icons";
import { useAppContext } from "../context/DataContext";
import { notification } from "antd";
import "antd/dist/antd.css";

export default function LocationModalDelete({ triggerRef, location }) {
  const { token, refetchAllLocations } = useAppContext();

  const state = useOverlayState({ defaultOpen: false });

  useEffect(() => {
    if (!triggerRef?.current) return;

    const openModal = () => state.open();
    triggerRef.current.addEventListener("click", openModal);

    return () => {
      triggerRef.current?.removeEventListener("click", openModal);
    };
  }, [triggerRef, state]);

  const handleDelete = async () => {
    if (!location?._id) {
      notification.warning({
        message: "Warning",
        description: "No location selected",
        placement: "topRight",
      });
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/location/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: location._id }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to delete location");
      }

      notification.success({
        message: "Success",
        description: `Location "${location.name || "selected"}" deleted successfully!`,
        placement: "topRight",
        duration: 4.5,
      });

      await refetchAllLocations?.();
      state.close();
    } catch (err) {
      notification.error({
        message: "Error",
        description: err.message || "Failed to delete location",
        placement: "topRight",
        duration: 6,
      });
    }
  };

  return (
    <Modal state={state}>
      <Button ref={triggerRef} className="hidden">
        open
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
                  Delete Location
                </ModalHeading>
              </div>
            </ModalHeader>

            <ModalBody className="space-y-6">
              <p className="text-gray-600">
                Are you sure you want to delete{" "}
                <strong>{location?.name || "this location"}</strong>?
              </p>
              <p className="text-sm text-red-600">
                This action cannot be undone.
              </p>
            </ModalBody>

            <ModalFooter>
              <Button slot="close" variant="outline">
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </ModalFooter>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}