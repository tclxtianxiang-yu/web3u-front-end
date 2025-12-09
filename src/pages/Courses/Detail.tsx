import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Award,
	BookOpen,
	Clock,
	Loader2,
	Lock,
	PlayCircle,
	Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../../components/ui/tabs";
import { Textarea } from "../../components/ui/textarea";
import { useToast } from "../../components/ui/use-toast";
import { useAuth } from "../../contexts/AuthContext";
import { CoursePlatform_ABI, CourseRegistry_ABI } from "../../contracts/abis";
import { CONTRACTS } from "../../contracts/addresses";
import { usePurchaseCourse } from "../../hooks";
import { graphQLClient } from "../../lib/graphql";
import { CREATE_REVIEW_MUTATION } from "../../lib/mutations";
import { GET_COURSE } from "../../lib/queries";

const CourseDetail = () => {
	const { id } = useParams();
	const { address: userAddress, isConnected } = useAccount();
	const { isAuthenticated, login } = useAuth();
	const purchaseCourse = usePurchaseCourse();
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const [localCourse, setLocalCourse] = useState<any>(null);
	const [reviewRating, setReviewRating] = useState(5);
	const [reviewComment, setReviewComment] = useState("");

	// Fetch course details from GraphQL
	const {
		data: gqlData,
		isLoading: isGqlLoading,
		error: gqlError,
	} = useQuery({
		queryKey: ["course", id],
		queryFn: async () => {
			if (!id) return null;
			return await graphQLClient.request(GET_COURSE, { id });
		},
		enabled: !!id,
	});

	// Fetch course details from contract (Registry)
	const {
		data: contractCourse,
		isError: isContractError,
		isLoading: isContractLoading,
	} = useReadContract({
		address: CONTRACTS.CourseRegistry.address as `0x${string}`,
		abi: CourseRegistry_ABI,
		functionName: "getCourse",
		args: [id || ""],
		query: {
			enabled: !!id,
		},
	});

	// Check if user has purchased the course (Platform)
	const { data: hasPurchased } = useReadContract({
		address: CONTRACTS.CoursePlatform.address as `0x${string}`,
		abi: CoursePlatform_ABI,
		functionName: "hasPurchased",
		args: userAddress && id ? [userAddress, id] : undefined,
		query: {
			enabled: !!userAddress && !!id,
		},
	});

	// Create Review Mutation
	const createReviewMutation = useMutation({
		mutationFn: async (input: {
			courseId: string;
			studentWalletAddress: string;
			rating: number;
			comment: string;
		}) => {
			return await graphQLClient.request(CREATE_REVIEW_MUTATION, { input });
		},
		onSuccess: () => {
			toast({
				title: "Success",
				description: "Review submitted successfully!",
			});
			setReviewComment("");
			setReviewRating(5);
			queryClient.invalidateQueries({ queryKey: ["course", id] }); // Refresh course data to show new review
		},
		onError: (error: any) => {
			console.error("Review submission failed:", error);
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to submit review.",
			});
		},
	});

	useEffect(() => {
		if (gqlData && (gqlData as any).course) {
			const gqlCourse = (gqlData as any).course;
			setLocalCourse({
				id: gqlCourse.id,
				title: gqlCourse.title,
				teacher: gqlCourse.teacherWalletAddress
					? `${gqlCourse.teacherWalletAddress.slice(0, 6)}...${gqlCourse.teacherWalletAddress.slice(-4)}`
					: "Unknown",
				price: contractCourse
					? parseFloat(formatUnits((contractCourse as any).priceYD, 18))
					: gqlCourse.priceYd,
				rating: gqlCourse.rating || 0,
				students: contractCourse
					? Number((contractCourse as any).totalPurchases)
					: 0,
				thumbnail: gqlCourse.thumbnailUrl || "🔷",
				description: gqlCourse.description || "No description available.",
				videoUrl: gqlCourse.videoUrl,
				category: gqlCourse.category || "General",
				reviews: gqlCourse.reviews || [],
			});
		} else if (contractCourse) {
			setLocalCourse({
				id: id,
				title: (contractCourse as any).courseId,
				teacher: (contractCourse as any).teacher,
				price: parseFloat(formatUnits((contractCourse as any).priceYD, 18)),
				rating: 0,
				students: Number((contractCourse as any).totalPurchases),
				thumbnail: "🔷",
				description: "Loading description...",
				videoUrl: null,
				category: "Unknown",
				reviews: [],
			});
		}
	}, [gqlData, contractCourse, id]);

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
				description:
					error.shortMessage || error.message || "购买课程时发生错误。",
			});
		}
	};

	const handleSubmitReview = async () => {
		if (!isAuthenticated) {
			try {
				await login();
			} catch (e) {
				return;
			}
		}
		if (!userAddress || !id) return;

		createReviewMutation.mutate({
			courseId: id,
			studentWalletAddress: userAddress,
			rating: reviewRating,
			comment: reviewComment,
		});
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
						<div className="aspect-video bg-gradient-to-br from-primary/80 to-primary rounded-lg flex items-center justify-center text-9xl shadow-lg overflow-hidden">
							{localCourse.thumbnail && localCourse.thumbnail !== "🔷" ? (
								<img
									src={localCourse.thumbnail}
									alt={localCourse.title}
									className="w-full h-full object-cover"
								/>
							) : (
								"🔷"
							)}
						</div>
						<div>
							<h1 className="text-4xl font-bold tracking-tight mb-2">
								{localCourse.title}
							</h1>
							<p className="text-lg text-muted-foreground mb-4">
								{localCourse.description}
							</p>
							<div className="flex items-center gap-4 text-sm text-muted-foreground">
								<div className="flex items-center gap-1">
									<Avatar className="h-6 w-6">
										<AvatarFallback>JD</AvatarFallback>
									</Avatar>
									<span>{localCourse.teacher}</span>
								</div>
								<Separator orientation="vertical" className="h-4" />
								<div className="flex items-center gap-1">
									<span className="text-yellow-500">⭐</span>{" "}
									{localCourse.rating.toFixed(1)} (
									{localCourse.reviews?.length || 0} reviews)
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
									<CardDescription>
										单视频课程 · 购买后即可观看完整内容
									</CardDescription>
								</CardHeader>
								<CardContent>
									{localCourse.videoUrl ? (
										<div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
											<div className="flex-shrink-0">
												<div className="w-32 h-20 bg-black rounded overflow-hidden flex items-center justify-center">
													{localCourse.thumbnail && localCourse.thumbnail !== "🔷" ? (
														<img
															src={localCourse.thumbnail}
															alt={localCourse.title}
															className="w-full h-full object-cover"
														/>
													) : (
														<PlayCircle className="h-8 w-8 text-white opacity-80" />
													)}
												</div>
											</div>
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-1">
													<PlayCircle className="h-4 w-4 text-primary" />
													<h4 className="font-semibold">主课程视频</h4>
												</div>
												<p className="text-sm text-muted-foreground">
													完整课程内容 · 购买后即可观看
												</p>
											</div>
										</div>
									) : (
										<p className="text-sm text-muted-foreground p-3">
											视频内容正在准备中...
										</p>
									)}
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value="reviews" className="mt-6">
							<Card>
								<CardHeader>
									<CardTitle>Student Reviews</CardTitle>
									<CardDescription>
										{localCourse.reviews?.length === 0
											? "No reviews yet. Be the first to review!"
											: `See what students say about this course.`}
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									{hasPurchased && (
										<div className="bg-muted/30 p-4 rounded-lg space-y-4 mb-6">
											<h4 className="font-semibold">Write a Review</h4>
											<div className="space-y-2">
												<div className="flex items-center gap-2">
													<span className="text-sm text-muted-foreground">
														Rating:
													</span>
													<div className="flex gap-1">
														{[1, 2, 3, 4, 5].map((star) => (
															<Star
																key={star}
																className={`h-5 w-5 cursor-pointer ${star <= reviewRating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
																onClick={() => setReviewRating(star)}
															/>
														))}
													</div>
												</div>
												<Textarea
													placeholder="Share your experience with this course..."
													value={reviewComment}
													onChange={(e) => setReviewComment(e.target.value)}
												/>
												<div className="flex justify-end">
													<Button
														onClick={handleSubmitReview}
														disabled={createReviewMutation.isPending}
													>
														{createReviewMutation.isPending ? (
															<Loader2 className="h-4 w-4 animate-spin mr-2" />
														) : null}
														Submit Review
													</Button>
												</div>
											</div>
										</div>
									)}

									{localCourse.reviews?.map((review: any) => (
										<div key={review.id} className="space-y-2">
											<div className="flex justify-between items-start">
												<div className="flex items-center gap-2">
													<Avatar className="h-8 w-8">
														<AvatarFallback>
															{review.student?.username?.[0] || "S"}
														</AvatarFallback>
													</Avatar>
													<span className="font-semibold">
														{review.student?.username ||
															`${review.studentWalletAddress.slice(0, 6)}...`}
													</span>
												</div>
												<span className="text-xs text-muted-foreground">
													{new Date(
														Number(review.createdAt),
													).toLocaleDateString()}
												</span>
											</div>
											<div className="flex text-yellow-500 text-xs mb-1">
												{"⭐".repeat(review.rating)}
											</div>
											<p className="text-sm text-muted-foreground">
												{review.comment}
											</p>
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
							<CardTitle className="text-3xl font-bold text-primary">
								{localCourse.price} YD
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{hasPurchased ? (
								<Button
									className="w-full bg-green-600 hover:bg-green-700"
									size="lg"
									asChild
								>
									<Link to={`/courses/${localCourse.id}/watch`}>
										Go to Course
									</Link>
								</Button>
							) : (
								<Button
									className="w-full"
									size="lg"
									onClick={handlePurchase}
									disabled={isContractLoading}
								>
									{isContractLoading ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										"购买课程"
									)}
								</Button>
							)}
							<Button variant="outline" className="w-full">
								Add to Wishlist
							</Button>

							<div className="space-y-2 pt-4">
								<h4 className="font-semibold text-sm">This course includes:</h4>
								<ul className="space-y-2 text-sm text-muted-foreground">
									<li className="flex items-center gap-2">
										<PlayCircle className="h-4 w-4" /> {localCourse.lessons}{" "}
										video lessons
									</li>
									<li className="flex items-center gap-2">
										<Clock className="h-4 w-4" /> Lifetime access
									</li>
									<li className="flex items-center gap-2">
										<Award className="h-4 w-4" /> NFT Certificate
									</li>
									<li className="flex items-center gap-2">
										<BookOpen className="h-4 w-4" /> Access on mobile
									</li>
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
