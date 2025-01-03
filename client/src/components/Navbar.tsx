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
        "md:top-0 md:left-0 md:right-0 md:h-14",
        "top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full hover:h-14 hover:w-[95vw] transition-all duration-300 border md:border-0"
      )}>
        <div className={cn(
          "container flex h-full items-center justify-between max-w-7xl mx-auto px-4",
          "md:opacity-100",
          "opacity-0 hover:opacity-100 transition-opacity duration-300"
        )}>
          <Button 
            variant="ghost" 
            size="icon"
            className="mr-2 md:hidden hover:bg-accent/50 transition-colors"
            onClick={onToggleSidebar}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>

          <div className="flex items-center flex-1 justify-center group">
            <Button variant="ghost" asChild className="mr-4">
              <Link href="/home" className="font-bold">
                Chart Visualizer
              </Link>
            </Button>
            <nav className="hidden md:flex items-center space-x-4 text-sm font-medium overflow-hidden transition-all duration-300 hover:w-full">
              <div className="flex items-center space-x-4 whitespace-nowrap">
                <Link href="/charts" className="hover:text-primary">Charts</Link>
                <Link href="/forum" className="hover:text-primary">Forum</Link>
                <Link href="/friends" className="hover:text-primary">Friends</Link>
                <Link href="/messages" className="hover:text-primary">Messages</Link>
              </div>
            </nav>
            <nav className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur md:hidden opacity-0 group-hover:opacity-100 transition-all duration-300 py-2 px-4">
              <div className="flex flex-col space-y-2">
                <Link href="/charts" className="hover:text-primary">Charts</Link>
                <Link href="/forum" className="hover:text-primary">Forum</Link>
                <Link href="/friends" className="hover:text-primary">Friends</Link>
                <Link href="/messages" className="hover:text-primary">Messages</Link>
              </div>
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