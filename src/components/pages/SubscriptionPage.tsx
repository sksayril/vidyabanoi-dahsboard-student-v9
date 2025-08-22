import React, { useState } from 'react';
import { Crown, Check, Star, Video, FileText, Brain, Sparkles, Gift, Zap, Shield, Users, Clock } from 'lucide-react';
import { User } from '../../types/api';
import { createSubscriptionOrder, verifyPayment } from '../../api';

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SubscriptionPageProps {
  userData?: User;
  onSubscriptionUpdate?: (subscriptionData: any) => void;
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ userData, onSubscriptionUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user has active subscription
  const hasActiveSubscription = () => {
    return userData?.subscription?.isActive === true;
  };

  // Handle subscription purchase
  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Create order
      const orderData = {
        plan: "yearly",
        amount: 49900, // ₹499 in paise
        currency: "INR"
      };

      const orderResponse = await createSubscriptionOrder(orderData);
      console.log('Order created:', orderResponse);

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderResponse.key_id,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: "Vidyabani",
        description: "Premium Subscription - 1 Year",
        image: "https://via.placeholder.com/150x50?text=Vidyabani",
        order_id: orderResponse.orderId,
        handler: async function (response: any) {
          try {
            console.log('Payment successful:', response);
            
            // Step 3: Verify payment
            const paymentData = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            };

            const verifyResponse = await verifyPayment(paymentData);
            console.log('Payment verified:', verifyResponse);

            if (verifyResponse.success) {
              setSuccess('Subscription activated successfully!');
              
              // Update user subscription in localStorage
              const storedUserData = localStorage.getItem('userData');
              if (storedUserData) {
                const userData = JSON.parse(storedUserData);
                userData.subscription = verifyResponse.subscription;
                localStorage.setItem('userData', JSON.stringify(userData));
              }

              // Call callback to update parent component
              if (onSubscriptionUpdate) {
                onSubscriptionUpdate(verifyResponse.subscription);
              }

              // Reload page after 2 seconds to reflect changes
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } else {
              setError('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: orderResponse.user.name,
          email: orderResponse.user.email,
          contact: orderResponse.user.phone
        },
        notes: {
          address: "Vidyabani Educational Platform"
        },
        theme: {
          color: "#8B5CF6"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Subscription error:', error);
      setError('Failed to create order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const planFeatures = [
    {
      icon: FileText,
      title: "High Quality Notes",
      description: "Access to comprehensive study materials and notes"
    },
    {
      icon: Video,
      title: "Video Lessons",
      description: "HD video tutorials and interactive lessons"
    },
    {
      icon: FileText,
      title: "PDF Study Guides",
      description: "Downloadable PDF notes and study guides"
    },
    {
      icon: Brain,
      title: "AskVani AI Access",
      description: "Unlimited access to AI-powered learning assistant"
    },
    {
      icon: Sparkles,
      title: "Premium Content",
      description: "Exclusive premium learning materials"
    },
    {
      icon: Shield,
      title: "Ad-Free Experience",
      description: "Enjoy learning without any advertisements"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Crown className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold notebook-heading">Premium Subscription</h1>
        </div>
        <p className="text-lg notebook-text max-w-2xl mx-auto">
          Unlock unlimited access to premium learning materials, AI-powered assistance, and exclusive content 🌍
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">!</span>
            </div>
            <div>
              <h3 className="text-red-800 font-medium">Payment Error</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-green-800 font-medium">Success!</h3>
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Status */}
      {hasActiveSubscription() && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">Active Premium Subscription</h3>
              <p className="text-green-600">You have access to all premium features!</p>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Plan Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Plan Header */}
        <div className="bg-gradient-to-br from-blue-600 to-green-600 p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Crown className="h-6 w-6" />
                <span className="text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <h2 className="text-3xl font-bold mb-2">Premium Plan</h2>
              <p className="text-blue-100">Complete access to all learning features</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">₹499</div>
              <div className="text-blue-100">per year</div>
              <div className="text-sm text-blue-200 mt-1">Save 58% vs monthly</div>
            </div>
          </div>
        </div>

        {/* Plan Features */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {planFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold notebook-heading mb-1">{feature.title}</h3>
                    <p className="text-sm notebook-text">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Benefits */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold notebook-heading mb-4 flex items-center">
              <Star className="h-5 w-5 text-yellow-500 mr-2" />
              What You'll Get
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm notebook-text">365 days access</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm notebook-text">Unlimited downloads</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm notebook-text">Priority support</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          {!hasActiveSubscription() ? (
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Gift className="h-5 w-5" />
                  <span>Subscribe Now - ₹499/year</span>
                </>
              )}
            </button>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-6 py-3 rounded-full">
                <Check className="h-5 w-5" />
                <span className="font-medium">Already Subscribed</span>
              </div>
            </div>
          )}

          {/* Security & Trust */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Instant Access</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 rounded-xl p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Can I cancel anytime?</h4>
            <p className="text-sm text-gray-600">Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">What payment methods do you accept?</h4>
            <p className="text-sm text-gray-600">We accept all major credit cards, debit cards, and UPI payments for your convenience.</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Is there a free trial?</h4>
            <p className="text-sm text-gray-600">Currently, we offer a 7-day money-back guarantee. If you're not satisfied, we'll refund your payment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 