import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Phone, BookOpen, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { getParentCategories, getSubcategories, registerUser } from '../api';
import { Category, Subcategory, RegisterRequest } from '../types/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface SignupFormProps {
  onSignup: (name: string, email: string, password: string) => void;
  onSwitchToLogin: () => void;
}

type Step = 'personal' | 'contact' | 'categories' | 'password';

export const SignupForm: React.FC<SignupFormProps> = ({ onSignup, onSwitchToLogin }) => {
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Category and subcategory state
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);

  const steps: { key: Step; title: string; description: string }[] = [
    { key: 'personal', title: 'Personal Info', description: 'Your basic details' },
    { key: 'contact', title: 'Contact', description: 'How to reach you' },
    { key: 'categories', title: 'Interests', description: 'Choose your subjects' },
    { key: 'password', title: 'Security', description: 'Create your password' },
  ];

  // Fetch parent categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch subcategories when parent category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory);
    } else {
      setSubcategories([]);
      setSelectedSubcategory('');
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await getParentCategories();
      if (response && response.length > 0 && response[0].parents) {
        setCategories(response[0].parents);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories. Please try again.');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchSubcategories = async (parentId: string) => {
    try {
      setIsLoadingSubcategories(true);
      const response = await getSubcategories(parentId);
      if (response && response.length > 0 && response[0].subcategories) {
        setSubcategories(response[0].subcategories);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setError('Failed to load subcategories. Please try again.');
    } finally {
      setIsLoadingSubcategories(false);
    }
  };

  const nextStep = () => {
    const currentIndex = steps.findIndex(step => step.key === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
      setError('');
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex(step => step.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
      setError('');
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'personal':
        return name.trim().length > 0;
      case 'contact':
        return email.trim().length > 0 && phone.trim().length > 0;
      case 'categories':
        return selectedCategory && selectedSubcategory;
      case 'password':
        return password.length >= 6 && password === confirmPassword;
      default:
        return true;
    }
  };

  const validateCurrentStep = () => {
    setError('');
    
    switch (currentStep) {
      case 'personal':
        if (!name.trim()) {
          setError('Please enter your full name');
          return false;
        }
        break;
      case 'contact':
        if (!email.trim()) {
          setError('Please enter your email address');
          return false;
        }
        if (!phone.trim()) {
          setError('Please enter your phone number');
          return false;
        }
        break;
      case 'categories':
        if (!selectedCategory) {
          setError('Please select a main category');
          return false;
        }
        if (!selectedSubcategory) {
          setError('Please select a subcategory');
          return false;
        }
        break;
      case 'password':
        if (password.length < 6) {
          setError('Password must be at least 6 characters long');
          return false;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      nextStep();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateCurrentStep()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const userData: RegisterRequest = {
        name,
        email,
        password,
        phone,
        parentCategoryId: selectedCategory,
        subCategoryId: selectedSubcategory,
      };

      const response = await registerUser(userData);
      
      // Handle the specific API response format
      if (response && response.message === "User registered successfully") {
        setSuccess('Account created successfully! Redirecting to login...');
        toast.success('Account created successfully! Please login with your credentials.');
        
        // Wait 2 seconds to show success message, then redirect to login
        setTimeout(() => {
          onSwitchToLogin();
        }, 2000);
      } else {
        setError(response.message || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific API errors
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Registration failed. Please check your details and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const isActive = step.key === currentStep;
          const isCompleted = steps.findIndex(s => s.key === currentStep) > index;
          
          return (
            <div key={step.key} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium ${
                isCompleted 
                  ? 'bg-blue-800 border-blue-800 text-yellow-300' 
                  : isActive 
                    ? 'bg-blue-600 border-blue-600 text-yellow-300' 
                    : 'bg-yellow-200 border-yellow-300 text-blue-800'
              }`}>
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  isCompleted ? 'bg-blue-800' : 'bg-yellow-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold notebook-heading">
          {steps.find(s => s.key === currentStep)?.title}
        </h2>
        <p className="notebook-text text-sm mt-1">
          {steps.find(s => s.key === currentStep)?.description}
        </p>
      </div>
    </div>
  );

  const renderPersonalStep = () => (
    <div className="space-y-6">
      <div className="relative">
        <label className="block text-sm font-medium notebook-text mb-2">
          Full Name
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-yellow-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 notebook-text placeholder-blue-500"
            placeholder="Enter your full name"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderContactStep = () => (
    <div className="space-y-6">
      <div className="relative">
        <label className="block text-sm font-medium notebook-text mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-yellow-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 notebook-text placeholder-blue-500"
            placeholder="Enter your email"
            required
          />
        </div>
      </div>

      <div className="relative">
        <label className="block text-sm font-medium notebook-text mb-2">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-yellow-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 notebook-text placeholder-blue-500"
            placeholder="Enter your phone number"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderCategoriesStep = () => (
    <div className="space-y-6">
      <div className="relative">
        <label className="block text-sm font-medium notebook-text mb-2">
          Main Category
        </label>
        <div className="relative">
          <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-yellow-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none notebook-text"
            required
          >
            <option value="">Select a main category</option>
            {isLoadingCategories ? (
              <option disabled>Loading categories...</option>
            ) : (
              categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))
            )}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="relative">
        <label className="block text-sm font-medium notebook-text mb-2">
          Subcategory
        </label>
        <div className="relative">
          <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-yellow-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none notebook-text"
            required
            disabled={!selectedCategory || isLoadingSubcategories}
          >
            <option value="">
              {!selectedCategory 
                ? 'Please select a main category first' 
                : isLoadingSubcategories 
                  ? 'Loading subcategories...' 
                  : 'Select a subcategory'
              }
            </option>
            {subcategories.map((subcategory) => (
              <option key={subcategory._id} value={subcategory._id}>
                {subcategory.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPasswordStep = () => (
    <div className="space-y-6">
      <div className="relative">
        <label className="block text-sm font-medium notebook-text mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-12 py-3 bg-yellow-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 notebook-text placeholder-blue-500"
            placeholder="Create a password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="relative">
        <label className="block text-sm font-medium notebook-text mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-12 py-3 bg-yellow-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 notebook-text placeholder-blue-500"
            placeholder="Confirm your password"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'personal':
        return renderPersonalStep();
      case 'contact':
        return renderContactStep();
      case 'categories':
        return renderCategoriesStep();
      case 'password':
        return renderPasswordStep();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <ToastContainer />
      <div className="notebook-card backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-800 p-6 sm:p-8 text-center relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-60"></div>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-8 right-8 w-16 h-16 bg-yellow-400/5 rounded-full blur-2xl"></div>
          
          {/* Logo Section */}
          <div className="relative z-10 pt-4 sm:pt-6 mb-4 sm:mb-6">
            <div className="flex justify-center">
              <div className="relative group">
                <img 
                  src="/logo.png" 
                  alt="Vidyavani Logo" 
                  className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain drop-shadow-2xl filter brightness-110 hover:scale-110 transition-all duration-500 ease-out"
                  onError={(e) => {
                    console.error('Logo image failed to load');
                    e.currentTarget.style.display = 'none';
                  }}
                />
               </div>
            </div>
          </div>
          
          {/* Text Section */}
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-300 mb-2 sm:mb-3 drop-shadow-lg">Vidyavani</h1>
            <p className="text-yellow-200 text-sm sm:text-base drop-shadow-md">Join our learning adventure! 🌍</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 bg-yellow-100">
          {renderStepIndicator()}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderCurrentStep()}

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg border border-green-200">
                {success}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {currentStep !== 'personal' && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 flex items-center justify-center gap-2 bg-yellow-200 text-blue-800 py-3 rounded-lg font-medium hover:bg-yellow-300 transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              
              {/* Show submit button only on last step */}
              {currentStep === 'password' ? (
                <button
                  type="submit"
                  disabled={isLoading || !!success}
                  className="flex-1 bg-blue-800 text-yellow-300 py-3 rounded-lg font-semibold hover:bg-blue-900 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-300 mr-2"></div>
                      Creating Account...
                    </div>
                  ) : success ? (
                    'Account Created Successfully'
                  ) : (
                    'Create Account'
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-800 text-yellow-300 py-3 rounded-lg font-semibold hover:bg-blue-900 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 text-center">
            <p className="notebook-text text-sm">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-800 hover:text-blue-900 font-semibold hover:underline transition-colors duration-200"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};