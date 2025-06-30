import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit, Plus, Users, Crown, Star, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PlatformUser, InsertPlatformUser } from "@shared/schema";

interface PlatformUserManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const planIcons = {
  free: <Star className="w-4 h-4" />,
  basic: <Zap className="w-4 h-4" />,
  pro: <Crown className="w-4 h-4" />
};

const planColors = {
  free: "bg-gray-100 text-gray-800",
  basic: "bg-blue-100 text-blue-800", 
  pro: "bg-purple-100 text-purple-800"
};

const planLimits = {
  free: { maxGalleries: 1, maxMediaPerGallery: 50 },
  basic: { maxGalleries: 3, maxMediaPerGallery: 200 },
  pro: { maxGalleries: 999, maxMediaPerGallery: 9999 }
};

export default function PlatformUserManagement({ isOpen, onClose }: PlatformUserManagementProps) {
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertPlatformUser>>({
    email: "",
    name: "",
    planType: "free",
    paymentStatus: "unpaid",
    maxGalleries: 1,
    maxMediaPerGallery: 50
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<PlatformUser[]>({
    queryKey: ["/api/platform-users"],
    enabled: isOpen
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: InsertPlatformUser) => apiRequest("/api/platform-users", {
      method: "POST",
      body: userData
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-users"] });
      toast({ title: "Benutzer erfolgreich erstellt" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Fehler beim Erstellen des Benutzers", variant: "destructive" });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PlatformUser> }) => 
      apiRequest(`/api/platform-users/${id}`, {
        method: "PUT",
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-users"] });
      toast({ title: "Benutzer erfolgreich aktualisiert" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Fehler beim Aktualisieren des Benutzers", variant: "destructive" });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/platform-users/${id}`, {
      method: "DELETE"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-users"] });
      toast({ title: "Benutzer erfolgreich gelöscht" });
    },
    onError: () => {
      toast({ title: "Fehler beim Löschen des Benutzers", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
      planType: "free",
      paymentStatus: "unpaid",
      maxGalleries: 1,
      maxMediaPerGallery: 50
    });
    setEditingUser(null);
    setIsCreating(false);
  };

  const handlePlanChange = (planType: string) => {
    const limits = planLimits[planType as keyof typeof planLimits];
    setFormData({
      ...formData,
      planType,
      maxGalleries: limits.maxGalleries,
      maxMediaPerGallery: limits.maxMediaPerGallery
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.name) {
      toast({ title: "Bitte füllen Sie alle Pflichtfelder aus", variant: "destructive" });
      return;
    }

    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: formData });
    } else {
      createUserMutation.mutate(formData as InsertPlatformUser);
    }
  };

  const startEdit = (user: PlatformUser) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      planType: user.planType,
      paymentStatus: user.paymentStatus,
      maxGalleries: user.maxGalleries,
      maxMediaPerGallery: user.maxMediaPerGallery
    });
    setIsCreating(true);
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Plattform-Benutzer Verwaltung
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {users?.length || 0} Benutzer registriert
            </div>
            <Button onClick={startCreate} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Neuen Benutzer erstellen
            </Button>
          </div>

          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingUser ? "Benutzer bearbeiten" : "Neuen Benutzer erstellen"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">E-Mail-Adresse</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="planType">Plan-Typ</Label>
                      <Select 
                        value={formData.planType} 
                        onValueChange={handlePlanChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paymentStatus">Zahlungsstatus</Label>
                      <Select 
                        value={formData.paymentStatus || ""} 
                        onValueChange={(value: string) => setFormData({ ...formData, paymentStatus: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">Unbezahlt</SelectItem>
                          <SelectItem value="paid">Bezahlt</SelectItem>
                          <SelectItem value="expired">Abgelaufen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxGalleries">Max. Galerien</Label>
                      <Input
                        id="maxGalleries"
                        type="number"
                        value={formData.maxGalleries || 1}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, maxGalleries: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxMediaPerGallery">Max. Medien pro Galerie</Label>
                      <Input
                        id="maxMediaPerGallery"
                        type="number"
                        value={formData.maxMediaPerGallery || 50}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, maxMediaPerGallery: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={createUserMutation.isPending || updateUserMutation.isPending}
                    >
                      {editingUser ? "Aktualisieren" : "Erstellen"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Abbrechen
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {isLoading ? (
              <div>Laden...</div>
            ) : (
              users?.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          <div className="text-xs text-gray-500">
                            Erstellt: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('de-DE') : 'Unbekannt'}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge className={`flex items-center gap-1 ${planColors[user.planType as keyof typeof planColors]}`}>
                            {planIcons[user.planType as keyof typeof planIcons]}
                            {user.planType.toUpperCase()}
                          </Badge>
                          <Badge variant={user.paymentStatus === 'paid' ? 'default' : 'destructive'}>
                            {user.paymentStatus === 'paid' ? 'Bezahlt' : 
                             user.paymentStatus === 'expired' ? 'Abgelaufen' : 'Unbezahlt'}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <div>{user.maxGalleries} Galerien</div>
                          <div>{user.maxMediaPerGallery} Medien/Galerie</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteUserMutation.mutate(user.id)}
                          disabled={deleteUserMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}