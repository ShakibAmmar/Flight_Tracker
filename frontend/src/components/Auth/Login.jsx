import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, X } from 'lucide-react';
import { auth } from '../firebase/firebase'; // Added Firebase import // Added Firebase Auth method
import './Login.css';
import { apiUrl } from '../../utils/api';
import { 
  sendPasswordResetEmail, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';

const Login = ({ isOpen, onClose }) => {
  // views: 'login', 'signup', 'forgot'
  const [view, setView] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState({ type: '', text: '' });

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

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    setServerMessage({ type: '', text: '' });

    // --- 1. FORGOT PASSWORD VIEW ---
    if (view === 'forgot') {
      try {
        await sendPasswordResetEmail(auth, formData.email);
        setServerMessage({ 
          type: 'success', 
          text: 'Reset link sent! Please check your Spam/Junk folder.' 
        });
      } catch (err) {
        setServerMessage({ type: 'error', text: 'Error: ' + err.message });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // --- 2. SIGNUP VIEW ---
    if (view === 'signup') {
      try {
        await createUserWithEmailAndPassword(auth, formData.email, formData.password);

        const signupResponse = await fetch(apiUrl('/api/auth/signup'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const signupData = await signupResponse.json();

        if (signupResponse.ok) {
          setServerMessage({ type: 'success', text: 'Account created! Please login.' });
          setView('login');
        } else {
          setServerMessage({ type: 'error', text: signupData.error || 'Backend signup failed' });
        }
      } catch (err) {
        setServerMessage({ type: 'error', text: 'Signup Error: ' + err.message });
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    // --- 3. LOGIN VIEW (Updated to use Firebase) ---
    try {
      // First, authenticate with Firebase using the NEW password
      await signInWithEmailAndPassword(auth, formData.email, formData.password);

      // If Firebase succeeds, proceed to log in to your local backend
      const loginResponse = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok) {
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        onClose(); 
        window.location.reload(); 
      } else {
        // This handles cases where Firebase succeeds but local backend still has old info
        setServerMessage({ 
          type: 'error', 
          text: 'Firebase login successful, but local server error: ' + (loginData.error || 'Invalid local credentials') 
        });
      }
    } catch (err) {
      // This catches incorrect passwords for the registered user
      setServerMessage({ 
        type: 'error', 
        text: 'Invalid credentials. Please check your email and NEW password.' 
      });
    } finally {
      setIsLoading(false);
    }
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
              : "Access your flight tracking more easily."}
          </p>
        </div>

        {/* --- Server Response Messages --- */}
        {serverMessage.text && (
          <div className={`server-alert ${serverMessage.type}`}>
            {serverMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {view === 'signup' && (
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-field">
                <User size={18} className="icon" />
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
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
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
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
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
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
          <button onClick={() => {
            setView(view === 'login' ? 'signup' : 'login');
            setServerMessage({ type: '', text: '' }); // Clear messages when switching
          }}>
            {view === 'login' ? 'Create one' : 'Login here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
