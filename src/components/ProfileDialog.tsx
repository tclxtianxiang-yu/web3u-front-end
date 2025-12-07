import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./ui/use-toast";
import { Loader2 } from "lucide-react";
import { Avatar } from "./ui/avatar";

interface ProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync state with user context
  useState(() => {
    setUsername(user?.username || "");
    setEmail(user?.email || "");
    setAvatarUrl(user?.avatarUrl || "");
  }, [user]);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await updateProfile({ username, email, avatarUrl });
      toast({ title: "Success", description: "Profile updated successfully!" });
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-center items-center">
            <Avatar className="h-24 w-24">
              <img src={avatarUrl || "https://assets.mikasa-ackerman.vip/uPic/202512071111001765077060.png"} alt="Avatar" className="object-cover" />
            </Avatar>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="avatarUrl" className="text-right">
              Avatar URL
            </Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="col-span-3"
              disabled={isUpdating}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
              disabled={isUpdating}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              disabled={isUpdating}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;