export default function GlobalNotFound() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '72px', margin: '0' }}>404</h1>
      <h2 style={{ fontSize: '24px', marginTop: '16px' }}>Page Not Found</h2>
      <p style={{ marginTop: '8px', color: '#666' }}>
        The page you are looking for doesn&apos;t exist.
      </p>
      <a 
        href="/" 
        style={{
          marginTop: '24px',
          padding: '12px 24px',
          backgroundColor: '#1890ff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '6px'
        }}
      >
        Go Home
      </a>
    </div>
  )
}
