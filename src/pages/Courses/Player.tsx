import { Link, useParams } from "react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { GET_COURSE, GET_LEARNING_RECORDS } from "../../lib/queries";
import { graphQLClient } from "../../lib/graphql";
import { useAccount } from "wagmi";
import { Loader2, CheckCircle, Circle, PlayCircle, Lock } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Textarea } from "../../components/ui/textarea";

const CoursePlayer = () => {
	const { id } = useParams();
    const { address: userAddress } = useAccount();
	const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

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
    const { data: recordsData, isLoading: isRecordsLoading } = useQuery({
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
    const lessons = course?.lessons || [];
    const currentLesson = lessons[currentLessonIndex];
    const learningRecords = (recordsData as any)?.learningRecords || [];

    // Calculate progress based on learning records
    const completedLessonsCount = learningRecords.filter((r: any) => r.completed && r.courseId === id).length;
    const progressPercentage = lessons.length > 0 ? Math.round((completedLessonsCount / lessons.length) * 100) : 0;

    const isLessonCompleted = (lessonId: string) => {
        return learningRecords.some((r: any) => r.lessonId === lessonId && r.completed);
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

						{/* Video Player Placeholder */}
						<div className="aspect-video bg-black rounded-lg flex items-center justify-center relative overflow-hidden shadow-lg border border-border">
                            {currentLesson ? (
                                <div className="text-center text-white p-8">
                                    <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-80" />
                                    <p className="text-xl font-semibold">{currentLesson.title}</p>
                                    <p className="text-sm text-gray-400 mt-2">视频资源未连接 (Demo)</p>
                                </div>
                            ) : (
                                <div className="text-white">选择一个课程开始学习</div>
                            )}
						</div>

						{/* Video Controls & Info */}
						<Card>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-1">{currentLesson?.title}</h2>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>第 {currentLessonIndex + 1} / {lessons.length} 节</span>
                                            {currentLesson?.durationSeconds && (
                                                <span>• {Math.floor(currentLesson.durationSeconds / 60)} 分钟</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto">
                                        <Button 
                                            variant="outline" 
                                            disabled={currentLessonIndex === 0}
                                            onClick={() => setCurrentLessonIndex(prev => Math.max(0, prev - 1))}
                                            className="flex-1 md:flex-none"
                                        >
                                            上一节
                                        </Button>
                                        <Button 
                                            className="flex-1 md:flex-none"
                                            onClick={() => {/* Trigger complete lesson mutation */}}
                                        >
                                            {isLessonCompleted(currentLesson?.id) ? "已完成" : "标记为完成"}
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            disabled={currentLessonIndex === lessons.length - 1}
                                            onClick={() => setCurrentLessonIndex(prev => Math.min(lessons.length - 1, prev + 1))}
                                            className="flex-1 md:flex-none"
                                        >
                                            下一节
                                        </Button>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">课程笔记</h3>
                                    <Textarea 
                                        placeholder="在此处记录您的学习笔记..." 
                                        className="min-h-[150px] resize-none"
                                    />
                                    <div className="flex justify-end">
                                        <Button size="sm">保存笔记</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
					</div>

					{/* Curriculum Sidebar */}
					<Card className="lg:col-span-1 flex flex-col h-full overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">课程目录</CardTitle>
                            <div className="space-y-2 mt-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>学习进度</span>
                                    <span>{progressPercentage}%</span>
                                </div>
                                <Progress value={progressPercentage} className="h-2" />
                            </div>
                        </CardHeader>
						<div className="flex-1 overflow-y-auto p-2 space-y-1">
							{lessons.map((lesson: any, index: number) => {
                                const isActive = currentLessonIndex === index;
                                const isCompleted = isLessonCompleted(lesson.id);
                                return (
                                    <Button
                                        key={lesson.id}
                                        variant={isActive ? "secondary" : "ghost"}
                                        className={`w-full justify-start h-auto py-3 px-3 ${isActive ? "bg-secondary font-medium" : ""}`}
                                        onClick={() => setCurrentLessonIndex(index)}
                                    >
                                        <div className="flex items-start gap-3 w-full text-left">
                                            <div className="mt-0.5">
                                                {isCompleted ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Circle className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground/50"}`} />
                                                )}
                                            </div>
                                            <div className="flex-1 truncate">
                                                <div className={`text-sm truncate ${isCompleted ? "text-muted-foreground" : ""}`}>
                                                    {lesson.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {Math.floor(lesson.durationSeconds / 60)} min
                                                </div>
                                            </div>
                                            {!lesson.isFree && !isCompleted && (
                                                <Lock className="h-3 w-3 text-muted-foreground/50 mt-1" />
                                            )}
                                        </div>
                                    </Button>
                                );
                            })}
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
};

import { Separator } from "../../components/ui/separator"; // Import Separator if not already

export default CoursePlayer;
