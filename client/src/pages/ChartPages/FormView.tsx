import { useLocation } from 'wouter';
import { SquareForm } from '@/components/SquareForm';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function FormView() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const squareClass = params.get('class');
  const parentText = params.get('parent');
  const depth = params.get('depth');

  const [formData, setFormData] = useState({
    title: '',
    plane: '',
    purpose: '',
    delineator: '',
    notations: '',
    details: '',
    extraData: '',
    name: squareClass || '',
    size: '',
    color: '',
    type: squareClass || '',
    parent_id: parentText || ''
  });

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/square-customization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          squareClass,
          parentText,
          depth: Number(depth)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

      // Return to chart view
      setLocation('/');
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Square Configuration</h1>
        <Button variant="outline" onClick={() => setLocation('/')}>
          Back to Chart
        </Button>
      </div>
      <SquareForm
        squareData={formData}
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto"
      />
    </div>
  );
}
