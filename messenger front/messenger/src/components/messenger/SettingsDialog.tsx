import { useState } from "react";
import { Settings, Bell, Palette, User, Moon, Sun, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border/50 text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" /> Account
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium text-sm">Alex R.</span>
                <span className="text-xs text-muted-foreground">alex@example.com</span>
              </div>
              <Button variant="outline" size="sm">Edit Profile</Button>
            </div>
          </div>
          
          <Separator className="bg-border/50" />
          
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4" /> Preferences
            </h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="flex flex-col gap-1 cursor-pointer">
                <span className="text-sm font-medium">Push Notifications</span>
                <span className="text-xs text-muted-foreground">Receive message alerts</span>
              </Label>
              <Switch 
                id="notifications" 
                checked={notifications} 
                onCheckedChange={setNotifications} 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="theme" className="flex flex-col gap-1 cursor-pointer">
                <span className="text-sm font-medium">Dark Mode</span>
                <span className="text-xs text-muted-foreground">Toggle application theme</span>
              </Label>
              <Switch 
                id="theme" 
                checked={darkMode} 
                onCheckedChange={setDarkMode} 
              />
            </div>
          </div>
          
          <Separator className="bg-border/50" />
          
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" /> Privacy & Security
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Sessions</span>
              <Button variant="link" size="sm" className="text-muted-foreground hover:text-foreground">View all</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
