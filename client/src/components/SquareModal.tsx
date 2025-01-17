import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

interface SquareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SquareData) => void;
  initialData: SquareData;
  squareClass?: string;
  parentText?: string;
  depth?: number;
}

interface SquareData {
  title: string;
  priority: {
    density: 1 | 2 | 3 | 4;
    durability: 'single' | 'double' | 'dotted' | 'dashed';
    decor: string;
  };
  urgency: 'red' | 'yellow' | 'orange' | 'green' | 'black';
  aesthetic: {
    impact: {
      bold: boolean;
      italic: boolean;
      underline: boolean;
    };
    affect: {
      fontFamily: string;
      fontSize: number;
    };
    effect: {
      color: string;
    };
  };
}

export default function SquareModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  squareClass,
  parentText,
  depth
}: SquareModalProps) {
  const [data, setData] = useState<SquareData>(initialData);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleDataChange = (path: string[], value: any) => {
    setData(prevData => {
      const newData = { ...prevData };
      let current: any = newData;

      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }

      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  const openDetailings = () => {
    if (!squareClass || !parentText || depth === undefined) {
      toast.error("Square information is incomplete");
      return;
    }
    const params = new URLSearchParams({
      class: squareClass,
      parent: parentText,
      depth: depth.toString()
    });
    setLocation(`/form?${params.toString()}`);
    onClose(); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-md h-[90vh] md:h-auto flex flex-col p-4 md:p-6 gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Square</DialogTitle>
          <div className="text-sm text-muted-foreground">
            Customize the appearance and behavior of the selected square.
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => handleDataChange(['title'], e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Priority</Label>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">Density ({data.priority?.density || 1}px)</Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="flex flex-col space-y-2">
                      {[1, 2, 3, 4].map((density) => (
                        <Button
                          key={density}
                          variant="ghost"
                          onClick={() => handleDataChange(['priority', 'density'], density)}
                        >
                          {density}px
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      {data.priority?.durability || 'single'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="flex flex-col space-y-2">
                      {['single', 'double', 'dotted', 'dashed'].map((style) => (
                        <Button
                          key={style}
                          variant="ghost"
                          onClick={() => handleDataChange(['priority', 'durability'], style)}
                        >
                          {style}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">Border Color</Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Input
                      type="color"
                      value={data.priority?.decor || '#000000'}
                      onChange={(e) => handleDataChange(['priority', 'decor'], e.target.value)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Urgency</Label>
              <div className="flex flex-wrap gap-2">
                {['red', 'yellow', 'orange', 'green', 'black'].map((color) => (
                  <Button
                    key={color}
                    variant={data.urgency === color ? 'default' : 'outline'}
                    onClick={() => handleDataChange(['urgency'], color)}
                    className={data.urgency === color ? 'bg-opacity-90' : ''}
                    style={{
                      backgroundColor: data.urgency === color ? color : undefined,
                      color: data.urgency === color ? (color === 'black' ? 'white' : 'black') : undefined
                    }}
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Text Style</Label>
              <div className="flex space-x-2">
                <Button
                  variant={data.aesthetic?.impact?.bold ? 'default' : 'outline'}
                  onClick={() => handleDataChange(
                    ['aesthetic', 'impact', 'bold'],
                    !data.aesthetic?.impact?.bold
                  )}
                >
                  Bold
                </Button>
                <Button
                  variant={data.aesthetic?.impact?.italic ? 'default' : 'outline'}
                  onClick={() => handleDataChange(
                    ['aesthetic', 'impact', 'italic'],
                    !data.aesthetic?.impact?.italic
                  )}
                >
                  Italic
                </Button>
                <Button
                  variant={data.aesthetic?.impact?.underline ? 'default' : 'outline'}
                  onClick={() => handleDataChange(
                    ['aesthetic', 'impact', 'underline'],
                    !data.aesthetic?.impact?.underline
                  )}
                >
                  Underline
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Font Settings</Label>
              <div className="flex space-x-2">
                <select
                  value={data.aesthetic?.affect?.fontFamily || 'Arial'}
                  onChange={(e) => handleDataChange(['aesthetic', 'affect', 'fontFamily'], e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                </select>

                <Input
                  type="number"
                  value={data.aesthetic?.affect?.fontSize || 14}
                  onChange={(e) => handleDataChange(
                    ['aesthetic', 'affect', 'fontSize'],
                    parseInt(e.target.value)
                  )}
                  min="8"
                  max="72"
                  className="w-24"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Text Color</Label>
              <Input
                type="color"
                value={data.aesthetic?.effect?.color || '#000000'}
                onChange={(e) => handleDataChange(['aesthetic', 'effect', 'color'], e.target.value)}
              />
            </div>
          </div>
          <ScrollBar />
        </ScrollArea>

        <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-4">
          <Button
            variant="secondary"
            onClick={openDetailings}
            className="w-full sm:w-auto"
          >
            View Detailings
          </Button>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={() => onSave(data)} className="w-full sm:w-auto">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}