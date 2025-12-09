import { Link, useParams } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GET_COURSE, GET_LEARNING_RECORDS } from "../../lib/queries";
import { MARK_LESSON_COMPLETE } from "../../lib/mutations";
import { graphQLClient } from "../../lib/graphql";
import { useAccount } from "wagmi";
import { Loader2, CheckCircle2, PlayCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Textarea } from "../../components/ui/textarea";
import { Separator } from "../../components/ui/separator";

const CoursePlayer = () => {
	const { id } = useParams();
    const { address: userAddress } = useAccount();

    // Fetch course details
    const { data: courseData, isLoading: isCourseLoading } = useQuery({
        queryKey: ["course", id],
        queryFn: async () => {
            if (!id) return null;
            return await graphQLClient.request(GET_COURSE, { id });
        },
        enabled: !!id,
    });

    // Fetch learning records for progress
    const { data: recordsData, isLoading: isRecordsLoading, refetch } = useQuery({
        queryKey: ["learningRecords", userAddress, id],
        queryFn: async () => {
            if (!userAddress || !id) return null;
            return await graphQLClient.request(GET_LEARNING_RECORDS, {
                userWalletAddress: userAddress,
                courseId: id
            });
        },
        enabled: !!userAddress && !!id,
    });

    const course = (courseData as any)?.course;
    const learningRecords = (recordsData as any)?.learningRecords || [];

    // Single video model: progress is either 0% or 100%
    const courseRecord = learningRecords.find(
        (r: any) => r.courseId === id && r.completed
    );
    const progressPercentage = courseRecord ? 100 : 0;
    const isCompleted = !!courseRecord;

    // Video availability check
    const isVideoAvailable = !!course?.videoUrl;

    // Mark lesson complete mutation
    const { mutate: markLessonComplete, isPending: isMarkingComplete } = useMutation({
        mutationFn: async () => {
            return await graphQLClient.request(MARK_LESSON_COMPLETE, {
                createLearningRecordInput: {
                    courseId: id!,
                    lessonId: null, // NULL for single-video courses (no lessons table entry)
                    userWalletAddress: userAddress!,
                    completed: true,
                },
            });
        },
        onSuccess: () => {
            refetch();
        },
    });

    const handleMarkComplete = () => {
        if (!userAddress) {
            alert("请先连接钱包");
            return;
        }
        markLessonComplete();
    };

	if (isCourseLoading || isRecordsLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">加载课程内容...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-background text-destructive">
                未找到课程信息
            </div>
        );
    }

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<div className="container mx-auto flex-1 p-0 lg:p-4">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-2rem)]">
					{/* Video Player Section */}
					<div className="lg:col-span-3 flex flex-col gap-4">
						<div className="flex items-center justify-between p-2">
							<Link to="/student/courses" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
								← 返回我的课程
							</Link>
                            <h1 className="text-lg font-bold truncate px-4 hidden lg:block">{course.title}</h1>
						</div>

						{/* Video Player */}
						<div className="aspect-video bg-black rounded-lg flex items-center justify-center relative overflow-hidden shadow-lg border border-border">
                            {isVideoAvailable ? (
                                <video
                                    src={course.videoUrl}
                                    controls
                                    className="w-full h-full"
                                    poster={course.thumbnailUrl}
                                >
                                    <track kind="captions" />
                                </video>
                            ) : (
                                <div className="text-center text-white p-8">
                                    <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-80" />
                                    <p className="text-xl font-semibold">视频加载中...</p>
                                    <p className="text-sm text-gray-400 mt-2">请稍候</p>
                                </div>
                            )}
						</div>

						{/* Video Controls & Info */}
						<Card>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold mb-1">{course.title}</h2>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>单视频课程</span>
                                            {isCompleted && (
                                                <>
                                                    <span>•</span>
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span>已完成</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {!isCompleted && (
                                        <Button
                                            className="w-full md:w-auto"
                                            onClick={handleMarkComplete}
                                            disabled={isMarkingComplete || !userAddress}
                                        >
                                            {isMarkingComplete ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    标记中...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    标记为完成
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>

                                <Separator className="my-6" />

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">课程描述</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {course.description || "暂无课程描述"}
                                    </p>
                                </div>

                                <Separator className="my-6" />

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">课程笔记</h3>
                                    <Textarea
                                        placeholder="在此处记录您的学习笔记..."
                                        className="min-h-[150px] resize-none"
                                    />
                                    <div className="flex justify-end">
                                        <Button size="sm" variant="outline" disabled>保存笔记（开发中）</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
					</div>

					{/* Course Info Sidebar */}
					<Card className="lg:col-span-1 flex flex-col h-full overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">课程信息</CardTitle>
                            <div className="space-y-2 mt-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>学习进度</span>
                                    <span>{progressPercentage}%</span>
                                </div>
                                <Progress value={progressPercentage} className="h-2" />
                            </div>
                        </CardHeader>
						<CardContent className="flex-1 overflow-y-auto space-y-4 pt-4">
							<div className="space-y-3">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">类别</span>
									<span className="font-medium">{course.category || "未分类"}</span>
								</div>
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">讲师</span>
									<span className="font-mono text-xs">
										{course.teacherWalletAddress?.slice(0, 6)}...{course.teacherWalletAddress?.slice(-4)}
									</span>
								</div>
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">评分</span>
									<span className="font-medium">
										⭐ {course.rating ? course.rating.toFixed(1) : "暂无"}
									</span>
								</div>
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">评价数</span>
									<span className="font-medium">{course.reviewCount || 0} 条</span>
								</div>
								<Separator />
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">状态</span>
									<span className="font-medium">
										{isCompleted ? (
											<span className="text-green-600">已完成</span>
										) : (
											<span className="text-blue-600">学习中</span>
										)}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default CoursePlayer;
