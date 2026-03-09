import { useState } from "react";
import { Input, Button, Avatar, Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/react";
import { Search, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.svg";

interface HeaderProps {
  onNewDeal?: () => void;
}

export function Header({ onNewDeal }: HeaderProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <Navbar maxWidth="full" isBordered className="bg-white">
      <NavbarBrand>
        <Link to="/dashboard" className="flex items-center">
          <img src={logo} alt="Nvestiv" className="h-5 sm:h-7" />
        </Link>
      </NavbarBrand>

      <NavbarContent className="hidden md:flex" justify="center">
        <NavbarItem className="w-full max-w-md">
          <Input
            type="text"
            placeholder="Search platform..."
            size="sm"
            startContent={<Search className="h-4 w-4 text-default-400" />}
            classNames={{
              inputWrapper: "bg-default-100 shadow-none",
            }}
          />
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem className="md:hidden">
          <Button isIconOnly variant="light" size="sm" onPress={() => setMobileSearchOpen(!mobileSearchOpen)}>
            {mobileSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </Button>
        </NavbarItem>
        {onNewDeal && (
          <>
            <NavbarItem className="hidden sm:flex">
              <Button color="primary" size="sm" startContent={<Plus className="h-4 w-4" />} onPress={onNewDeal}>
                New Deal
              </Button>
            </NavbarItem>
            <NavbarItem className="sm:hidden">
              <Button isIconOnly color="primary" size="sm" onPress={onNewDeal}>
                <Plus className="h-4 w-4" />
              </Button>
            </NavbarItem>
          </>
        )}
        <NavbarItem>
          <Avatar size="sm" showFallback className="bg-default-100" />
        </NavbarItem>
      </NavbarContent>

      {mobileSearchOpen && (
        <div className="md:hidden border-t border-divider px-4 py-2 w-full">
          <Input
            type="text"
            placeholder="Search platform..."
            size="sm"
            autoFocus
            startContent={<Search className="h-4 w-4 text-default-400" />}
            classNames={{ inputWrapper: "bg-default-100 shadow-none" }}
          />
        </div>
      )}
    </Navbar>
  );
}
