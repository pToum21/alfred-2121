"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogoHeader } from "@/components/ui/logo-header"
import { useAuth } from "@/lib/utils/auth-provider"
import Link from "next/link"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Settings, LogOut } from "lucide-react"

export function Header() {
  const router = useRouter();
  const { logout } = useAuth();
  const [userEmail, setUserEmail] = useState<string>("");
  
  // Fetch user email from token on client side
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        // Check if we're authenticated
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.authenticated) {
          // Now fetch the user details including email
          const userResponse = await fetch('/api/auth/user', {
            method: 'GET',
            credentials: 'include'
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUserEmail(userData.email || "User");
          } else {
            // Fallback in case we can't get email
            setUserEmail("User");
          }
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        setUserEmail("User");
      }
    };
    
    getUserEmail();
  }, []);
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      logout();
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getInitials = (email: string) => {
    if (!email || email === "User") return "U";
    // Get first letter of email address
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex-shrink-0 bg-black border-b border-gray-900 shadow-md" style={{ height: '64px' }}>
      <div className="container flex items-center justify-between h-full px-4 mx-auto">
        <LogoHeader />

        <div className="flex items-center">
          <nav className="hidden md:flex items-center space-x-6 mr-4">
            <a href="https://impactcapitol.com/services" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-300 hover:text-green-400 transition-colors">
              Services
            </a>
            <div className="relative group">
              <button className="text-sm font-medium text-gray-300 hover:text-green-400 transition-colors flex items-center">
                Solutions
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <a href="https://impactcapitol.com/solutions" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">
                  Research Solutions
                </a>
                <a href="https://impactcapitol.com/data" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">
                  Data Services
                </a>
              </div>
            </div>
            <a href="https://impactcapitol.com/research" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-300 hover:text-green-400 transition-colors">
              Research
            </a>
            <div className="relative group">
              <button className="text-sm font-medium text-gray-300 hover:text-green-400 transition-colors flex items-center">
                Resources
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <a href="https://impactcapitol.com/case-studies" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">
                  Case Studies
                </a>
                <a href="https://impactcapitol.com/blog" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">
                  Blog
                </a>
                <a href="https://impactcapitol.com/news" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">
                  News
                </a>
              </div>
            </div>
            <a 
              href="https://impactcapitol.com/contact"
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors hover:opacity-90 bg-[#2c7359] text-white">
              Contact Us
            </a>
          </nav>

          {/* User Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 w-9 rounded-full bg-[#2c7359] text-white flex items-center justify-center hover:bg-[#2c7359]/80 transition-colors">
                {getInitials(userEmail)}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800">
              <DropdownMenuLabel className="flex flex-col">
                <span className="font-normal text-xs text-gray-400">Signed in as</span>
                <span className="font-medium truncate text-gray-200">{userEmail}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />
              <Link href="/llm-providers">
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-800 text-gray-300">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 hover:bg-gray-800">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

