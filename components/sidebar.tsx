"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/utils/auth-provider"
import Link from "next/link"
import Image from "next/image"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Settings, 
  LogOut, 
  Home, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare,
  FileSpreadsheet,
  LayoutDashboard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

type SidebarItem = {
  name: string;
  icon: React.ElementType;
  path: string;
  external?: boolean;
  color?: string;
}

export function Sidebar() {
  const router = useRouter();
  const { logout } = useAuth();
  const [userEmail, setUserEmail] = useState<string>("");
  const [expanded, setExpanded] = useState(true);
  const { theme, setTheme } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  // Color palette for icons
  const iconColors = {
    home: "#3a8f71",
    chat: "#61b992",
    dashboard: "#4db6a5",
    tracker: "#ebb142"
  };
  
  // Navigation items
  const mainNavItems: SidebarItem[] = [
    { name: "Home", icon: Home, path: "/home", color: iconColors.home },
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", color: iconColors.dashboard },
    { name: "Chat", icon: MessageSquare, path: "/chat", color: iconColors.chat },
    { name: "Tracker", icon: FileSpreadsheet, path: "/tracker", color: iconColors.tracker }
  ];
  
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
  
  // Update document class based on sidebar state
  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.classList.toggle('sidebar-expanded', expanded);
      mainContent.classList.toggle('sidebar-collapsed', !expanded);
    }
  }, [expanded]);
  
  // Set sidebar to collapsed on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setExpanded(false);
      }
    };
    
    // Initial check
    handleResize();
    
    // Listen for window resize events
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
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

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const NavItem = ({ item }: { item: SidebarItem }) => {
    const isHovered = hoveredItem === item.name;
    
    const content = (
      <motion.div 
        className={cn(
          "flex items-center rounded-lg py-3 px-3 mb-1 hover:bg-gray-800/50 transition-colors duration-200 sidebar-item-hover",
          expanded ? "justify-start" : "justify-center"
        )}
        onHoverStart={() => setHoveredItem(item.name)}
        onHoverEnd={() => setHoveredItem(null)}
        whileHover={{ 
          scale: 1.03,
          transition: { duration: 0.2 } 
        }}
        initial={{ x: 0 }}
        animate={{ 
          x: isHovered ? 3 : 0,
          transition: { duration: 0.3, ease: "easeOut" }
        }}
      >
        <motion.div
          className="icon-container"
          initial={{ scale: 1 }}
          animate={{ 
            scale: isHovered ? 1.15 : 1,
            transition: { type: "spring", stiffness: 400, damping: 10 }
          }}
        >
          <item.icon 
            className={cn(
              expanded ? "h-6 w-6 mr-3" : "h-7 w-7",
              isHovered ? "text-white" : "text-gray-400"
            )} 
            style={{ color: isHovered ? item.color : undefined }}
          />
        </motion.div>
        
        {expanded && (
          <span 
            className={cn(
              "text-sm font-medium transition-colors duration-200",
              isHovered ? "text-white" : "text-gray-300"
            )}
          >
            {item.name}
          </span>
        )}
      </motion.div>
    );

    if (item.external) {
      return (
        <a 
          href={item.path} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full"
        >
          {content}
        </a>
      );
    }

    return (
      <Link href={item.path} className="block w-full">
        {content}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Menu Toggle Button - only visible on small screens */}
      <motion.button 
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-black/80 text-white shadow-lg md:hidden"
        aria-label="Toggle Sidebar"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Menu className="h-5 w-5" />
      </motion.button>
      
      <motion.aside 
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-black border-r border-gray-900 shadow-md transition-all duration-300 ease-in-out rounded-tr-[16px] rounded-br-[16px]",
          expanded ? "w-64" : "w-20",
          "md:translate-x-0", // Always visible on desktop
          expanded ? "translate-x-0" : "-translate-x-full" // Hidden when collapsed on mobile
        )}
        initial={false}
        animate={{ 
          boxShadow: expanded ? "2px 0 15px rgba(0,0,0,0.2)" : "none" 
        }}
      >
        {/* Glowing edge effect */}
        <div className="sidebar-edge-glow" />
        
        {/* Logo and Toggle */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800">
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className={`${expanded ? "" : "w-full flex justify-center"}`}>
              <Image 
                src="/Green Icon.svg" 
                alt="ALFReD" 
                width={32}
                height={32}
                className="transition-all duration-300" 
              />
            </div>
          </motion.div>
          
          {expanded && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          
          {!expanded && (
            <div className="absolute top-16 right-[-12px] bg-black rounded-full border border-gray-800 shadow-md">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSidebar}
                className="h-7 w-7 p-0 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <div className="mb-6">
            <AnimatePresence>
              {expanded && (
                <motion.div
                  className="mb-2 px-3 flex items-center gap-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="h-4 w-0.5 bg-[#3a8f71] rounded-full"></div>
                  <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">Navigation</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {mainNavItems.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>
        </div>
        
        {/* User Section */}
        <div className="border-t border-gray-800 py-4 px-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button 
                className={cn(
                  "flex items-center w-full rounded-lg px-3 py-2 hover:bg-gray-800/50 transition-colors",
                  expanded ? "justify-between" : "justify-center"
                )}
                whileHover={{ backgroundColor: "rgba(31, 41, 55, 0.5)" }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={cn(
                  "flex items-center",
                  expanded ? "gap-3" : "justify-center"
                )}>
                  <motion.div 
                    className="h-9 w-9 rounded-full bg-gradient-to-br from-[#2c7359] to-[#3a8f71] text-white flex items-center justify-center animate-pulse-glow"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ y: 0 }}
                    animate={{ 
                      boxShadow: "0 4px 12px rgba(44, 115, 89, 0.3)" 
                    }}
                  >
                    {getInitials(userEmail)}
                  </motion.div>
                  
                  {expanded && (
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium text-gray-200 truncate">
                        {userEmail.length > 18 ? `${userEmail.substring(0, 18)}...` : userEmail}
                      </span>
                      <span className="text-xs text-emerald-500 font-medium">Active</span>
                    </div>
                  )}
                </div>
                {expanded && (
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                  </motion.div>
                )}
              </motion.button>
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
      </motion.aside>
    </>
  )
}
