'use client';

import AuthForm from '@/components/auth-form';
import Image from 'next/image';
import businessPersonLoginImage from '../../public/images/business-person-futuristic-business-environment-dark.png';
import alfredLogo from '../../public/Green Icon.svg';

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left Image Section */}
      <div className="hidden md:block md:w-1/2 h-full relative">
        <Image
          src={businessPersonLoginImage}
          alt="Business person in futuristic environment"
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 flex flex-col justify-center p-16 text-white">
          <div className="flex items-center mb-6">
            <div className="relative w-12 h-12 mr-4">
              <Image
                src={alfredLogo}
                alt="ALFReD Logo"
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-xl font-medium">Chat ALFReD</h3>
          </div>
          
          <h1 className="text-[2.5rem] leading-tight font-medium tracking-tight mb-2 max-w-[600px]">
            AI-Powered Insights for Real Estate Professionals
          </h1>
          <h2 className="text-[5rem] font-semibold tracking-wide mb-4">
            Know Better
          </h2>
          <div className="w-24 h-1 bg-emerald-500 mb-8"></div>
          
          <div className="space-y-4 text-gray-200 max-w-[600px]">
            <p className="text-lg leading-relaxed">
              ALFReD is a custom AI platform developed by Impact Capitol, designed specifically for commercial real estate professionals.
            </p>
            <p className="text-lg leading-relaxed">
              Access specialized market research, property analysis, investment strategies, and regulatory insights — all through a conversational AI leveraging Impact Capitol's proprietary knowledge base.
            </p>
            <p className="text-sm mt-6 text-gray-300">
              Built by Impact Capitol with advanced machine learning models and proprietary data systems to deliver intelligent commercial real estate insights.
            </p>
          </div>
        </div>
      </div>
      {/* Right Auth Form Section */}
      <div className="flex items-center justify-center w-full md:w-1/2 h-full p-8">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
