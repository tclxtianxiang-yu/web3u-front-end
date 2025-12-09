import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "./ui/use-toast";
import { Loader2, Trash2, Video, Image as ImageIcon, X } from "lucide-react";
import { useFileUpload } from "../hooks/useFileUpload";
import { graphQLClient } from "../lib/graphql";
import { UPDATE_COURSE_MUTATION, REMOVE_COURSE_MUTATION } from "../lib/mutations";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface EditCourseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  course: any;
}

const EditCourseDialog: React.FC<EditCourseDialogProps> = ({ isOpen, onClose, course }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { uploadFile, isUploading } = useFileUpload();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    videoUrl: "",
    thumbnailUrl: "",
    status: ""
  });

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
        price: course.priceYd?.toString() || "",
        category: course.category || "",
        videoUrl: course.videoUrl || "",
        thumbnailUrl: course.thumbnailUrl || "",
        status: course.status || "draft"
      });
    }
  }, [course]);

  const updateMutation = useMutation({
    mutationFn: async (input: any) => {
      return await graphQLClient.request(UPDATE_COURSE_MUTATION, { 
        courseId: course.id, 
        input 
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Course updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["teacherCourses"] });
      onClose();
    },
    onError: (error: any) => {
      console.error("Update failed:", error);
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update course." });
    }
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      return await graphQLClient.request(REMOVE_COURSE_MUTATION, { courseId: course.id });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Course removed successfully!" });
      queryClient.invalidateQueries({ queryKey: ["teacherCourses"] });
      onClose();
    },
    onError: (error: any) => {
      console.error("Remove failed:", error);
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to remove course." });
    }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file);
    if (url) {
      setFormData(prev => ({
        ...prev,
        [type === 'video' ? 'videoUrl' : 'thumbnailUrl']: url
      }));
      toast({ title: "Success", description: "File uploaded successfully!" });
    }
    e.target.value = '';
  };

  const handleDeleteFile = (type: 'video' | 'image') => {
    setFormData(prev => ({
        ...prev,
        [type === 'video' ? 'videoUrl' : 'thumbnailUrl']: ""
    }));
  };

  const handleSave = () => {
    updateMutation.mutate({
      title: formData.title,
      description: formData.description,
      priceYd: parseFloat(formData.price),
      category: formData.category,
      videoUrl: formData.videoUrl,
      thumbnailUrl: formData.thumbnailUrl,
      status: formData.status
    });
  };

  const handleDeleteCourse = () => {
    if (confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      removeMutation.mutate();
    }
  };

  const isProcessing = isUploading || updateMutation.isPending || removeMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>
            Update course details or remove the course.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={isProcessing}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isProcessing}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Price (YD)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                disabled={isProcessing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val) => setFormData({ ...formData, category: val })}
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blockchain">Blockchain</SelectItem>
                  <SelectItem value="solidity">Solidity</SelectItem>
                  <SelectItem value="defi">DeFi</SelectItem>
                  <SelectItem value="nft">NFTs</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Video</Label>
            {formData.videoUrl ? (
                <div className="relative rounded-md border bg-black aspect-video group">
                    <video src={formData.videoUrl} className="w-full h-full object-contain" controls />
                    <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={() => handleDeleteFile('video')}
                        disabled={isProcessing}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-muted/50 relative">
                    <input 
                        type="file" 
                        accept="video/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleFileChange(e, 'video')}
                        disabled={isProcessing}
                    />
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Video className="h-8 w-8" />
                        <span className="text-xs">Upload Video</span>
                    </div>
                </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Thumbnail</Label>
            {formData.thumbnailUrl ? (
                <div className="relative rounded-md border bg-muted aspect-video group">
                    <img src={formData.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={() => handleDeleteFile('image')}
                        disabled={isProcessing}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-muted/50 relative">
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleFileChange(e, 'image')}
                        disabled={isProcessing}
                    />
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                        <span className="text-xs">Upload Thumbnail</span>
                    </div>
                </div>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex-1">
            <Button variant="destructive" onClick={handleDeleteCourse} disabled={isProcessing}>
                {removeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete Course
            </Button>
          </div>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            {updateMutation.isPending || isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCourseDialog;
