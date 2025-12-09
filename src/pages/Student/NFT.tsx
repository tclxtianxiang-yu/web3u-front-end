import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { GraduationCap, Loader2 } from "lucide-react";
import { useAccount, useReadContracts } from "wagmi";
import { useStudentCertificates } from "../../hooks";
import { CONTRACTS } from "../../contracts/addresses";
import { StudentCertificate_ABI } from "../../contracts/abis";
import { useEffect, useState } from "react";

// 证书数据类型，结合链上数据与 metadata
interface NftCertificate {
    id: number;
    course: string;
    completedDate: string;
    tokenId: string;
    image: string;
    metadataUrl?: string;
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
        const loadCertificates = async () => {
            if (!certificateDetails || certificateDetails.length === 0 || !certificateIds) {
                setRealCertificates([]);
                return;
            }

            const parsed: NftCertificate[] = [];
            for (let i = 0; i < certificateDetails.length; i += 2) {
                const certInfo = certificateDetails[i]?.result as any;
                const tokenURI = certificateDetails[i + 1]?.result as string;
                const tokenId = certificateIds[i / 2];

                if (!certInfo || !tokenURI) continue;

                const courseId = certInfo.courseId || `Course-${tokenId}`;
                const issuedAt = certInfo.issuedAt ? new Date(Number(certInfo.issuedAt) * 1000).toLocaleDateString() : "N/A";

                let image = "🎓";
                let title = `Course ${courseId}`;
                try {
                    const res = await fetch(tokenURI);
                    if (res.ok) {
                        const meta = await res.json();
                        if (meta?.image) image = meta.image;
                        if (meta?.name) title = meta.name;
                        // 若 metadata 含有 completedDate 字段则覆盖
                        if (meta?.completedDate) {
                            const d = new Date(meta.completedDate);
                            if (!Number.isNaN(d.getTime())) {
                                parsed.push({
                                    id: Number(tokenId),
                                    course: title,
                                    completedDate: d.toLocaleDateString(),
                                    tokenId: String(tokenId),
                                    image,
                                    metadataUrl: tokenURI,
                                });
                                continue;
                            }
                        }
                    }
                } catch {
                    // ignore metadata fetch errors，使用链上字段
                }

                parsed.push({
                    id: Number(tokenId),
                    course: title,
                    completedDate: issuedAt,
                    tokenId: String(tokenId),
                    image,
                    metadataUrl: tokenURI,
                });
            }
            setRealCertificates(parsed);
        };

        loadCertificates();
    }, [certificateDetails, certificateIds]);

    const isLoading = isLoadingIds || isLoadingDetails;
    const error = errorIds || errorDetails;

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

			{realCertificates.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="py-10 text-center text-muted-foreground space-y-3">
						<GraduationCap className="w-10 h-10 mx-auto text-primary" />
						<p>暂时没有证书，完成课程即可获得链上 NFT 证书。</p>
						<Button variant="outline">去浏览课程</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{realCertificates.map((cert) => {
						const explorerUrl = `https://sepolia.etherscan.io/token/${CONTRACTS.StudentCertificate.address}?a=${cert.tokenId}`;
						return (
							<Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-shadow">
								<div className="h-48 bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-6xl">
									{cert.image.startsWith("http") ? (
										<img src={cert.image} alt={cert.course} className="h-full w-full object-cover" />
									) : (
										cert.image
									)}
								</div>
								<CardHeader>
									<CardTitle className="line-clamp-1">{cert.course}</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2">
									<p className="text-sm text-muted-foreground">完成日期: {cert.completedDate}</p>
									<p className="text-sm text-muted-foreground font-mono bg-muted p-1 rounded w-fit">
										Token ID: {cert.tokenId}
									</p>
								</CardContent>
								<CardFooter className="gap-2">
									<Button asChild className="flex-1">
										<a href={explorerUrl} target="_blank" rel="noreferrer">
											在区块链上查看
										</a>
									</Button>
									{cert.metadataUrl ? (
										<Button variant="outline" asChild>
											<a href={cert.metadataUrl} target="_blank" rel="noreferrer">
												查看 metadata
											</a>
										</Button>
									) : (
										<Button variant="outline" disabled>
											查看 metadata
										</Button>
									)}
								</CardFooter>
							</Card>
						);
					})}
				</div>
			)}

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
