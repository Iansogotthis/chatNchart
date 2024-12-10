import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SquareFormData {
  title: string;
  plane: string;
  purpose: string;
  delineator: string;
  notations: string;
  details: string;
  extraData: string;
  name: string;
  size: string;
  color: string;
  type: string;
  parent_id: string;
}

interface SquareFormProps {
  squareData?: Partial<SquareFormData>;
  onSubmit: (data: SquareFormData) => void;
  className?: string;
}

export function SquareForm({ squareData, onSubmit, className = '' }: SquareFormProps) {
  const [formData, setFormData] = useState<SquareFormData>({
    title: '',
    plane: '',
    purpose: '',
    delineator: '',
    notations: '',
    details: '',
    extraData: '',
    name: '',
    size: '',
    color: '',
    type: '',
    parent_id: '',
    ...squareData
  });

  useEffect(() => {
    if (squareData) {
      setFormData(prev => ({ ...prev, ...squareData }));
    }
  }, [squareData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {[
        'title', 'plane', 'purpose', 'delineator', 'notations',
        'name', 'size', 'color', 'type', 'parent_id'
      ].map((field) => (
        <div key={field} className="space-y-2">
          <Label htmlFor={field}>
            {field.charAt(0).toUpperCase() + field.slice(1)}
          </Label>
          <Input
            id={field}
            value={formData[field as keyof SquareFormData]}
            onChange={handleChange}
          />
        </div>
      ))}

      <div className="space-y-2">
        <Label htmlFor="details">Details</Label>
        <Textarea
          id="details"
          value={formData.details}
          onChange={handleChange}
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="extraData">Extra Data</Label>
        <Textarea
          id="extraData"
          value={formData.extraData}
          onChange={handleChange}
          className="min-h-[100px]"
        />
      </div>

      <Button type="submit">Save Changes</Button>
    </form>
  );
}
