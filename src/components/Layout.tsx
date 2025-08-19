import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  Home, 
  Users, 
  Settings, 
  BarChart3, 
  Target, 
  Shield,
  User,
  FileText,
  Database,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith('/admin');
  
  const adminMenuItems = [
    { path: '/admin', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
    { path: '/admin/kriteria-global', label: 'Kriteria Global', icon: <Settings className="h-4 w-4" /> },
    // { path: '/admin/pekerjaan', label: 'Manajemen Pekerjaan', icon: <Database className="h-4 w-4" /> },
  ];

  const userMenuItems = [
    { path: '/user', label: 'Rekomendasi', icon: <Target className="h-4 w-4" /> },
    // { path: '/user/profil', label: 'Profil Saya', icon: <User className="h-4 w-4" /> },
    // { path: '/user/riwayat', label: 'Riwayat', icon: <FileText className="h-4 w-4" /> },
  ];

  const menuItems = isAdminRoute ? adminMenuItems : userMenuItems;

  const handleModeSwitch = () => {
    const newPath = isAdminRoute ? '/user' : '/admin';
    navigate(newPath);
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Mobile Menu Trigger */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <MobileSidebar 
                menuItems={menuItems}
                isAdminRoute={isAdminRoute}
                onModeSwitch={handleModeSwitch}
                onLogout={handleLogout}
                currentPath={location.pathname}
              />
            </SheetContent>
          </Sheet>

          {/* Desktop Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex"
          >
            {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          {/* <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded gradient-blue flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">SPK Rekomendasi Karier</h1>
            </div>
          </div> */}

          {/* Header Actions */}
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleModeSwitch}
              className="hidden md:flex items-center space-x-2"
            >
              {isAdminRoute ? (
                <>
                  <User className="h-4 w-4" />
                  <span>Mode User</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span>Mode Admin</span>
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden md:block border-r border-border bg-card/30 min-h-[calc(100vh-4rem)] transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <DesktopSidebar 
            menuItems={menuItems}
            isAdminRoute={isAdminRoute}
            onModeSwitch={handleModeSwitch}
            currentPath={location.pathname}
            collapsed={sidebarCollapsed}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Desktop Sidebar Component
const DesktopSidebar = ({ 
  menuItems, 
  isAdminRoute, 
  onModeSwitch, 
  currentPath,
  collapsed 
}: {
  menuItems: any[];
  isAdminRoute: boolean;
  onModeSwitch: () => void;
  currentPath: string;
  collapsed: boolean;
}) => (
  <div className="p-4 space-y-6">
    {/* Mode Indicator */}
    {!collapsed && (
      <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20">
        <div className="flex items-center space-x-2 text-blue-400">
          {isAdminRoute ? <Shield className="h-5 w-5" /> : <Users className="h-5 w-5" />}
          <span className="font-medium">
            {isAdminRoute ? 'Panel Admin' : 'Mode User'}
          </span>
        </div>
      </div>
    )}

    {/* Navigation Menu */}
    <nav className="space-y-2">
      {menuItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            currentPath === item.path
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? item.label : ''}
        >
          {item.icon}
          {!collapsed && <span>{item.label}</span>}
        </Link>
      ))}
    </nav>

    {/* Mode Switch Button */}
    {!collapsed && (
      <Button
        variant="outline"
        onClick={onModeSwitch}
        className="w-full justify-start"
      >
        {isAdminRoute ? (
          <>
            <User className="h-4 w-4 mr-2" />
            Beralih ke Mode User
          </>
        ) : (
          <>
            <Shield className="h-4 w-4 mr-2" />
            Beralih ke Mode Admin
          </>
        )}
      </Button>
    )}

    {/* Collapsed Mode Switch Button */}
    {collapsed && (
      <Button
        variant="outline"
        onClick={onModeSwitch}
        className="w-full p-2 justify-center"
        title={isAdminRoute ? 'Beralih ke Mode User' : 'Beralih ke Mode Admin'}
      >
        {isAdminRoute ? <User className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
      </Button>
    )}
  </div>
);

// Mobile Sidebar Component
const MobileSidebar = ({ 
  menuItems, 
  isAdminRoute, 
  onModeSwitch, 
  onLogout, 
  currentPath 
}: {
  menuItems: any[];
  isAdminRoute: boolean;
  onModeSwitch: () => void;
  onLogout: () => void;
  currentPath: string;
}) => (
  <div className="p-4 space-y-6 h-full bg-card">
    {/* Logo */}
    <div className="flex items-center space-x-3 pb-4 border-b border-border">
      <div className="h-8 w-8 rounded gradient-blue flex items-center justify-center">
        <Target className="h-5 w-5 text-white" />
      </div>
      <div>
        <h2 className="font-bold text-foreground">SPK Karier</h2>
      </div>
    </div>

    {/* Mode Indicator */}
    <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20">
      <div className="flex items-center space-x-2 text-blue-400">
        {isAdminRoute ? <Shield className="h-5 w-5" /> : <Users className="h-5 w-5" />}
        <span className="font-medium">
          {isAdminRoute ? 'Panel Admin' : 'Mode User'}
        </span>
      </div>
    </div>

    {/* Navigation Menu */}
    <nav className="space-y-2">
      {menuItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            currentPath === item.path
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>

    {/* Actions */}
    <div className="space-y-2 pt-4 border-t border-border mt-auto">
      <Button
        variant="outline"
        onClick={onModeSwitch}
        className="w-full justify-start"
      >
        {isAdminRoute ? (
          <>
            <User className="h-4 w-4 mr-2" />
            Mode User
          </>
        ) : (
          <>
            <Shield className="h-4 w-4 mr-2" />
            Mode Admin
          </>
        )}
      </Button>
      <Button variant="ghost" onClick={onLogout} className="w-full justify-start">
        <LogOut className="h-4 w-4 mr-2" />
        Keluar
      </Button>
    </div>
  </div>
);

export default Layout;
