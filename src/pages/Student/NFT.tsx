import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { GraduationCap, Loader2 } from "lucide-react";
import { useAccount, useReadContracts } from "wagmi";
import { useStudentCertificates } from "../../hooks";
import { CONTRACTS } from "../../contracts/addresses";
import { StudentCertificate_ABI } from "../../contracts/abis";
import { useEffect, useState } from "react";

// 定义证书数据类型，结合合约返回和模拟数据
interface NftCertificate {
    id: number;
    course: string;
    completedDate: string; // From metadata or mock
    tokenId: string; // Contract tokenId
    image: string; // From metadata or mock
}

const StudentNFT = () => {
    const { address: userAddress, isConnected } = useAccount();
    const { data: certificateIds, isLoading: isLoadingIds, error: errorIds } = useStudentCertificates(userAddress);

    const [realCertificates, setRealCertificates] = useState<NftCertificate[]>([]);

    // 为每个证书ID创建合约读取请求
    const contractCalls = certificateIds?.map((tokenId: any) => ([
        { // 获取证书详情 (student, courseId, issuedAt, metadataURI)
            address: CONTRACTS.StudentCertificate.address as `0x${string}`,
            abi: StudentCertificate_ABI,
            functionName: 'certificates',
            args: [tokenId],
        },
        { // 获取 metadataURI
            address: CONTRACTS.StudentCertificate.address as `0x${string}`,
            abi: StudentCertificate_ABI,
            functionName: 'tokenURI',
            args: [tokenId],
        }
    ]))?.flat() || [];

    const { data: certificateDetails, isLoading: isLoadingDetails, error: errorDetails } = useReadContracts({
        contracts: contractCalls,
        query: {
            enabled: !!certificateIds && certificateIds.length > 0, // 只有当有证书ID时才启用
        }
    });

    useEffect(() => {
        if (certificateDetails && certificateDetails.length > 0 && certificateIds) {
            const formattedCerts: NftCertificate[] = [];
            for (let i = 0; i < certificateDetails.length; i += 2) {
                const certInfo = certificateDetails[i]?.result as any;
                const tokenURI = certificateDetails[i+1]?.result as string;
                const tokenId = certificateIds[i/2]; // Get actual tokenId

                if (certInfo && tokenURI) {
                    // Placeholder for fetching metadata from URI
                    // For now, we'll parse courseId directly and mock other details
                    const courseId = certInfo.courseId || `Course-${tokenId}`;
                    const issuedAt = certInfo.issuedAt ? new Date(Number(certInfo.issuedAt) * 1000).toLocaleDateString() : 'N/A';

                    formattedCerts.push({
                        id: Number(tokenId), // Use actual tokenId
                        course: courseId,
                        completedDate: issuedAt,
                        tokenId: String(tokenId),
                        image: "🎓" // Replace with actual image from metadataURI if parsed
                    });
                }
            }
            setRealCertificates(formattedCerts);
        } else if (!certificateIds || certificateIds.length === 0) {
             setRealCertificates([]); // No certificates
        }
    }, [certificateDetails, certificateIds]);

    const isLoading = isLoadingIds || isLoadingDetails;
    const error = errorIds || errorDetails;

	// Mock data for UI presentation if no real data
	const mockNftCertificates = [
		{ id: 1, course: "Solidity Fundamentals (Mock)", completedDate: "2025-11-15", tokenId: "0x1a2b3c", image: "🎓" },
		{ id: 2, course: "Smart Contract Security (Mock)", completedDate: "2025-11-20", tokenId: "0x4d5e6f", image: "🔐" },
	];

    if (!isConnected) {
        return (
            <div className="py-8 max-w-7xl mx-auto space-y-8 text-center text-muted-foreground">
                <h1 className="text-3xl font-bold tracking-tight">我的 NFT 证书</h1>
                <p>请连接您的钱包以查看证书。</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2 text-muted-foreground">加载证书中...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8 max-w-7xl mx-auto space-y-8 text-center text-destructive">
                <h1 className="text-3xl font-bold tracking-tight">加载证书失败</h1>
                <p>{error.shortMessage || error.message}</p>
            </div>
        );
    }

	const certificatesToDisplay = realCertificates.length > 0 ? realCertificates : mockNftCertificates;


	return (
		<div className="py-8 max-w-7xl mx-auto space-y-8">
			<h1 className="text-3xl font-bold tracking-tight">我的 NFT 证书</h1>

			<Card className="bg-muted/50 border-none">
				<CardContent className="pt-6">
					<div className="flex gap-4">
						<div className="bg-primary/10 p-2 rounded-full h-fit">
							<GraduationCap className="h-6 w-6 text-primary" />
						</div>
						<div className="space-y-1">
							<h3 className="font-semibold">您的成就 NFT</h3>
							<p className="text-sm text-muted-foreground">
								每完成一门课程，都会在区块链上铸造一份 NFT 证书，证明您的知识和技能。这些证书将永久属于您，并可分享或展示。
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{certificatesToDisplay.map((cert) => (
					<Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-shadow">
						<div className="h-48 bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-6xl">
							{cert.image}
						</div>
						<CardHeader>
							<CardTitle className="line-clamp-1">{cert.course}</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<p className="text-sm text-muted-foreground">
								完成日期: {cert.completedDate}
							</p>
							<p className="text-sm text-muted-foreground font-mono bg-muted p-1 rounded w-fit">
								Token ID: {cert.tokenId}
							</p>
						</CardContent>
						<CardFooter className="gap-2">
							<Button className="flex-1">在区块链上查看</Button>
							<Button variant="outline">分享</Button>
						</CardFooter>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>证书画廊</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground mb-4">
						完成更多课程以获取额外的 NFT 证书，并建立您在区块链上验证的个人档案。
					</p>
					<Button>浏览更多课程</Button>
				</CardContent>
			</Card>
		</div>
	);
};

export default StudentNFT;