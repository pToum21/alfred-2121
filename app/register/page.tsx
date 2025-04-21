'use client';

import AuthForm from '@/components/auth-form';
import Image from 'next/image';
import businessPersonRegisterImage from '../../public/images/business-person-futuristic-business-environment-dark.png';

export default function RegisterPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left Image Section */}
      <div className="hidden md:block md:w-1/2 h-full relative">
        <Image
          src={businessPersonRegisterImage}
          alt="Business person in futuristic environment"
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 flex flex-col justify-center p-16 text-white">
          <h1 className="text-[2.5rem] leading-tight font-medium tracking-tight mb-2 max-w-[600px]">
            Join the Future of Real Estate Investment
          </h1>
          <h2 className="text-[5rem] font-semibold tracking-wide mb-4">
            Start Now
          </h2>
          <div className="w-24 h-1 bg-primary mb-8"></div>
          <p className="text-lg text-gray-200 max-w-[600px] leading-relaxed">
            Create your account to access AI-powered insights, market trends, and make data-driven investment decisions.
          </p>
        </div>
      </div>
      {/* Right Auth Form Section */}
      <div className="flex items-center justify-center w-full md:w-1/2 h-full p-8">
        <AuthForm mode="register" />
      </div>
    </div>
  );
}

