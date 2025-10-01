"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AQIStandardInfo() {
  const [open, setOpen] = useState(false);

  // ข้อมูลเกณฑ์สี AQI
  const standards = [
    { color: "bg-green-500", label: "ดี", range: "0 – 50" },
    { color: "bg-yellow-400", label: "ปานกลาง", range: "51 – 100" },
    { color: "bg-orange-400", label: "มีผลกระทบต่อสุขภาพบางกลุ่ม", range: "101 – 150" },
    { color: "bg-red-500", label: "ไม่ดีต่อสุขภาพ", range: "151 – 200" },
    { color: "bg-purple-600", label: "อันตราย", range: "201+" },
  ];

  return (
    <div className="fixed top-5 right-5 z-50">
      {/* ปุ่มไอคอน */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-blue-200 text-blue-500 shadow"
      >
        <Info size={18} />
      </button>

      {/* Popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-4 shadow-lg border text-sm"
          >
            <p className="font-semibold text-gray-800 mb-2">ความหมายของสีค่าฝุ่น (AQI)</p>
            <div className="space-y-2">
              {standards.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded ${s.color}`} />
                  <span className="font-medium">{s.label}</span>
                  <span className="text-gray-500 text-xs">({s.range})</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
