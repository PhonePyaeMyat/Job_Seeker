import React, { useState } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigate, Link } from 'react-router-dom';

const initialState = {
  role: 'jobseeker',
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  resume: null as File | null,
  location: '',
  linkedin: '',
  companyName: '',
  companyWebsite: '',
  businessPhone: '',
  businessLocation: '',
  agree: false,
  alerts: false,
};

const SignUp: React.FC = () => {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked, files } = e.target as any;
    if (type === 'checkbox') {
      setForm({ ...form, [name]: checked });
    } else if (type === 'file') {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const validate = () => {
    if (!form.fullName) return 'Full name is required.';
    if (!form.email) return 'Email is required.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return 'Invalid email address.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    if (!form.agree) return 'You must agree to the Terms and Conditions.';
    if (form.role === 'jobseeker' && !form.location) return 'Location is required.';
    if (form.role === 'employer' && !form.companyName) return 'Company name is required.';
    if (form.role === 'employer' && !form.businessLocation) return 'Business location is required.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, form.email, form.password);
      localStorage.setItem('role', form.role);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: any) {
      const code = err?.code as string | undefined;
      let friendly = err?.message || 'Sign up failed.';
      switch (code) {
        case 'auth/email-already-in-use':
          friendly = 'This email is already in use. Try logging in instead.';
          break;
        case 'auth/invalid-email':
          friendly = 'Invalid email address.';
          break;
        case 'auth/weak-password':
          friendly = 'Password is too weak. Use at least 6 characters with a mix of types.';
          break;
        case 'auth/operation-not-allowed':
          friendly = 'Email/Password sign-in is disabled for this project.';
          break;
        case 'auth/admin-restricted-operation':
          friendly = 'This operation is restricted by the administrator.';
          break;
        case 'auth/api-key-expired':
          friendly = 'The Firebase API key is expired. Please contact support or try again later.';
          break;
      }
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      localStorage.setItem('role', form.role); // You may want to ask for role after Google sign up
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: any) {
      const code = err?.code as string | undefined;
      let friendly = err?.message || 'Google sign-in failed.';
      if (code === 'auth/popup-closed-by-user') friendly = 'Sign-in popup was closed before completing.';
      if (code === 'auth/cancelled-popup-request') friendly = 'Another sign-in is in progress.';
      if (code === 'auth/popup-blocked') friendly = 'Popup was blocked by the browser. Allow popups and try again.';
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Sign Up</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Account Type Selector */}
        <div className="flex gap-4 mb-2">
          <label className="flex items-center">
            <input type="radio" name="role" value="jobseeker" checked={form.role === 'jobseeker'} onChange={handleChange} className="mr-2" />
            Job Seeker
          </label>
          <label className="flex items-center">
            <input type="radio" name="role" value="employer" checked={form.role === 'employer'} onChange={handleChange} className="mr-2" />
            Employer / Recruiter
          </label>
        </div>
        {/* 2. Basic Information */}
        <div>
          <label className="block font-semibold mb-1">Full Name</label>
          <input name="fullName" value={form.fullName} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div>
          <label className="block font-semibold mb-1">Email Address</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div>
          <label className="block font-semibold mb-1">Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full border px-3 py-2 rounded" required minLength={8} />
        </div>
        <div>
          <label className="block font-semibold mb-1">Confirm Password</label>
          <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className="w-full border px-3 py-2 rounded" required minLength={8} />
        </div>
        {/* 3. Additional Fields (Dynamic) */}
        {form.role === 'jobseeker' && (
          <>
            <div>
              <label className="block font-semibold mb-1">Phone Number <span className="text-gray-400">(Optional)</span></label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Upload Resume <span className="text-gray-400">(PDF/DOC)</span></label>
              <input type="file" name="resume" accept=".pdf,.doc,.docx" onChange={handleChange} className="w-full" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Location (City, Country)</label>
              <input name="location" value={form.location} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
            </div>
            <div>
              <label className="block font-semibold mb-1">LinkedIn Profile <span className="text-gray-400">(Optional)</span></label>
              <input name="linkedin" value={form.linkedin} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
            </div>
          </>
        )}
        {form.role === 'employer' && (
          <>
            <div>
              <label className="block font-semibold mb-1">Company Name</label>
              <input name="companyName" value={form.companyName} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
            </div>
            <div>
              <label className="block font-semibold mb-1">Company Website <span className="text-gray-400">(Optional)</span></label>
              <input name="companyWebsite" value={form.companyWebsite} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Phone Number</label>
              <input name="businessPhone" value={form.businessPhone} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
            </div>
            <div>
              <label className="block font-semibold mb-1">Business Location (City, Country)</label>
              <input name="businessLocation" value={form.businessLocation} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
            </div>
          </>
        )}
        {/* 4. Consent & Verification */}
        <div className="flex items-center">
          <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} className="mr-2" required />
          <span>I agree to the <a href="/terms" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Terms and Conditions</a></span>
        </div>
        <div className="flex items-center">
          <input type="checkbox" name="alerts" checked={form.alerts} onChange={handleChange} className="mr-2" />
          <span>I consent to receive job updates and alerts</span>
        </div>
        {/* 5. Buttons */}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">Sign up successful! Redirecting...</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700" disabled={loading || !!validate()}>
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
        <button type="button" onClick={handleGoogleSignUp} className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 mt-2" disabled={loading}>
          Sign Up with Google
        </button>
        <div className="text-center mt-2">
          Already have an account? <Link to="/login" className="text-blue-600 underline">Log in</Link>
        </div>
      </form>
    </div>
  );
};

export default SignUp; 