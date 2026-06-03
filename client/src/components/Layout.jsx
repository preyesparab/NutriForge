import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0c" }}>
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
