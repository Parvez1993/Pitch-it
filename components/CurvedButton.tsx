import React from "react";

export default function CurvedButton() {
  return (
    <div className="p-2 bg-yellow-300">
      <div className="relative inline-block">
        {/* Top Left Corner */}
        <svg
          className="absolute top-0 left-0 w-3 h-3"
          viewBox="0 0 12 12"
          fill="black"
        >
          <path d="M0 0L12 0L0 12z" />
        </svg>

        {/* Bottom Right Corner */}
        <svg
          className="absolute bottom-0 right-0 w-3 h-3"
          viewBox="0 0 12 12"
          fill="black"
        >
          <path d="M12 12L0 12L12 0z" />
        </svg>

        {/* Main Button */}
        <button className="bg-yellow-300 px-2 py-2 text-black font-extrabold text-[17px]">
          <span>PITCH,</span>{" "}
          <span className="relative">
            VOTE
            <span className="absolute left-0 -bottom-1 w-full h-0.5 bg-white mt-2 ml-2"></span>
          </span>
          <span>, AND GROW</span>
        </button>
      </div>
    </div>
  );
}
