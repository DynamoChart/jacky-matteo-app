// src/components/LoadingStates.jsx
"use client";

import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { Button, Card } from "@heroui/react";

export default function LoadingStates({
  isInitialLoading,
  shipmentsLoading,
  shipmentsError,
  shipments,
  refetchShipments,
  addRef,
  emptyIcon = null,
  emptyTitle = "No Data Found",
  emptyDescription = "There is no data to display at the moment.",
  retryButtonText = "Retry",
}) {
  if (isInitialLoading || shipmentsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Loader2 className="h-16 w-16 text-indigo-600" />
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-2xl font-semibold text-gray-800"
          >
            Loading counter requests...
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-gray-500 max-w-md mx-auto"
          >
            We're fetching the latest data from the server.
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (shipmentsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100"
        >
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Something went wrong</h2>
          <p className="text-gray-600 mb-6">
            {shipmentsError || "Failed to load data. Please try again."}
          </p>
          <Button
            variant="primary"
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => refetchShipments?.()}
          >
            {retryButtonText}
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!shipments || shipments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-white flex items-center justify-center p-6"
      >
        <Card className="max-w-lg w-full text-center py-16 shadow-lg border border-gray-200 rounded-3xl">
          {emptyIcon || <Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />}
          <h3 className="text-2xl font-bold text-gray-800 mb-3">{emptyTitle}</h3>
          <p className="text-gray-500 mb-8">{emptyDescription}</p>
          {addRef && (
            <Button
              variant="primary"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => addRef.current?.click()}
            >
              Add First Request
            </Button>
          )}
        </Card>
      </motion.div>
    );
  }

  return null;
}