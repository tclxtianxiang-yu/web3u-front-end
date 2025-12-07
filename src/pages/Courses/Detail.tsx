import { Link, useParams } from "react-router";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Separator } from "../../components/ui/separator";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Award, BookOpen, Clock, Lock, PlayCircle, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { usePurchaseCourse } from "../../hooks";
import { useToast } from "../../components/ui/use-toast";
import { useReadContract } from "wagmi";
import { CONTRACTS } from "../../contracts/addresses";
import { CourseRegistry_ABI } from "../../contracts/abis";
import { formatUnits } from "viem";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { GET_COURSE } from "../../lib/queries";
import { graphQLClient } from "../../lib/graphql";


const CourseDetail = () => {
	const { id } = useParams();
	const { address: userAddress, isConnected } = useAccount();
	const purchaseCourse = usePurchaseCourse();
	const { toast } = useToast();
	const [localCourse, setLocalCourse] = useState<any>(null);

	// Fetch course details from GraphQL
	const { data: gqlData, isLoading: isGqlLoading, error: gqlError } = useQuery({
		queryKey: ["course", id],
		queryFn: async () => {
			if (!id) return null;
			return await graphQLClient.request(GET_COURSE, { id });
		},
		enabled: !!id,
	});

	// Fetch course details from contract
	const { data: contractCourse, isError: isContractError, isLoading: isContractLoading } = useReadContract({
		address: CONTRACTS.CourseRegistry.address as `0x${string}`,
		abi: CourseRegistry_ABI,
		functionName: 'getCourse',
		args: [id || ""],
		query: {
			enabled: !!id,
		}
	});

	useEffect(() => {
		if (gqlData && (gqlData as any).course) {
			const gqlCourse = (gqlData as any).course;
            const gqlLessons = (gqlData as any).courseLessons || [];
			// Merge GraphQL data with Contract data if available, otherwise use GraphQL data
			setLocalCourse({
				id: gqlCourse.id,
				title: gqlCourse.title,
				teacher: gqlCourse.teacherWalletAddress ? `${gqlCourse.teacherWalletAddress.slice(0, 6)}...${gqlCourse.teacherWalletAddress.slice(-4)}` : "Unknown",
				price: contractCourse ? parseFloat(formatUnits((contractCourse as any).priceYD, 18)) : gqlCourse.priceYd,
				rating: 4.9, // Mock for now, not in API
				students: contractCourse ? Number((contractCourse as any).totalPurchases) : 0,
				thumbnail: gqlCourse.thumbnailUrl || "🔷",
				description: gqlCourse.description || "No description available.",
				lessons: gqlLessons.length,
				duration: gqlLessons.reduce((acc: number, lesson: any) => acc + (lesson.duration || 0), 0) / 3600 || 0,
				category: gqlCourse.category || "General",
				rawLessons: gqlLessons,
                reviews: gqlCourse.reviews || []
			});
		} else if (contractCourse) {
             // Fallback to contract data only if GQL fails but contract succeeds (less detail)
            setLocalCourse({
                id: id,
                title: (contractCourse as any).courseId,
                teacher: (contractCourse as any).teacher,
                price: parseFloat(formatUnits((contractCourse as any).priceYD, 18)),
                rating: 0,
                students: Number((contractCourse as any).totalPurchases),
                thumbnail: "🔷",
                description: "Loading description...",
                lessons: 0,
                duration: 0,
                category: "Unknown",
				rawLessons: []
            });
        }
	}, [gqlData, contractCourse, id]);


	const reviews = [
		{ id: 1, user: "Alice Johnson", rating: 5, comment: "Excellent course! Very clear explanations.", date: "2025-11-20" },
		{ id: 2, user: "Bob Smith", rating: 4, comment: "Good content, but could use more examples.", date: "2025-11-18" },
	];

    const handlePurchase = async () => {
        if (!isConnected) {
            toast({
                variant: "destructive",
                title: "未连接钱包",
                description: "请先连接您的钱包以购买课程。",
            });
            return;
        }

        if (!localCourse || localCourse.price === undefined) {
            toast({
                variant: "destructive",
                title: "课程信息缺失",
                description: "无法获取课程价格，请稍后再试。",
            });
            return;
        }

        try {
            toast({
                title: "正在处理购买...",
                description: "请在钱包中确认交易。",
            });
            await purchaseCourse(localCourse.id);
            toast({
                variant: "success",
                title: "购买成功！",
                description: `您已成功购买 ${localCourse.title}。`,
            });
        } catch (error: any) {
            console.error("购买失败:", error);
            toast({
                variant: "destructive",
                title: "购买失败",
                description: error.shortMessage || error.message || "购买课程时发生错误。",
            });
        }
    };

	if (isGqlLoading || (!localCourse && isContractLoading)) {
        return (
            <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2 text-muted-foreground">加载课程信息...</p>
            </div>
        );
    }

	if (!localCourse && (gqlError || isContractError)) {
		return (
			<div className="py-16 text-center text-destructive">
				<p>Failed to load course details. Please try again later.</p>
			</div>
		);
	}

	if (!localCourse) return null;

	return (
		<div className="py-8 max-w-7xl mx-auto space-y-8">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 space-y-8">
					<div className="space-y-4">
						<div className="aspect-video bg-gradient-to-br from-primary/80 to-primary rounded-lg flex items-center justify-center text-9xl shadow-lg">
							{localCourse.thumbnail}
						</div>
						<div>
							<h1 className="text-4xl font-bold tracking-tight mb-2">{localCourse.title}</h1>
							<p className="text-lg text-muted-foreground mb-4">{localCourse.description}</p>
							<div className="flex items-center gap-4 text-sm text-muted-foreground">
								<div className="flex items-center gap-1">
									<Avatar className="h-6 w-6">
										<AvatarFallback>JD</AvatarFallback>
									</Avatar>
									<span>{localCourse.teacher}</span>
								</div>
								<Separator orientation="vertical" className="h-4" />
								                                <div className="flex items-center gap-1">
								                                    <span className="text-yellow-500">⭐</span> {localCourse.rating.toFixed(1)} ({localCourse.reviews.length} reviews)
								                                </div>
								                            </div>
								                        </div>
								                    </div>
					<Tabs defaultValue="curriculum" className="w-full">
						<TabsList>
							<TabsTrigger value="curriculum">Curriculum</TabsTrigger>
							<TabsTrigger value="reviews">Reviews</TabsTrigger>
						</TabsList>
						<TabsContent value="curriculum" className="mt-6">
							<Card>
								<CardHeader>
									<CardTitle>Course Content</CardTitle>
									<CardDescription>{localCourse.lessons} lessons • {localCourse.duration ? localCourse.duration.toFixed(1) : 0} hours total length</CardDescription>
								</CardHeader>
								<CardContent className="space-y-1">
									{localCourse.rawLessons?.map((lesson: any, index: number) => (
										<div key={lesson.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md transition-colors">
											<div className="flex items-center gap-3">
												<div className="text-muted-foreground font-mono text-sm w-6">{index + 1}</div>
												<div className="flex items-center gap-2">
													{!lesson.isFree ? <Lock className="h-4 w-4 text-muted-foreground" /> : <PlayCircle className="h-4 w-4 text-primary" />}
													<span className={!lesson.isFree ? "text-muted-foreground" : "font-medium"}>{lesson.title}</span>
												</div>
											</div>
											<span className="text-sm text-muted-foreground">{Math.floor(lesson.duration / 60)} min</span>
										</div>
									))}
									{localCourse.rawLessons?.length === 0 && (
										<p className="text-sm text-muted-foreground p-3">No lessons available yet.</p>
									)}
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value="reviews" className="mt-6">
							<Card>
								<CardHeader>
									<CardTitle>Student Reviews</CardTitle>
								</CardHeader>
								<CardContent className="space-y-6">
									{reviews.map((review) => (
										<div key={review.id} className="space-y-2">
											<div className="flex justify-between items-start">
												<div className="flex items-center gap-2">
													<Avatar className="h-8 w-8">
														<AvatarFallback>{review.user[0]}</AvatarFallback>
													</Avatar>
													<span className="font-semibold">{review.user}</span>
												</div>
												<span className="text-xs text-muted-foreground">{review.date}</span>
											</div>
											<div className="flex text-yellow-500 text-xs mb-1">
												{"⭐".repeat(review.rating)}
											</div>
											<p className="text-sm text-muted-foreground">{review.comment}</p>
											<Separator className="mt-4" />
										</div>
									))}
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>

				<div className="lg:col-span-1">
					<Card className="sticky top-20">
						<CardHeader>
							<CardTitle className="text-3xl font-bold text-primary">{localCourse.price} YD</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<Button className="w-full" size="lg" onClick={handlePurchase}>
                                {isContractLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "购买课程"}
                            </Button>
							<Button variant="outline" className="w-full">Add to Wishlist</Button>
							
							<div className="space-y-2 pt-4">
								<h4 className="font-semibold text-sm">This course includes:</h4>
								<ul className="space-y-2 text-sm text-muted-foreground">
									<li className="flex items-center gap-2"><PlayCircle className="h-4 w-4" /> {localCourse.lessons} video lessons</li>
									<li className="flex items-center gap-2"><Clock className="h-4 w-4" /> Lifetime access</li>
									<li className="flex items-center gap-2"><Award className="h-4 w-4" /> NFT Certificate</li>
									<li className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Access on mobile</li>
								</ul>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default CourseDetail;
