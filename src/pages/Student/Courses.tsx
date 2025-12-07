import { Link } from "react-router";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { GET_LEARNING_RECORDS } from "../../lib/queries";
import { graphQLClient } from "../../lib/graphql";
import { Loader2 } from "lucide-react";

const StudentCourses = () => {
    const { address: userAddress } = useAccount();

    const { data: recordsData, isLoading, error } = useQuery({
        queryKey: ["learningRecords", userAddress],
        queryFn: async () => {
            if (!userAddress) return null;
            return await graphQLClient.request(GET_LEARNING_RECORDS, { userWalletAddress: userAddress });
        },
        enabled: !!userAddress,
    });

    const learningRecords = (recordsData as any)?.learningRecords || [];

    // Group records by course to calculate progress per course
    const coursesProgress = learningRecords.reduce((acc: any, record: any) => {
        if (!acc[record.courseId]) {
            acc[record.courseId] = {
                course: record.course,
                totalLessons: record.course.lessons?.length || 0,
                completedLessons: 0,
            };
        }
        if (record.completed) {
            acc[record.courseId].completedLessons += 1;
        }
        return acc;
    }, {});

    const courses = Object.entries(coursesProgress).map(([courseId, data]: [string, any]) => ({
        id: courseId,
        title: data.course.title,
        progress: data.totalLessons > 0 ? Math.round((data.completedLessons / data.totalLessons) * 100) : 0,
        totalLessons: data.totalLessons,
        completedLessons: data.completedLessons,
        thumbnail: data.course.thumbnailUrl || "🔷",
    }));

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

    if (error) {
        return (
            <div className="py-8 text-center text-destructive">
                <p>加载课程失败，请稍后重试。</p>
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
                    <p className="text-muted-foreground mb-4">您还没有开始任何课程。</p>
                    <Button asChild>
                        <Link to="/courses">去选课</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course: any) => (
                        <Card key={course.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                            <div className="h-48 bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-6xl">
                                {course.thumbnail}
                            </div>
                            <CardHeader>
                                <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Progress: {course.progress}%</span>
                                    <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                                </div>
                                <Progress value={course.progress} />
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <Link to={`/courses/${course.id}/watch`}>Continue Learning</Link>
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
