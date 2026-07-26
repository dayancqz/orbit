"use client";

// Catches errors thrown by the root layout itself (theme cookie parsing,
// session lookup, etc.) — error.tsx can't catch those since it renders
// inside the layout. Deliberately dependency-free: if the layout is what
// broke, this must not import anything that could break the same way.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#0b0b0f",
          color: "#f5f5f7",
        }}
      >
        <p style={{ fontSize: 18, fontWeight: 600 }}>Something went wrong</p>
        <p style={{ fontSize: 14, opacity: 0.7, maxWidth: 320 }}>
          Orbit hit an unexpected error loading the app. Try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            borderRadius: 999,
            padding: "8px 20px",
            fontSize: 14,
            fontWeight: 600,
            background: "#e63946",
            color: "#fff",
            border: "none",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
