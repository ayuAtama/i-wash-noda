"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

// Mock type for your items
type Item = {
  id: string;
  name: string;
};

export function CreatableItemOrder() {
  const [open, setOpen] = React.useState(false);

  // State for the select/combobox
  const [items, setItems] = React.useState<Item[]>([
    { id: "1", name: "Keyboard" },
    { id: "2", name: "Mouse" },
  ]);
  const [selectedItem, setSelectedItem] = React.useState<Item | null>(null);

  // State for search and debouncing
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);

  // State for the quantity
  const [quantity, setQuantity] = React.useState<number>(1);

  // 1. Debounce Effect
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 2. Fetch/Filter Effect based on debounced query
  React.useEffect(() => {
    if (!debouncedQuery) return;

    setIsSearching(true);
    // TODO: Replace this with your actual API fetch
    // fetch(`/api/items?q=${debouncedQuery}`).then(...)
    console.log("Fetching API for:", debouncedQuery);

    // Simulating API network delay
    const timeout = setTimeout(() => {
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [debouncedQuery]);

  // 3. Handle creating a new item
  const handleCreateNewItem = () => {
    if (!searchQuery) return;

    const newItem: Item = {
      id: `new-${Date.now()}`, // Generate a temporary or real ID
      name: searchQuery,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedItem(newItem);
    setSearchQuery("");
    setOpen(false);
  };

  // 4. Handle compiling the body payload
  const handleSubmit = () => {
    if (!selectedItem) {
      alert("Please select an item first");
      return;
    }

    const payloadBody = {
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      quantity: quantity,
      isNewItem: selectedItem.id.startsWith("new-"),
    };

    console.log("Ready to send in request body:", payloadBody);
    alert(JSON.stringify(payloadBody, null, 2));
  };

  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <div className="flex gap-2 items-end">
        {/* COMBOBOX AREA */}
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-sm font-medium">Select or Create Item</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="justify-between w-full"
              >
                {selectedItem ? selectedItem.name : "Search item..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-75 p-0">
              {/* shouldFilter={false} is critical for custom debounced API searches */}
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search items..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  {isSearching ? (
                    <div className="p-4 text-sm text-center text-muted-foreground">
                      Searching...
                    </div>
                  ) : (
                    <>
                      {/* "+ New Item" Logic */}
                      <CommandEmpty>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm"
                          onClick={handleCreateNewItem}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create &quot;{searchQuery}&quot;
                        </Button>
                      </CommandEmpty>

                      <CommandGroup>
                        {/* 
                          Note: If using real API, you'd map over the fetched results here 
                          instead of the local `items` state.
                        */}
                        {items
                          .filter((item) =>
                            item.name
                              .toLowerCase()
                              .includes(debouncedQuery.toLowerCase()),
                          )
                          .map((item) => (
                            <CommandItem
                              key={item.id}
                              value={item.name}
                              onSelect={() => {
                                setSelectedItem(item);
                                setSearchQuery("");
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedItem?.id === item.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {item.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* QUANTITY AREA */}
        <div className="flex flex-col gap-1.5 w-24">
          <label className="text-sm font-medium">Qty</label>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
      </div>

      <Button onClick={handleSubmit} className="w-full">
        Add to Order
      </Button>
    </div>
  );
}

export default function ItemOrderPage() {
  return <CreatableItemOrder />;
}
