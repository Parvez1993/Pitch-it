"use client";

import Script from "next/script";

export default function ScriptWrapper({ id, strategy, src }) {
  return (
    <Script
      id={id}
      strategy={strategy}
      src={src}
      onError={(e) => console.error("Script failed to load", e)}
    />
  );
}
