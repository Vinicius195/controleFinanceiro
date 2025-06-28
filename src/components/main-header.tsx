'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pizza, LayoutDashboard, NotebookText } from "lucide-react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";

export function MainHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2 font-semibold">
        <Pizza className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-headline">PizzaBela Massa</h1>
      </div>
      <nav className="ml-auto flex items-center gap-2">
         <Button asChild variant={pathname === '/' ? 'secondary' : 'ghost'} size="sm">
            <Link href="/" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>Painel Principal</span>
            </Link>
         </Button>
         <Button asChild variant={pathname === '/controle-detalhado' ? 'secondary' : 'ghost'} size="sm">
            <Link href="/controle-detalhado" className="flex items-center gap-2">
               <NotebookText className="h-4 w-4" />
                <span>Controle Detalhado</span>
            </Link>
         </Button>
         <div className="ml-2">
            <ThemeToggle />
         </div>
      </nav>
    </header>
  );
}
