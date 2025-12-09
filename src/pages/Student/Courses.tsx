import { Link } from "react-router";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { useAccount, useReadContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { GET_LEARNING_RECORDS, GET_COURSE } from "../../lib/queries";
import { graphQLClient } from "../../lib/graphql";
import { CONTRACTS } from "../../contracts/addresses";
import { CoursePlatform_ABI } from "../../contracts/abis";
import { Loader2 } from "lucide-react";

const StudentCourses = () => {
    const { address: userAddress } = useAccount();

    // 1. 从合约读取购买记录
    const { data: purchaseRecords, isLoading: isPurchasesLoading } = useReadContract({
        address: CONTRACTS.CoursePlatform.address as `0x${string}`,
        abi: CoursePlatform_ABI,
        functionName: 'getStudentPurchases',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
        },
    });

    // 提取课程 ID 列表
    const purchasedCourseIds = ((purchaseRecords as any) || []).map((record: any) => record.courseId);

    // 2. 获取学习记录（用于显示进度）
    const { data: recordsData, isLoading: isRecordsLoading } = useQuery({
        queryKey: ["learningRecords", userAddress],
        queryFn: async () => {
            if (!userAddress) return null;
            return await graphQLClient.request(GET_LEARNING_RECORDS, { userWalletAddress: userAddress });
        },
        enabled: !!userAddress,
    });

    const learningRecords = (recordsData as any)?.learningRecords || [];

    // 3. 为每个购买的课程获取详情和进度
    const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
        queryKey: ["purchasedCourses", purchasedCourseIds],
        queryFn: async () => {
            if (purchasedCourseIds.length === 0) return [];

            // 批量获取课程详情
            const coursesPromises = purchasedCourseIds.map(async (courseId: string) => {
                const res: any = await graphQLClient.request(GET_COURSE, { id: courseId });
                return res.course;
            });

            return await Promise.all(coursesPromises);
        },
        enabled: purchasedCourseIds.length > 0,
    });

    const courses = ((coursesData as any) || []).map((course: any) => {
        // 单视频课程: 只检查是否完成
        const courseRecord = learningRecords.find(
            (r: any) => r.courseId === course.id && r.completed
        );
        const progress = courseRecord ? 100 : 0;
        const status = progress === 100 ? "已完成" : "学习中";

        return {
            id: course.id,
            title: course.title,
            progress,
            status,
            thumbnail: course.thumbnailUrl || "🔷",
        };
    });

    const isLoading = isPurchasesLoading || isRecordsLoading || isCoursesLoading;

	if (isLoading) {
        return (
            <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2 text-muted-foreground">加载我的课程...</p>
            </div>
        );
    }

    if (!userAddress) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                <p>请连接钱包以查看您的课程。</p>
            </div>
        );
    }

	return (
		<div className="py-8 max-w-7xl mx-auto space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
				<Button asChild>
					<Link to="/courses">Browse More Courses</Link>
				</Button>
			</div>

            {courses.length === 0 ? (
                <div className="text-center py-16 border rounded-lg bg-muted/10">
                    <p className="text-muted-foreground mb-4">您还没有购买任何课程。</p>
                    <Button asChild>
                        <Link to="/courses">去选课</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course: any) => (
                        <Card key={course.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                            <div className="h-48 bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-6xl overflow-hidden">
                                {course.thumbnail && course.thumbnail !== "🔷" ? (
                                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                ) : (
                                    "🔷"
                                )}
                            </div>
                            <CardHeader>
                                <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>进度: {course.progress}%</span>
                                    <span className="font-medium">{course.status}</span>
                                </div>
                                <Progress value={course.progress} />
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <Link to={`/courses/${course.id}/watch`}>
                                        {course.progress > 0 ? "Continue Learning" : "Start Learning"}
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
		</div>
	);
};

export default StudentCourses;
