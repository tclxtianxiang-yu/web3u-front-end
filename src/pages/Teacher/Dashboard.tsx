import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { BookOpen, Users, DollarSign, Star, Upload, LayoutDashboard, BadgeCheck, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { GET_COURSES, GET_TRANSACTIONS } from "../../lib/queries";
import { graphQLClient } from "../../lib/graphql";

const TeacherDashboard = () => {
    const { address: teacherAddress } = useAccount();

    // Fetch Courses
    const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
        queryKey: ["teacherCourses", teacherAddress],
        queryFn: async () => {
            if (!teacherAddress) return null;
            return await graphQLClient.request(GET_COURSES, { teacherWalletAddress: teacherAddress });
        },
        enabled: !!teacherAddress,
    });

    // Fetch Transactions
    const { data: transactionsData, isLoading: isTransactionsLoading } = useQuery({
        queryKey: ["teacherTransactions", teacherAddress],
        queryFn: async () => {
            if (!teacherAddress) return null;
            return await graphQLClient.request(GET_TRANSACTIONS, { walletAddress: teacherAddress });
        },
        enabled: !!teacherAddress,
    });

    const courses = (coursesData as any)?.courses || [];
    const transactions = (transactionsData as any)?.transactions || [];

    // Calculate Statistics
    const totalCourses = courses.length;

    const totalStudents = new Set(
        transactions
            .filter((tx: any) => tx.transactionType === 'course_purchase' && tx.toWalletAddress.toLowerCase() === teacherAddress?.toLowerCase())
            .map((tx: any) => tx.fromWalletAddress)
    ).size;

    const totalEarnings = transactions
        .filter((tx: any) => tx.toWalletAddress.toLowerCase() === teacherAddress?.toLowerCase())
        .reduce((sum: number, tx: any) => sum + (tx.amountYd || 0), 0);

    const averageRating = courses.length > 0
        ? (courses.reduce((sum: number, course: any) => sum + (course.rating || 0), 0) / courses.length).toFixed(1)
        : "0.0";

    const isLoading = isCoursesLoading || isTransactionsLoading;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2 text-muted-foreground">加载仪表盘数据...</p>
            </div>
        );
    }

    if (!teacherAddress) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                <p>请连接钱包以查看教师仪表盘。</p>
            </div>
        );
    }

	return (
		<div className="py-8 max-w-6xl mx-auto space-y-8">
			<h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Courses</CardTitle>
						<BookOpen className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalCourses}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Students</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalStudents}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">YD Tokens Earned</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalEarnings.toFixed(2)}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Average Rating</CardTitle>
						<Star className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{averageRating}</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Link to="/teacher/courses">
					<Card className="hover:bg-muted/50 transition-colors h-full">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<LayoutDashboard className="h-5 w-5 text-primary" />
								My Courses
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">Manage your course content and settings</p>
						</CardContent>
					</Card>
				</Link>

				<Link to="/teacher/upload">
					<Card className="hover:bg-muted/50 transition-colors h-full">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Upload className="h-5 w-5 text-primary" />
								Upload Course
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">Create and upload new courses</p>
						</CardContent>
					</Card>
				</Link>

				<Link to="/teacher/earnings">
					<Card className="hover:bg-muted/50 transition-colors h-full">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<DollarSign className="h-5 w-5 text-primary" />
								Earnings
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">View earnings and withdraw funds</p>
						</CardContent>
					</Card>
				</Link>

				<Link to="/teacher/nft">
					<Card className="hover:bg-muted/50 transition-colors h-full">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BadgeCheck className="h-5 w-5 text-primary" />
								NFT Badges
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">View your earned NFT badges</p>
						</CardContent>
					</Card>
				</Link>
			</div>
		</div>
	);
};

export default TeacherDashboard;
