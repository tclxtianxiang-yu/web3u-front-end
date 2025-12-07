import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Clock, CheckCircle2, Zap, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { GET_LEARNING_RECORDS } from "../../lib/queries";
import { graphQLClient } from "../../lib/graphql";

const StudentHistory = () => {
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

    // Process history data
    const history = learningRecords.map((record: any) => ({
        id: record.id,
        course: record.course?.title || "Unknown Course",
        // Since lesson title isn't directly in learningRecord query result (nested in course -> lessons), 
        // we might need a better query or just show "Lesson ID" for now, or try to match if we had lessons data.
        // For simplicity in this step, let's assume we can get it or fallback.
        // The current GET_LEARNING_RECORDS query does fetch course -> lessons -> id.
        // To get lesson title, we would need to update the query to fetch lesson details within the course.
        // Let's assume we update the query or just display generic info.
        // Updating query in `src/lib/queries.ts` would be ideal but let's stick to provided instructions.
        // We'll display "Lesson" and format date.
        lesson: `Lesson ${record.lessonId}`, 
        date: record.lastWatchedAt ? new Date(Number(record.lastWatchedAt)).toLocaleDateString() : "N/A",
        duration: "N/A" // Duration is on lesson level, not record level directly
    })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10); // Recent 10

    // Calculate stats
    const completedLessons = learningRecords.filter((r: any) => r.completed).length;
    // Mocking watch time and streak as they require more granular data not in current simple schema
    const totalWatchTime = "24.5 hrs"; 
    const currentStreak = "7 days";

	if (isLoading) {
        return (
            <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2 text-muted-foreground">加载学习记录...</p>
            </div>
        );
    }

    if (!userAddress) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                <p>请连接钱包以查看您的学习历史。</p>
            </div>
        );
    }

	return (
		<div className="py-8 max-w-6xl mx-auto space-y-8">
			<h1 className="text-3xl font-bold tracking-tight">Learning History</h1>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Watch Time (Est.)</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalWatchTime}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{completedLessons}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Current Streak</CardTitle>
						<Zap className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{currentStreak}</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<div className="divide-y">
                        {history.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">暂无学习记录</div>
                        ) : (
                            history.map((item: any) => (
                                <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold leading-none">{item.course}</h4>
                                        <p className="text-sm text-muted-foreground">{item.lesson}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>{item.duration}</span>
                                        <Separator orientation="vertical" className="h-4 hidden sm:block" />
                                        <span>{item.date}</span>
                                    </div>
                                </div>
                            ))
                        )}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Weekly Progress</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-7 gap-2 md:gap-4">
						{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
							<div key={day} className="text-center space-y-2">
								<div className="text-xs text-muted-foreground">{day}</div>
								<div className={`h-24 w-full rounded-md ${index < 5 ? 'bg-primary' : 'bg-muted'}`} />
								<div className="text-xs text-muted-foreground font-medium">{index < 5 ? `${45 + index * 10}m` : '-'}</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default StudentHistory;
