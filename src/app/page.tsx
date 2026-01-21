import FindScooterButton from '../components/FindScooterButton'

export default function Home() {
  return (
    <main style={{ 
      padding: "2rem", 
      textAlign: "center",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: "2rem"
    }}>
      <div>
        <h1 style={{ 
          fontSize: "2.5rem", 
          fontWeight: "700", 
          marginBottom: "0.5rem",
          color: "#1f2937"
        }}>
          Welcome to Scooter
        </h1>
        <p style={{ 
          fontSize: "1.125rem", 
          color: "#6b7280",
          marginBottom: "2rem"
        }}>
          Find a scooter near you
        </p>
      </div>
      <FindScooterButton />
    </main>
  )
}
