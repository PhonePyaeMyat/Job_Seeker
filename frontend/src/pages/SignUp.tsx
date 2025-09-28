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

const EnhancedSignUp: React.FC = () => {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      
      // Set admin role for specific admin credentials
      let userRole = form.role;
      if (form.email === 'admin@jobseeker.com' || form.fullName === 'admin') {
        userRole = 'admin';
      }
      
      localStorage.setItem('role', userRole);
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
      localStorage.setItem('role', form.role);
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

  const nextStep = () => {
    const step1Fields = ['role', 'fullName', 'email', 'password', 'confirmPassword'];
    const missingFields = step1Fields.filter(field => !form[field as keyof typeof form]);
    
    if (missingFields.length > 0 || form.password !== form.confirmPassword) {
      setError('Please complete all required fields correctly before continuing.');
      return;
    }
    
    setError(null);
    setCurrentStep(2);
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(form.password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Job Seeker</h1>
            <p className="text-gray-600">Start your journey to find the perfect career opportunity</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-400'}`}>
                {currentStep > 1 ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  '1'
                )}
              </div>
              <div className={`w-16 h-1 ${currentStep > 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-400'}`}>
                2
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {currentStep === 1 && (
                <>
                  {/* Step 1: Basic Information */}
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                    <p className="text-gray-600 text-sm mt-1">Let's start with the essentials</p>
                  </div>

                  {/* Account Type */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">I'm looking to:</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${form.role === 'jobseeker' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                        <input 
                          type="radio" 
                          name="role" 
                          value="jobseeker" 
                          checked={form.role === 'jobseeker'} 
                          onChange={handleChange} 
                          className="sr-only" 
                        />
                        <div className="flex items-center">
                          <div className="mr-3 p-2 bg-blue-100 rounded-full">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2M8 6V4m0 2v10a2 2 0 002 2h4a2 2 0 002-2V8a2 2 0 002-2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium">Find a Job</div>
                            <div className="text-sm text-gray-500">I'm looking for opportunities</div>
                          </div>
                        </div>
                      </label>
                      
                      <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${form.role === 'employer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                        <input 
                          type="radio" 
                          name="role" 
                          value="employer" 
                          checked={form.role === 'employer'} 
                          onChange={handleChange} 
                          className="sr-only" 
                        />
                        <div className="flex items-center">
                          <div className="mr-3 p-2 bg-purple-100 rounded-full">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium">Hire Talent</div>
                            <div className="text-sm text-gray-500">I want to post jobs</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input 
                        name="fullName" 
                        value={form.fullName} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                        placeholder="Enter your full name"
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="email" 
                        name="email" 
                        value={form.email} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                        placeholder="Enter your email"
                        required 
                      />
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          name="password" 
                          value={form.password} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                          placeholder="Create a strong password"
                          required 
                          minLength={8}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      
                      {/* Password Strength Indicator */}
                      {form.password && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div 
                                key={level}
                                className={`h-1 flex-1 rounded-full ${
                                  passwordStrength >= level ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                                }`}
                              ></div>
                            ))}
                          </div>
                          <p className={`text-xs mt-1 ${passwordStrength >= 3 ? 'text-green-600' : 'text-gray-500'}`}>
                            {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : ''}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input 
                          type={showConfirmPassword ? 'text' : 'password'} 
                          name="confirmPassword" 
                          value={form.confirmPassword} 
                          onChange={handleChange} 
                          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            form.confirmPassword && form.password !== form.confirmPassword 
                              ? 'border-red-300 bg-red-50' 
                              : 'border-gray-300'
                          }`}
                          placeholder="Confirm your password"
                          required 
                          minLength={8}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {form.confirmPassword && form.password !== form.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={nextStep}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  {/* Step 2: Additional Information */}
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Additional Information</h2>
                    <p className="text-gray-600 text-sm mt-1">Help us personalize your experience</p>
                  </div>

                  {form.role === 'jobseeker' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location <span className="text-red-500">*</span>
                          </label>
                          <input 
                            name="location" 
                            value={form.location} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                            placeholder="City, State/Country"
                            required 
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input 
                            name="phone" 
                            value={form.phone} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                            placeholder="Your phone number"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          LinkedIn Profile
                        </label>
                        <input 
                          name="linkedin" 
                          value={form.linkedin} 
                          onChange={handleChange} 
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                          placeholder="https://linkedin.com/in/yourprofile"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Resume (PDF/DOC)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                          <input 
                            type="file" 
                            name="resume" 
                            accept=".pdf,.doc,.docx" 
                            onChange={handleChange} 
                            className="hidden" 
                            id="resume-upload"
                          />
                          <label htmlFor="resume-upload" className="cursor-pointer">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="mt-4">
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                {form.resume ? form.resume.name : 'Drop your resume here or click to upload'}
                              </span>
                              <span className="mt-1 block text-xs text-gray-500">PDF, DOC up to 10MB</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {form.role === 'employer' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company Name <span className="text-red-500">*</span>
                          </label>
                          <input 
                            name="companyName" 
                            value={form.companyName} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                            placeholder="Your company name"
                            required 
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company Website
                          </label>
                          <input 
                            name="companyWebsite" 
                            value={form.companyWebsite} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                            placeholder="https://yourcompany.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Phone <span className="text-red-500">*</span>
                          </label>
                          <input 
                            name="businessPhone" 
                            value={form.businessPhone} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                            placeholder="Business phone number"
                            required 
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Location <span className="text-red-500">*</span>
                          </label>
                          <input 
                            name="businessLocation" 
                            value={form.businessLocation} 
                            onChange={handleChange} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                            placeholder="City, State/Country"
                            required 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Agreements */}
                  <div className="space-y-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="agree" 
                        checked={form.agree} 
                        onChange={handleChange} 
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        required 
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the <Link to="/terms" className="text-blue-600 underline hover:text-blue-800" target="_blank">Terms and Conditions</Link> and <Link to="/privacy" className="text-blue-600 underline hover:text-blue-800" target="_blank">Privacy Policy</Link> <span className="text-red-500">*</span>
                      </span>
                    </label>
                    
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="alerts" 
                        checked={form.alerts} 
                        onChange={handleChange} 
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                      />
                      <span className="text-sm text-gray-700">
                        I want to receive job alerts and updates via email
                      </span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-6">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-gray-600 hover:text-gray-800 font-medium"
                    >
                      ← Back
                    </button>
                    
                    <div className="space-y-3">
                      {/* Google Sign Up */}
                      <button
                        type="button"
                        onClick={handleGoogleSignUp}
                        disabled={loading}
                        className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {loading ? 'Signing up...' : 'Continue with Google'}
                      </button>

                      {/* Regular Sign Up */}
                      <button
                        type="submit"
                        disabled={loading || !!validate()}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Account...
                          </div>
                        ) : (
                          'Create Account'
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Account created successfully! Redirecting to dashboard...</span>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium underline">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Features Preview */}
          <div className="mt-12 bg-gray-50 rounded-2xl p-8">
            <h3 className="text-xl font-semibold text-center mb-6">What you get with Job Seeker</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h4 className="font-medium mb-2">Smart Job Matching</h4>
                <p className="text-sm text-gray-600">Get personalized job recommendations based on your skills and preferences</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-medium mb-2">One-Click Applications</h4>
                <p className="text-sm text-gray-600">Apply to multiple jobs quickly with your saved profile and resume</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="font-medium mb-2">Application Tracking</h4>
                <p className="text-sm text-gray-600">Keep track of all your applications and their status in one place</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSignUp;