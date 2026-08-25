"use client";
import { useEffect, useState } from "react";
import { onToast } from "@/lib/toast";

export default function ToastHost() {
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    return onToast((msg) => {
      setMessage(msg);
      setShow(true);
      const t = setTimeout(() => setShow(false), 1400);
      return () => clearTimeout(t);
    });
  }, []);

  return (
    <div className={`toast ${show ? "show" : ""}`}>
      {message}
    </div>
  );
}
