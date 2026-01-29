import  { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, X } from 'lucide-react';
import './Login.css';

const Login = ({ isOpen, onClose }) => {
  // views: 'login', 'signup', 'forgot'
  const [view, setView] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const validate = () => {
    let newErrors = {};
    if (!formData.email.includes('@')) newErrors.email = 'Valid email required';
    
    if (view !== 'forgot') {
      if (formData.password.length < 6) newErrors.password = 'Min 6 characters';
    }
    if (view === 'signup' && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    // Backend Simulation
    console.log(`Action: ${view}`, formData);
    
    setTimeout(() => {
      setIsLoading(false);
      if (view === 'forgot') {
        alert("Reset link sent to " + formData.email);
        setView('login');
      } else {
        onClose();
      }
    }, 1500);
  };

  return (
    <div className="login-overlay">
      <div className="login-modal">
        <button className="close-btn" onClick={onClose}><X size={20} /></button>
        
        <div className="login-header">
          {view === 'forgot' && (
            <button className="back-btn" onClick={() => setView('login')}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <h2>
            {view === 'login' && 'Welcome Back'}
            {view === 'signup' && 'Create Account'}
            {view === 'forgot' && 'Reset Password'}
          </h2>
          <p>
            {view === 'forgot' 
              ? "Enter your email to receive a password reset link." 
              : "Access your flight tracking more easily ."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {view === 'signup' && (
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-field">
                <User size={18} className="icon" />
                <input 
                  type="text" 
                  placeholder=" Your Name " 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              {errors.name && <span className="error">{errors.name}</span>}
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <div className="input-field">
              <Mail size={18} className="icon" />
              <input 
                type="email" 
                placeholder="name@example.com" 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            {errors.email && <span className="error">{errors.email}</span>}
          </div>

          {view !== 'forgot' && (
            <div className="input-group">
              <div className="label-row">
                <label>Password</label>
                {view === 'login' && (
                  <button type="button" className="forgot-text" onClick={() => setView('forgot')}>
                    Forgot?
                  </button>
                )}
              </div>
              <div className="input-field">
                <Lock size={18} className="icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button type="button" className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="error">{errors.password}</span>}
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? "Please wait..." : (
              view === 'login' ? "Login" : view === 'signup' ? "Sign Up" : "Send Reset Link"
            )}
          </button>
        </form>

        <div className="toggle-auth">
          {view === 'login' ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => setView(view === 'login' ? 'signup' : 'login')}>
            {view === 'login' ? 'Create one' : 'Login here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;