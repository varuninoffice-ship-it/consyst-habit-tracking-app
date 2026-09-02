"use client";

export default function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="inline-flex items-center px-5 py-2.5 rounded-lg bg-teal text-white text-[13px] font-semibold hover:bg-[#178a64] transition-colors"
    >
      Try again
    </button>
  );
}
