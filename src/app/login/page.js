"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res.error) {
        setError("Credenciales inválidas");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass">
        <div className="login-header">
          <h1><span>Pract</span><span style={{ color: 'var(--primary)' }}>ii</span><span>ko</span></h1>
          <p>Panel de Autogestión</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@practiiko.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Entrar al Panel"}
          </button>
        </form>
        
        <div className="login-footer">
          <p>© {new Date().getFullYear()} Practiiko. Todos los derechos reservados.</p>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: radial-gradient(circle at top right, #e7f1f9, #f8f9fa);
        }
        
        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 3rem;
          border-radius: 1.5rem;
          background: #ffffff;
          box-shadow: 0 20px 40px rgba(4, 119, 191, 0.1);
          border: 1px solid #e9ecef;
        }
        
        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        
        .login-header h1 {
          font-family: var(--font-plus-jakarta), sans-serif;
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.05em;
          color: var(--secondary);
        }
        
        .login-header p {
          color: #6c757d;
          margin-top: 0.5rem;
          font-weight: 500;
        }
        
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #495057;
        }
        
        .form-group input {
          padding: 0.875rem 1.25rem;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 0.75rem;
          color: var(--foreground);
          outline: none;
          transition: all 0.2s;
        }
        
        .form-group input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(4, 119, 191, 0.1);
          background: #ffffff;
        }
        
        .error-message {
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 0.75rem;
          color: #dc3545;
          font-size: 0.875rem;
          text-align: center;
          font-weight: 500;
        }
        
        .btn-primary {
          width: 100%;
          padding: 1rem;
          font-size: 1rem;
          margin-top: 0.5rem;
          font-weight: 700;
        }
        
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .login-footer {
          margin-top: 2.5rem;
          text-align: center;
          font-size: 0.75rem;
          color: #adb5bd;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
