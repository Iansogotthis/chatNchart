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
  viewMode?: 'scoped' | 'scaled' | 'included-build';
}

export default function SquareModal({ isOpen, onClose, onSave, initialData }: SquareModalProps) {
  const [data, setData] = useState<SquareData>(initialData);
  
  const handleSave = () => {
    onSave(data);
    onClose();
  };

  const handleViewChange = (mode: SquareData['viewMode']) => {
    setData({ ...data, viewMode: mode });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Square</DialogTitle>
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
                  <Button variant="outline">Density ({data.priority.density}px)</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="flex flex-col space-y-2">
                    {[1, 2, 3, 4].map((density) => (
                      <Button
                        key={density}
                        variant="ghost"
                        onClick={() => setData({
                          ...data,
                          priority: { ...data.priority, density }
                        })}
                      >
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
              {['red', 'yellow', 'orange', 'green', 'black'].map((color) => (
                <Button
                  key={color}
                  variant={data.urgency === color ? 'default' : 'outline'}
                  onClick={() => setData({ ...data, urgency: color as SquareData['urgency'] })}
                  style={{ backgroundColor: color === data.urgency ? color : undefined }}
                >
                  {color}
                </Button>
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
                      variant="ghost"
                      onClick={() => setData({
                        ...data,
                        aesthetic: {
                          ...data.aesthetic,
                          impact: { ...data.aesthetic.impact, bold: !data.aesthetic.impact.bold }
                        }
                      })}
                    >
                      Bold
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setData({
                        ...data,
                        aesthetic: {
                          ...data.aesthetic,
                          impact: { ...data.aesthetic.impact, italic: !data.aesthetic.impact.italic }
                        }
                      })}
                    >
                      Italic
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setData({
                        ...data,
                        aesthetic: {
                          ...data.aesthetic,
                          impact: { ...data.aesthetic.impact, underline: !data.aesthetic.impact.underline }
                        }
                      })}
                    >
                      Underline
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Affect</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="grid gap-2">
                    <Input
                      type="number"
                      value={data.aesthetic.affect.fontSize}
                      onChange={(e) => setData({
                        ...data,
                        aesthetic: {
                          ...data.aesthetic,
                          affect: { ...data.aesthetic.affect, fontSize: parseInt(e.target.value) }
                        }
                      })}
                      min="8"
                      max="72"
                    />
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
                    </select>
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

        <div className="flex justify-end mt-4">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>

        <div className="flex justify-between mt-4">
          <Button onClick={() => handleViewChange('scaled')} variant="outline" className="flex-1 mx-1">
            Scaled View
          </Button>
          <Button onClick={() => handleViewChange('scoped')} variant="outline" className="flex-1 mx-1">
            Scoped View
          </Button>
          <Button onClick={() => handleViewChange('included-build')} variant="outline" className="flex-1 mx-1">
            Include Build
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
