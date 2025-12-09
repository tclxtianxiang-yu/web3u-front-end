import { useState } from 'react';
import { graphQLClient } from '../lib/graphql';
import { GENERATE_VIDEO_UPLOAD_URL_MUTATION } from '../lib/mutations';
import { useToast } from '../components/ui/use-toast';

export const useFileUpload = () => {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        try {
            // 1. Get pre-signed URL
            const response: any = await graphQLClient.request(GENERATE_VIDEO_UPLOAD_URL_MUTATION, {
                input: {
                    fileName: file.name,
                    contentType: file.type,
                },
            });

            const { uploadUrl, publicUrl } = response.generateVideoUploadUrl;

            // 2. Upload file to S3
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            });

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed with status ${uploadResponse.status}`);
            }

            return publicUrl;
        } catch (error: any) {
            console.error("File upload error:", error);
            toast({ 
                variant: "destructive", 
                title: "Upload failed", 
                description: error.message || "Failed to upload file." 
            });
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    return { uploadFile, isUploading };
};
