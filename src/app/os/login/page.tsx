import LoginForm from "./LoginForm"

export const metadata = { title: "Sign in" }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <div className="login">
      <div className="card">
        <div className="brand" style={{ padding: "0 0 18px" }}>
          <span className="logo">L</span>
          <div><strong>Loam OS</strong><small>Private</small></div>
        </div>
        <LoginForm next={next ?? "/os"} />
      </div>
    </div>
  )
}
export const maxDuration = 30
