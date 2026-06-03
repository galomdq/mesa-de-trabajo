import React from 'react';
import { Users, Dumbbell, Settings, Home, Calendar, Briefcase, LogOut, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useToast } from '@/hooks/use-toast';

interface SidebarProps {
  selectedView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedView, onViewChange }) => {
  const { signOut, user } = useLocalAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    });
  };
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'ejercicios', label: 'Ejercicios', icon: Dumbbell },
    { id: 'supervisor', label: 'Supervisor', icon: Briefcase },
    { id: 'plantillas', label: 'Plantillas de Rutinas', icon: Calendar },
    { id: 'usuarios', label: 'Usuarios', icon: UserCog },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 shadow-lg z-40">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">Urban Gym</h2>
            <p className="text-sm text-gray-400">Sistema de Rutinas</p>
            {user?.email && (
              <p className="text-xs text-gray-500 mt-1 truncate">{user.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-12 text-left",
                selectedView === item.id
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 text-gray-300 hover:bg-gray-800 hover:text-white"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
        <div className="text-xs text-gray-500 text-center">
          © 2024 Urban Gym v1.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;