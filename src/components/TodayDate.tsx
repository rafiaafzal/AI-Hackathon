"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getServerSnapshot() {
  return "";
}

export default function TodayDate() {
  const dateStr = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return <span>{dateStr || "\u00A0"}</span>;
}
