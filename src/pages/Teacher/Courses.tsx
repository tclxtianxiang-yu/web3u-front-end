import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Edit, BarChart2, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { GET_COURSES } from "../../lib/queries";
import { graphQLClient } from "../../lib/graphql";
import { formatUnits } from "viem";
import { useState } from "react";
import EditCourseDialog from "../../components/EditCourseDialog";

const TeacherCourses = () => {
    const { address: teacherAddress } = useAccount();
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const { data: coursesData, isLoading, error } = useQuery({
        queryKey: ["teacherCourses", teacherAddress],
        queryFn: async () => {
            if (!teacherAddress) return null;
            return await graphQLClient.request(GET_COURSES, { teacherWalletAddress: teacherAddress });
        },
        enabled: !!teacherAddress,
    });

    const courses = (coursesData as any)?.courses || [];

    const handleEditClick = (course: any) => {
        setSelectedCourse(course);
        setIsEditDialogOpen(true);
    };

	if (isLoading) {
        return (
            <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2 text-muted-foreground">加载课程列表...</p>
            </div>
        );
    }

    if (!teacherAddress) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                <p>请连接钱包以管理您的课程。</p>
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
		<div className="py-8 max-w-6xl mx-auto space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
				<Button asChild>
					<Link to="/teacher/upload">Upload New Course</Link>
				</Button>
			</div>

            {courses.length === 0 ? (
                <div className="text-center py-16 border rounded-lg bg-muted/10">
                    <p className="text-muted-foreground mb-4">您还没有发布任何课程。</p>
                    <Button asChild>
                        <Link to="/teacher/upload">去发布</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {courses.map((course: any) => (
                        <Card key={course.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl">{course.title}</CardTitle>
                                        <div className="flex gap-4 text-sm text-muted-foreground items-center">
                                            <span>{course.priceYd} YD</span>
                                            <span>•</span>
                                            <span>{course.category || "General"}</span>
                                            <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                                                {course.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(course)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            <BarChart2 className="h-4 w-4 mr-2" />
                                            Analytics
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}

            {selectedCourse && (
                <EditCourseDialog 
                    isOpen={isEditDialogOpen} 
                    onClose={() => setIsEditDialogOpen(false)} 
                    course={selectedCourse} 
                />
            )}
		</div>
	);
};

export default TeacherCourses;
