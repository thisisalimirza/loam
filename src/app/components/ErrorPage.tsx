interface ErrorPageProps {
  message: string
  error?: Error
  type?: "error" | "not-found"
}

export default function ErrorPage({ 
  message, 
  error, 
  type = "error" 
}: ErrorPageProps) {
  const className = type === "error" ? "error-page" : "not-found"
  
  return (
    <div className={className}>
      <h1>{type === "error" ? "Error" : "404"}</h1>
      <p>{message}</p>
      {error && process.env.NODE_ENV === "development" && (
        <details style={{ marginTop: "1rem", textAlign: "left" }}>
          <summary>Error Details (Development Only)</summary>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>
            {error.message}
            {error.stack && `\n\nStack:\n${error.stack}`}
          </pre>
        </details>
      )}
    </div>
  )
}