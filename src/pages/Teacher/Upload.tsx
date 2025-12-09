import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Upload, Video, Image as ImageIcon, Loader2, X, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ui/use-toast";
import { graphQLClient } from "../../lib/graphql";
import { GENERATE_VIDEO_UPLOAD_URL_MUTATION } from "../../lib/mutations";
import { CREATE_COURSE } from "../../lib/queries";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router"; // Import useNavigate

const TeacherUpload = () => {
    const { isAuthenticated } = useAuth();
    const { address: userAddress } = useAccount();
    const { toast } = useToast();
    const [isVideoUploading, setIsVideoUploading] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        category: "",
        videoUrl: "",
        thumbnailUrl: ""
    });
    const navigate = useNavigate(); // Initialize useNavigate

    const captureVideoFrame = (videoFile: File): Promise<Blob | null> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = URL.createObjectURL(videoFile);
            video.muted = true;
            video.playsInline = true;
            video.currentTime = 1; 

            video.onloadeddata = () => {
                if (video.currentTime < 0.1) { 
                }
            };

            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        URL.revokeObjectURL(video.src);
                        resolve(blob);
                    }, 'image/jpeg', 0.8);
                } else {
                    resolve(null);
                }
            };
            
            video.onerror = () => {
                URL.revokeObjectURL(video.src);
                resolve(null);
            };
        });
    };

    const uploadFileToS3 = async (file: File | Blob, contentType: string, fileName: string) => {
        const response: any = await graphQLClient.request(GENERATE_VIDEO_UPLOAD_URL_MUTATION, {
            input: {
                fileName: fileName,
                contentType: contentType,
            },
        });

        const { uploadUrl, publicUrl } = response.generateVideoUploadUrl;

        await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': contentType,
            },
        });

        return publicUrl;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'image') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isAuthenticated) {
            toast({ variant: "destructive", title: "Login required", description: "Please connect wallet and sign in to upload." });
            return;
        }

        if (type === 'video') setIsVideoUploading(true);
        else setIsImageUploading(true);

        try {
            const publicUrl = await uploadFileToS3(file, file.type, file.name);

            setFormData(prev => ({
                ...prev,
                [type === 'video' ? 'videoUrl' : 'thumbnailUrl']: publicUrl
            }));

            toast({ title: "Success", description: `${type === 'video' ? 'Video' : 'Thumbnail'} uploaded successfully!` });

            if (type === 'video') {
                setIsImageUploading(true);
                try {
                    const thumbnailBlob = await captureVideoFrame(file);
                    if (thumbnailBlob) {
                        const thumbnailFileName = `thumb_${file.name.split('.')[0]}.jpg`;
                        const thumbnailUrl = await uploadFileToS3(thumbnailBlob, 'image/jpeg', thumbnailFileName);
                        
                        setFormData(prev => ({
                            ...prev,
                            thumbnailUrl: thumbnailUrl
                        }));
                        toast({ title: "Auto-generated", description: "Thumbnail generated from video!" });
                    }
                } catch (thumbError) {
                    console.error("Thumbnail generation failed:", thumbError);
                } finally {
                    setIsImageUploading(false);
                }
            }

        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Upload failed", description: "Failed to upload file." });
        } finally {
            if (type === 'video') setIsVideoUploading(false);
            else if (type === 'image') setIsImageUploading(false);
            
            e.target.value = '';
        }
    };

    const handleDeleteFile = (type: 'video' | 'image') => {
        setFormData(prev => ({
            ...prev,
            [type === 'video' ? 'videoUrl' : 'thumbnailUrl']: ""
        }));
    };

    const handlePublish = async () => {
        if (!isAuthenticated) {
            toast({ variant: "destructive", title: "Login required", description: "Please connect wallet and sign in to publish." });
            return;
        }

        if (!userAddress) {
            toast({ variant: "destructive", title: "Wallet required", description: "Please connect your wallet to publish." });
            return;
        }

        try {
            await graphQLClient.request(CREATE_COURSE, {
                input: {
                    title: formData.title,
                    description: formData.description,
                    priceYd: parseFloat(formData.price),
                    teacherWalletAddress: userAddress,
                    category: formData.category,
                    videoUrl: formData.videoUrl,
                    thumbnailUrl: formData.thumbnailUrl,
                    status: "published"
                }
            });
            toast({ title: "Success", description: "Course published successfully!" });
            navigate('/teacher/courses'); // Redirect on success
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to publish course." });
        }
    };

    const isUploading = isVideoUploading || isImageUploading;

	return (
		<div className="py-8 max-w-4xl mx-auto space-y-8">
			<div className="space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">Upload New Course</h1>
				<p className="text-muted-foreground">Create and publish a new course to the Web3 University.</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Course Details</CardTitle>
					<CardDescription>
						Enter the basic information about your course.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="title">Course Title</Label>
						<Input 
                            id="title" 
                            placeholder="e.g. Advanced Solidity Patterns" 
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            disabled={isUploading}
                        />
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							placeholder="Describe what students will learn in this course..."
							className="min-h-[120px]"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            disabled={isUploading}
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-2">
							<Label htmlFor="price">Price (YD Tokens)</Label>
							<Input 
                                id="price" 
                                type="number" 
                                placeholder="e.g. 100" 
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                                disabled={isUploading}
                            />
						</div>

						<div className="space-y-2">
							<Label htmlFor="category">Category</Label>
							<Select onValueChange={(value) => setFormData({...formData, category: value})} disabled={isUploading}>
								<SelectTrigger id="category">
									<SelectValue placeholder="Select a category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="blockchain">Blockchain Basics</SelectItem>
									<SelectItem value="solidity">Solidity Development</SelectItem>
									<SelectItem value="defi">DeFi</SelectItem>
									<SelectItem value="nft">NFTs</SelectItem>
									<SelectItem value="security">Security</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Media & Content</CardTitle>
					<CardDescription>
						Upload your course video and thumbnail. Videos are stored securely on the cloud with on-chain proof.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Label>Course Video</Label>
                        {formData.videoUrl ? (
                            <div className="relative rounded-lg overflow-hidden border bg-black aspect-video group">
                                <video 
                                    src={formData.videoUrl} 
                                    controls 
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute top-2 right-2">
                                     <Button
                                        variant="secondary"
                                        size="icon"
                                        className="h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDeleteFile('video')}
                                        disabled={isUploading}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className={`border-2 border-dashed transition-colors rounded-lg p-8 text-center cursor-pointer relative ${
                                isVideoUploading ? "border-primary bg-primary/5 cursor-not-allowed" : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/50 hover:bg-muted"
                            }`}>
                                <input 
                                    type="file" 
                                    accept="video/*" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    onChange={(e) => handleFileChange(e, 'video')}
                                    disabled={isUploading}
                                />
                                {isVideoUploading ? (
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                                        <p className="text-sm text-muted-foreground">Uploading video...</p>
                                    </div>
                                ) : (
                                    <>
                                        <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                        <div className="text-sm text-muted-foreground">
                                            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            MP4, MOV up to 2GB
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
					</div>

					<div className="space-y-2">
						<Label>Course Thumbnail</Label>
                        {formData.thumbnailUrl ? (
                            <div className="relative rounded-lg overflow-hidden border bg-muted aspect-video group">
                                <img 
                                    src={formData.thumbnailUrl} 
                                    alt="Thumbnail preview" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2">
                                     <Button
                                        variant="secondary"
                                        size="icon"
                                        className="h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDeleteFile('image')}
                                        disabled={isUploading}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className={`border-2 border-dashed transition-colors rounded-lg p-8 text-center cursor-pointer relative ${
                                isImageUploading ? "border-primary bg-primary/5 cursor-not-allowed" : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/50 hover:bg-muted"
                            }`}>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    onChange={(e) => handleFileChange(e, 'image')}
                                    disabled={isUploading}
                                />
                                {isImageUploading ? (
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            {isVideoUploading ? "Generating thumbnail..." : "Uploading thumbnail..."}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                        <div className="text-sm text-muted-foreground">
                                            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            PNG, JPG up to 5MB
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
					</div>
				</CardContent>
				<CardFooter className="flex justify-end gap-4">
					<Button variant="outline" disabled={isUploading}>Save as Draft</Button>
					<Button onClick={handlePublish} disabled={isUploading}>
						{isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
						Publish Course
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};

export default TeacherUpload;
