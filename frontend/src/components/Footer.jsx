import { Github, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from './ui'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>
            Protecting smart grids with explainable machine learning. Built as an end-to-end
            research project — from raw meter readings to a production-style API.
          </p>
          <div className="footer-tech">
            <span>FastAPI</span><span>React</span><span>scikit-learn</span><span>SQLite</span>
          </div>
        </div>
        <div className="footer-col">
          <h4>Product</h4>
          <Link to="/">Overview</Link>
          <a href="#features">Features</a>
          <a href="#performance">Model performance</a>
          <Link to="/register">Create account</Link>
        </div>
        <div className="footer-col">
          <h4>Resources</h4>
          <a href="#how">How it works</a>
          <a href="#analytics">Dataset insights</a>
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">API docs</a>
          <a href="https://github.com/yaseennaik/Electric_Energy_Theft_Detection_System" target="_blank" rel="noreferrer">
            <Github size={14} /> Source repository
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} VoltGuard · Yaseen Naik</span>
        <span className="footer-motto"><Zap size={13} fill="currentColor" /> Smarter grids start with better signals.</span>
      </div>
    </footer>
  )
}
