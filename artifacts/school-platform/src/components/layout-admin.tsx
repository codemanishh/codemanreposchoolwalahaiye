import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, School, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
  portal: "superadmin" | "admin" | "student";
}

export function AdminLayout({ children, portal }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    if (portal === "superadmin") logout("/superadmin/login");
    else if (portal === "admin") logout("/admin/login");
    else logout("/student/login");
  };

  const getPortalTitle = () => {
    switch (portal) {
      case "superadmin": return "Super Admin Portal";
      case "admin": return "School Admin Portal";
      case "student": return "Student Portal";
    }
  };

  const getPortalIcon = () => {
    switch (portal) {
      case "superadmin": return <Shield className="w-6 h-6 text-primary" />;
      case "admin": return <School className="w-6 h-6 text-primary" />;
      case "student": return <User className="w-6 h-6 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-secondary text-secondary-foreground shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getPortalIcon()}
            <span className="font-display font-bold text-xl tracking-wide text-white">
              {getPortalTitle()}
            </span>
          </div>
          
          <div className="flex items-center space-x-6">
            {user && (
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                </div>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-white border-gray-700 hover:bg-white hover:text-black transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} School Management Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
