import { Link, Outlet, useLocation } from "react-router";
import WalletButton from "./WalletButton";
import TokenBalance from "./TokenBalance";
import { ModeToggle } from "./mode-toggle";
import { cn } from "../lib/utils";
import { BookOpen, GraduationCap, LayoutDashboard, Upload, DollarSign, BadgeCheck, LogOut, Settings } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button"; // Import Button
import ProfileDialog from "./ProfileDialog";
import { useState } from "react";

const Layout = () => {
    const location = useLocation();
    const { user, logout, isAuthenticated } = useAuth();
    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

    const isTeacher = location.pathname.startsWith("/teacher");
    const isStudent = location.pathname.startsWith("/student");

    const navItems = isTeacher ? [
        { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
        { name: "Courses", href: "/teacher/courses", icon: BookOpen },
        { name: "Upload", href: "/teacher/upload", icon: Upload },
        { name: "Earnings", href: "/teacher/earnings", icon: DollarSign },
        { name: "Badges", href: "/teacher/nft", icon: BadgeCheck },
    ] : isStudent ? [
        { name: "Dashboard", href: "/student", icon: LayoutDashboard },
        { name: "My Courses", href: "/student/courses", icon: BookOpen },
        { name: "History", href: "/student/history", icon: BookOpen },
        { name: "Certificates", href: "/student/nft", icon: GraduationCap },
    ] : [
        { name: "Home", href: "/", icon: LayoutDashboard },
        { name: "Catalog", href: "/courses", icon: BookOpen },
    ];

    const DEFAULT_AVATAR = "https://assets.mikasa-ackerman.vip/uPic/202512071111001765077060.png"; // User provided default avatar

    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 max-w-screen-2xl items-center">
                    <div className="mr-4 flex">
                        <Link to="/" className="mr-6 flex items-center space-x-2">
                            <span className="hidden font-bold sm:inline-block">Web3 University</span>
                        </Link>
                        <nav className="flex items-center space-x-6 text-sm font-medium">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        "transition-colors hover:text-foreground/80",
                                        location.pathname === item.href ? "text-foreground" : "text-foreground/60"
                                    )}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="flex flex-1 items-center justify-end space-x-2">
                        <nav className="flex items-center gap-2">
                            <TokenBalance />
                            {isAuthenticated && user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                            <Avatar className="h-9 w-9">
                                                <img src={user.avatarUrl || DEFAULT_AVATAR} alt="User Avatar" />
                                                <AvatarFallback>{user.username?.[0] || user.walletAddress.slice(2,4)}</AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end" forceMount>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">{user.username || "User"}</p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            Edit Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={logout}>
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Log out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <WalletButton /> // Show WalletButton if not authenticated
                            )}
                            <ModeToggle />
                        </nav>
                    </div>
                </div>
            </nav>
            <main className="flex-1">
                <div className="container relative">
                    <Outlet />
                </div>
            </main>
            {isAuthenticated && user && ( // Only render dialog if user exists
                <ProfileDialog isOpen={isProfileDialogOpen} onClose={() => setIsProfileDialogOpen(false)} />
            )}
        </div>
    );
};

export default Layout;
