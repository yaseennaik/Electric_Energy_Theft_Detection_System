import { ArrowLeft, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/ui'

export default function NotFound() {
  return (
    <div className="notfound">
      <Logo />
      <div className="notfound-code">404</div>
      <h1>This circuit leads nowhere.</h1>
      <p>The page you're looking for was moved, unplugged, or never existed.</p>
      <Link to="/" className="btn btn-primary"><ArrowLeft size={16} /> Back to safety</Link>
      <span className="notfound-zap"><Zap size={18} fill="currentColor" /></span>
    </div>
  )
}
