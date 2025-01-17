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
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
      <nav className="fixed z-50 border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-full items-center justify-between max-w-7xl mx-auto px-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="mr-2"
            onClick={onToggleSidebar}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>

          <div className="flex items-center flex-1 justify-center">
            <div className="relative group">
              <Button variant="ghost" asChild>
                <Link href="/home" className="font-bold">
                  Chart Visualizer
                </Link>
              </Button>
              <nav className="absolute top-full left-0 bg-background/95 backdrop-blur opacity-0 group-hover:opacity-100 transition-all duration-300 py-2 px-4 rounded-md border shadow-md min-w-[150px] z-50">
                <div className="flex flex-col space-y-2">
                  <Link href="/charts" className="hover:text-primary">Charts</Link>
                  <Link href="/collaborations" className="hover:text-primary">Collaborations</Link>
                  <Link href="/forum" className="hover:text-primary">Forum</Link>
                  <Link href="/friends" className="hover:text-primary">Friends</Link>
                  <Link href="/messages" className="hover:text-primary">Messages</Link>
                </div>
              </nav>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2">
            {user && (
              <>
                <SearchFriends isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
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
                    <DropdownMenuItem asChild>
                      <Link href="/collaborations">Collaborations</Link>
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