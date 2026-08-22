import { Link, useNavigate } from "@/lib/next-router-compat";
import { LogOut, User, Settings, ShieldCheck } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const initials = user.name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="ml-2 hidden sm:flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 hover:bg-muted transition-colors">
          {user.avatar
            ? <img src={user.avatar} alt="" className="h-6 w-6 rounded-full" />
            : <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">{initials}</span>}
          <span className="text-xs font-medium">{user.name.split(" ")[0]}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{user.name}</span>
            <span className="text-xs font-normal text-muted-foreground truncate">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/profile"><User className="h-4 w-4" /> Profile</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/settings/store"><Settings className="h-4 w-4" /> Store settings</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/audit-logs"><ShieldCheck className="h-4 w-4" /> Audit logs</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => { logout(); toast.success("Signed out"); navigate({ to: "/auth/login" }); }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
