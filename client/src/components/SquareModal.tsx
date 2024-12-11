import React, { useState } from 'react';
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

interface SquareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SquareData) => void;
  initialData: SquareData;
}

interface SquareData {
  title: string;
  priority: {
    density: number;
    durability: 'single' | 'double' | 'dotted' | 'dashed';
    decor: string;
  };
  urgency: string;
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
  viewMode?: 'scoped' | 'scaled' | 'included-build';
}

export default function SquareModal({ isOpen, onClose, onSave, initialData }: SquareModalProps) {
  const [data, setData] = useState<SquareData>(initialData);
  
  const handleSave = () => {
    // Ensure all data is properly typed before saving
    const validatedData: SquareData = {
      title: data.title,
      priority: {
        density: Number(data.priority?.density) || 1,
        durability: data.priority?.durability || 'single',
        decor: data.priority?.decor || '#000000'
      },
      urgency: data.urgency || '#000000',
      aesthetic: {
        impact: {
          bold: Boolean(data.aesthetic?.impact?.bold),
          italic: Boolean(data.aesthetic?.impact?.italic),
          underline: Boolean(data.aesthetic?.impact?.underline)
        },
        affect: {
          fontFamily: data.aesthetic?.affect?.fontFamily || 'Arial',
          fontSize: Number(data.aesthetic?.affect?.fontSize) || 14
        },
        effect: {
          color: data.aesthetic?.effect?.color || '#000000'
        }
      },
      viewMode: data.viewMode
    };
    onSave(validatedData);
    onClose();
  };

  const handleViewChange = (mode: SquareData['viewMode']) => {
    const updatedData = { ...data, viewMode: mode };
    setData(updatedData);
    handleSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Square</DialogTitle>
          <DialogHeader>
            <p className="text-sm text-muted-foreground">
              Customize the appearance and behavior of the selected square.
            </p>
          </DialogHeader>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Priority</Label>
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Border Width ({data.priority.density}px)</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="flex flex-col space-y-2">
                    {[1, 2, 3, 4, 5].map((density) => (
                      <Button
                        key={density}
                        variant="ghost"
                        onClick={() => setData({
                          ...data,
                          priority: { ...data.priority, density }
                        })}
                        className="justify-start"
                      >
                        <div className="w-full border-t" style={{ borderWidth: `${density}px` }} />
                        {density}px
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Durability</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="flex flex-col space-y-2">
                    {['single', 'double', 'dotted', 'dashed'].map((style) => (
                      <Button
                        key={style}
                        variant="ghost"
                        onClick={() => setData({
                          ...data,
                          priority: {
                            ...data.priority,
                            durability: style as 'single' | 'double' | 'dotted' | 'dashed'
                          }
                        })}
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Decor</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Input
                    type="color"
                    value={data.priority.decor}
                    onChange={(e) => setData({
                      ...data,
                      priority: { ...data.priority, decor: e.target.value }
                    })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Urgency</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { color: '#FF0000', name: 'red' },
                { color: '#FFD700', name: 'yellow' },
                { color: '#FFA500', name: 'orange' },
                { color: '#00FF00', name: 'green' },
                { color: '#000000', name: 'black' }
              ].map(({ color, name }) => (
                <Button
                  key={name}
                  variant="outline"
                  onClick={() => setData({ ...data, urgency: color })}
                  className={`w-12 h-12 rounded-full ${data.urgency === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Set urgency color to ${name}`}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Aesthetic</Label>
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Impact</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant={data.aesthetic.impact.bold ? 'default' : 'outline'}
                      onClick={() => setData({
                        ...data,
                        aesthetic: {
                          ...data.aesthetic,
                          impact: { ...data.aesthetic.impact, bold: !data.aesthetic.impact.bold }
                        }
                      })}
                      className="font-bold"
                    >
                      Bold Text
                    </Button>
                    <Button
                      variant={data.aesthetic.impact.italic ? 'default' : 'outline'}
                      onClick={() => setData({
                        ...data,
                        aesthetic: {
                          ...data.aesthetic,
                          impact: { ...data.aesthetic.impact, italic: !data.aesthetic.impact.italic }
                        }
                      })}
                      className="italic"
                    >
                      Italic Text
                    </Button>
                    <Button
                      variant={data.aesthetic.impact.underline ? 'default' : 'outline'}
                      onClick={() => setData({
                        ...data,
                        aesthetic: {
                          ...data.aesthetic,
                          impact: { ...data.aesthetic.impact, underline: !data.aesthetic.impact.underline }
                        }
                      })}
                      className="underline"
                    >
                      Underline Text
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Affect</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="grid gap-4">
                    <div>
                      <Label>Font Size</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={data.aesthetic.affect.fontSize}
                          onChange={(e) => setData({
                            ...data,
                            aesthetic: {
                              ...data.aesthetic,
                              affect: { ...data.aesthetic.affect, fontSize: parseInt(e.target.value) || 14 }
                            }
                          })}
                          min="8"
                          max="72"
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">px</span>
                      </div>
                    </div>
                    <div>
                      <Label>Font Family</Label>
                      <select
                        value={data.aesthetic.affect.fontFamily}
                        onChange={(e) => setData({
                          ...data,
                          aesthetic: {
                            ...data.aesthetic,
                            affect: { ...data.aesthetic.affect, fontFamily: e.target.value }
                          }
                        })}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                      </select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Effect</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Input
                    type="color"
                    value={data.aesthetic.effect.color}
                    onChange={(e) => setData({
                      ...data,
                      aesthetic: {
                        ...data.aesthetic,
                        effect: { color: e.target.value }
                      }
                    })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-4 mt-4 px-4 pb-4">
          <Button 
            onClick={handleSave} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
          >
            Save Changes
          </Button>
          
          <Button 
            onClick={() => handleViewChange('included-build')} 
            variant="outline" 
            className="w-full border-2 shadow-sm hover:bg-accent"
          >
            In/Xclude Build
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
