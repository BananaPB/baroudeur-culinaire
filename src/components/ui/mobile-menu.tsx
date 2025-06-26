import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NAV_LINKS } from '@/consts'
import { Menu } from 'lucide-react'

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleViewTransitionStart = () => {
      setIsOpen(false)
    }

    document.addEventListener('astro:before-swap', handleViewTransitionStart)

    return () => {
      document.removeEventListener(
        'astro:before-swap',
        handleViewTransitionStart,
      )
    }
  }, [])

  return (
    <DropdownMenu open={isOpen} onOpenChange={(val) => setIsOpen(val)}>
      <DropdownMenuTrigger
        asChild
        onClick={() => {
          setIsOpen((val) => !val)
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="size-8 sm:hidden"
          title="Menu"
        >
          <Menu className="size-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background">
        {NAV_LINKS.map((item) => (
          <div>
            <DropdownMenuItem key={item.href} asChild>
              <a
                href={item.href}
                className="w-full text-lg font-medium capitalize"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
                {item.items && item.items.length > 0 && <ChevronDown />}
              </a>
            </DropdownMenuItem>
            
            {item.items && item.items.length > 0 && (
              <div>
                {item.items.map((sub) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <a
                      href={item.href + sub.href}
                      className="block px-4 py-2 text-sm text-foreground/70"
                      onClick={() => setIsOpen(false)}
                    >
                      {sub.label}
                    </a>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default MobileMenu
