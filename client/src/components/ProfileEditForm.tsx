import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@db/schema";

interface ProfileEditFormProps {
  section: string;
  initialData: Partial<User>;
  onSave: (data: Partial<User>) => Promise<void>;
  onCancel: () => void;
}

type FormData = Partial<User> & {
  socials: Record<string, string>;
  favorites: Record<string, string>;
  professional: {
    field: string;
    company: string;
    position: string;
    experience: string;
  };
  certifications: Array<{
    company: string;
    title: string;
    year: string;
  }>;
};

export function ProfileEditForm({
  section,
  initialData,
  onSave,
  onCancel
}: ProfileEditFormProps) {
  const [formData, setFormData] = useState<FormData>(initialData as FormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayInputChange = (field: string, value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(Boolean);
    setFormData((prev: FormData) => ({
      ...prev,
      [field]: array
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      toast.success(`${section} updated successfully`);
      onCancel();
    } catch (error) {
      toast.error(`Failed to update ${section}`);
    }
    setIsSubmitting(false);
  };

  const renderFormFields = () => {
    switch (section) {
      case 'Bio':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself"
              />
            </div>
          </div>
        );

      case 'Area':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode || ''}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
              />
            </div>
          </div>
        );

      case 'Socials':
        return (
          <div className="space-y-4">
            {Object.keys(formData.socials || {}).map((platform) => (
              <div key={platform}>
                <Label htmlFor={platform}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</Label>
                <Input
                  id={platform}
                  value={formData.socials[platform] || ''}
                  onChange={(e) => {
                    const newSocials = { ...formData.socials };
                    newSocials[platform] = e.target.value;
                    setFormData((prev) => ({ ...prev, socials: newSocials }));
                  }}
                  placeholder={`Your ${platform} profile URL`}
                />
              </div>
            ))}
          </div>
        );

      case 'Favorites':
        return (
          <div className="space-y-4">
            {Object.keys(formData.favorites || {}).map((category) => (
              <div key={category}>
                <Label htmlFor={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</Label>
                <Input
                  id={category}
                  value={formData.favorites[category] || ''}
                  onChange={(e) => {
                    const newFavorites = { ...formData.favorites };
                    newFavorites[category] = e.target.value;
                    setFormData((prev) => ({ ...prev, favorites: newFavorites }));
                  }}
                  placeholder={`Your favorite ${category}`}
                />
              </div>
            ))}
          </div>
        );

      case 'Hobbies':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="hobbies">Hobbies (comma-separated)</Label>
              <Textarea
                id="hobbies"
                value={(formData.hobbies || []).join(', ')}
                onChange={(e) => handleArrayInputChange('hobbies', e.target.value)}
                placeholder="Reading, Gaming, Hiking..."
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.hobbies?.map((hobby: string, index: number) => (
                  <Badge key={index} variant="secondary">{hobby}</Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 'Talents':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="talents">Talents (comma-separated)</Label>
              <Textarea
                id="talents"
                value={(formData.talents || []).join(', ')}
                onChange={(e) => handleArrayInputChange('talents', e.target.value)}
                placeholder="Programming, Public Speaking, Writing..."
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.talents?.map((talent: string, index: number) => (
                  <Badge key={index} variant="secondary">{talent}</Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 'Career':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="field">Field</Label>
              <Input
                id="field"
                value={formData.professional?.field || ''}
                onChange={(e) => {
                  const newProfessional = { ...formData.professional };
                  newProfessional.field = e.target.value;
                  setFormData((prev) => ({ ...prev, professional: newProfessional }));
                }}
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.professional?.company || ''}
                onChange={(e) => {
                  const newProfessional = { ...formData.professional };
                  newProfessional.company = e.target.value;
                  setFormData((prev) => ({ ...prev, professional: newProfessional }));
                }}
              />
            </div>
            <div>
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.professional?.position || ''}
                onChange={(e) => {
                  const newProfessional = { ...formData.professional };
                  newProfessional.position = e.target.value;
                  setFormData((prev) => ({ ...prev, professional: newProfessional }));
                }}
              />
            </div>
            <div>
              <Label htmlFor="experience">Experience</Label>
              <Textarea
                id="experience"
                value={formData.professional?.experience || ''}
                onChange={(e) => {
                  const newProfessional = { ...formData.professional };
                  newProfessional.experience = e.target.value;
                  setFormData((prev) => ({ ...prev, professional: newProfessional }));
                }}
              />
            </div>
          </div>
        );

      case 'Certifications':
        return (
          <div className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              {formData.certifications?.map((cert, index) => (
                <Card key={index} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Certification {index + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newCerts = [...(formData.certifications || [])];
                          newCerts.splice(index, 1);
                          setFormData((prev) => ({ ...prev, certifications: newCerts }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <Label>Company</Label>
                        <Input
                          value={cert.company || ''}
                          onChange={(e) => {
                            const newCerts = [...(formData.certifications || [])];
                            newCerts[index] = { ...cert, company: e.target.value };
                            setFormData((prev) => ({ ...prev, certifications: newCerts }));
                          }}
                        />
                      </div>
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={cert.title || ''}
                          onChange={(e) => {
                            const newCerts = [...(formData.certifications || [])];
                            newCerts[index] = { ...cert, title: e.target.value };
                            setFormData((prev) => ({ ...prev, certifications: newCerts }));
                          }}
                        />
                      </div>
                      <div>
                        <Label>Year</Label>
                        <Input
                          type="number"
                          value={cert.year || ''}
                          onChange={(e) => {
                            const newCerts = [...(formData.certifications || [])];
                            newCerts[index] = { ...cert, year: e.target.value };
                            setFormData((prev) => ({ ...prev, certifications: newCerts }));
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const newCerts = [...(formData.certifications || [])];
                newCerts.push({ company: '', title: '', year: '' });
                setFormData((prev) => ({ ...prev, certifications: newCerts }));
              }}
            >
              Add Certification
            </Button>
          </div>
        );

      case 'Resume':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="resumeUrl">Resume URL</Label>
              <Input
                id="resumeUrl"
                value={formData.resumeUrl || ''}
                onChange={(e) => handleInputChange('resumeUrl', e.target.value)}
                placeholder="Link to your resume"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit {section}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderFormFields()}
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}