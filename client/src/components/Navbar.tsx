import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/utils/cn";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { MenuIcon, ArrowUp, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useState, useEffect } from "react";
import { SearchFriends } from "./SearchFriends";

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout } = useUser();
  const { theme, setTheme } = useTheme();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      <nav className={cn(
        "fixed z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "md:top-0 md:left-0 md:right-0",
        "sm:top-4 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:w-12 sm:h-12 sm:rounded-full sm:hover:h-14 sm:hover:w-full sm:transition-all sm:duration-300 sm:border"
      )}>
        <div className={cn(
          "container flex h-14 items-center max-w-7xl mx-auto px-4",
          "sm:opacity-0 sm:hover:opacity-100 sm:transition-opacity sm:duration-300"
        )}>
          <Button 
            variant="ghost" 
            size="icon"
            className="mr-2 md:hidden hover:bg-accent/50 transition-colors"
            onClick={onToggleSidebar}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>

          <div className="flex items-center flex-1 justify-center gap-6">
            <Link href="/home" className="flex items-center space-x-2">
              <span className="font-bold sm:inline-block">
                Chart Visualizer
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link href="/charts">Charts</Link>
              <Link href="/forum">Forum</Link>
              <Link href="/friends">Friends</Link>
              <Link href="/messages">Messages</Link>
            </nav>
          </div>

          <div className="flex items-center justify-end space-x-2">
            {user && (
              <>
                <SearchFriends />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="mr-2"
                >
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2 .5 3" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTheme('light')}>Bright</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')}>Navy</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('grey')}>Slate</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="relative h-8 w-8 rounded-full border-2 border-primary">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user.username}`}>Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => logout()}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </nav>

      {showScrollTop && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
          onClick={scrollToTop}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </>
  );
}