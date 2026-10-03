"use client";
import { useEffect, useState } from "react";
import { onToast } from "@/lib/toast";
import { IconCheck } from "./icons";

export default function ToastHost() {
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    return onToast((msg) => {
      setMessage(msg);
      setShow(true);
      const t = setTimeout(() => setShow(false), 1800);
      return () => clearTimeout(t);
    });
  }, []);

  return (
    <div className={`toast ${show ? "show" : ""}`} role="status" aria-live="polite">
      <IconCheck />
      {message}
    </div>
  );
}
