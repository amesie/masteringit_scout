"use client"

import { useState } from "react"

export default function PhoneReveal({ phone }: { phone: string | null }) {
  const [revealed, setRevealed] = useState(false)
  if (!phone) return null
  return (
    <button onClick={() => setRevealed(r => !r)}
      title={revealed ? phone : "Show number"}
      type="button"
      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
      style={{ color: revealed ? "#FD3352" : "#8A8580" }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
      </svg>
    </button>
  )
}
