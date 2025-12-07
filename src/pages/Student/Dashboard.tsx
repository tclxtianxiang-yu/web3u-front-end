import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { BookOpen, Clock, Award, TrendingUp, Loader2 } from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { GET_LEARNING_RECORDS, GET_TRANSACTIONS, GET_COURSE } from "../../lib/queries";
import { graphQLClient } from "../../lib/graphql";
import { CONTRACTS } from "../../contracts/addresses";
import { YDToken_ABI, StudentCertificate_ABI } from "../../contracts/abis";
import { formatUnits } from "viem";

const StudentDashboard = () => {
	const { address: userAddress, isConnected } = useAccount();

    // 1. 获取 YD Token 余额
    const { data: ydTokenBalance, isLoading: isYdBalanceLoading } = useReadContract({
        address: CONTRACTS.YDToken.address as `0x${string}`,
        abi: YDToken_ABI,
        functionName: 'balanceOf',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
            refetchInterval: 10000,
        },
    });
    const formattedYdBalance = ydTokenBalance ? parseFloat(formatUnits(ydTokenBalance as bigint, 18)).toFixed(2) : "0.00";

    // 2. 获取 NFT 证书数量
    const { data: nftCertificatesCount, isLoading: isNftCountLoading } = useReadContract({
        address: CONTRACTS.StudentCertificate.address as `0x${string}`,
        abi: StudentCertificate_ABI,
        functionName: 'balanceOf',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress,
            refetchInterval: 10000,
        },
    });
    const formattedNftCertificatesCount = nftCertificatesCount ? Number(nftCertificatesCount) : 0;

    // 3. 获取学习记录
    const { data: recordsData, isLoading: isRecordsLoading } = useQuery({
        queryKey: ["learningRecords", userAddress],
        queryFn: async () => {
            if (!userAddress) return null;
            return await graphQLClient.request(GET_LEARNING_RECORDS, { userWalletAddress: userAddress });
        },
        enabled: !!userAddress,
    });
    const learningRecords = (recordsData as any)?.learningRecords || [];

    // 4. 获取交易记录 (用于统计已报名课程，或确认购买状态)
    const { data: transactionsData, isLoading: isTransactionsLoading } = useQuery({
        queryKey: ["transactions", userAddress],
        queryFn: async () => {
            if (!userAddress) return null;
            return await graphQLClient.request(GET_TRANSACTIONS, { walletAddress: userAddress });
        },
        enabled: !!userAddress,
    });
    const transactions = (transactionsData as any)?.transactions || [];

    // 计算统计数据
    const enrolledCourses = new Set(learningRecords.map((r: any) => r.courseId)).size;

    const completedCoursesMap: { [courseId: string]: { totalLessons: number, completedLessons: number } } = {};
    learningRecords.forEach((record: any) => {
        if (!completedCoursesMap[record.courseId]) {
            // Placeholder for totalLessons, will fetch if needed for individual course
            completedCoursesMap[record.courseId] = { totalLessons: 0, completedLessons: 0 };
        }
        if (record.completed) {
            completedCoursesMap[record.courseId].completedLessons += 1;
        }
    });

    // 过滤出已完成的课程 (这里简化处理，认为只要有完成的学习记录就算已完成，实际需要所有课时都完成)
    const completedCoursesCount = Object.values(completedCoursesMap).filter(c => c.completedLessons > 0).length;

    // 获取“继续学习”的课程（最近学习且未完成的）
    const continueLearningCourses = learningRecords
        .filter((record: any) => !record.completed) // 筛选未完成的记录
        .sort((a: any, b: any) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()) // 按最近观看时间排序
        .reduce((acc: any, record: any) => {
            if (!acc.find((item: any) => item.courseId === record.courseId)) {
                acc.push({
                    courseId: record.courseId,
                    lessonId: record.lessonId, // 当前观看的课时
                    lastWatchedAt: record.lastWatchedAt,
                    progressPercentage: record.progressPercentage,
                });
            }
            return acc;
        }, [])
        .slice(0, 1); // 只显示最近一个

    // 为“继续学习”的课程获取总课时数 (N+1 查询)
    const { data: continueCourseData, isLoading: isContinueCourseLoading } = useQuery({
        queryKey: ["continueCourseDetails", continueLearningCourses[0]?.courseId],
        queryFn: async () => {
            if (!continueLearningCourses[0]?.courseId) return null;
            const res: any = await graphQLClient.request(GET_COURSE, { id: continueLearningCourses[0].courseId });
            return res.course;
        },
        enabled: !!continueLearningCourses[0]?.courseId,
    });
    const continueCourse = continueCourseData;
    const totalLessonsInContinueCourse = continueCourse?.lessons?.length || 0;
    const currentLessonNumber = continueLearningCourses[0]?.lessonId ? (continueCourse?.lessons?.findIndex((l: any) => l.id === continueLearningCourses[0].lessonId) + 1) : 0;


    const isLoading = isYdBalanceLoading || isNftCountLoading || isRecordsLoading || isTransactionsLoading || isContinueCourseLoading;

    if (!isConnected) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                <p>请连接钱包以查看您的学生仪表盘。</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2 text-muted-foreground">加载仪表盘数据...</p>
            </div>
        );
    }


	return (
		<div className="py-8 max-w-6xl mx-auto space-y-8">
			<h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
						<BookOpen className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{enrolledCourses}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Completed</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{completedCoursesCount}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">YD Balance</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formattedYdBalance} YD</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Certificates</CardTitle>
						<Award className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formattedNftCertificatesCount}</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<Link to="/courses" className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
							<div className="bg-primary/10 p-2 rounded-full mr-4">
								<BookOpen className="h-6 w-6 text-primary" />
							</div>
							<div>
								<h3 className="font-semibold">Browse Courses</h3>
								<p className="text-sm text-muted-foreground">Discover new Web3 skills</p>
							</div>
						</Link>
						<Link to="/student/courses" className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
							<div className="bg-primary/10 p-2 rounded-full mr-4">
								<Clock className="h-6 w-6 text-primary" />
							</div>
							<div>
								<h3 className="font-semibold">My Courses</h3>
								<p className="text-sm text-muted-foreground">Resume your in-progress courses</p>
							</div>
						</Link>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Continue Learning</CardTitle>
					</CardHeader>
					<CardContent>
                        {continueLearningCourses.length > 0 && continueCourse ? (
                            <div className="space-y-6">
                                <Link to={`/courses/${continueLearningCourses[0].courseId}/watch`} className="block">
                                    <div className="space-y-2 hover:bg-muted/50 p-4 rounded-lg transition-colors">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">{continueCourse.title}</span>
                                            <span className="text-muted-foreground">{continueLearningCourses[0].progressPercentage}%</span>
                                        </div>
                                        <Progress value={continueLearningCourses[0].progressPercentage} />
                                        <p className="text-xs text-muted-foreground">
                                            Lesson {currentLessonNumber} of {totalLessonsInContinueCourse}
                                        </p>
                                    </div>
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-4">
                                暂无进行中的课程。
                            </div>
                        )}
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default StudentDashboard;