import { Link } from "react-router";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Badge, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { GET_COURSES } from "../../lib/queries";
import { graphQLClient } from "../../lib/graphql";

const CourseCatalog = () => {
	const { data, isLoading, error } = useQuery({
		queryKey: ["courses", "published"],
		queryFn: async () => {
			return await graphQLClient.request(GET_COURSES, { status: "published" });
		},
	});

	const courses = (data as any)?.courses || [];

	if (isLoading) {
		return (
			<div className="flex justify-center items-center py-16">
				<Loader2 className="h-8 w-8 animate-spin" />
				<p className="ml-2 text-muted-foreground">Loading courses...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="py-8 text-center text-destructive">
				<p>Failed to load courses. Please try again later.</p>
			</div>
		);
	}

	return (
		<div className="py-8 max-w-7xl mx-auto space-y-8">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Course Catalog</h1>
					<p className="text-muted-foreground">Explore our wide range of Web3 courses.</p>
				</div>
				<div className="flex gap-2 w-full md:w-auto">
					<Input placeholder="Search courses..." className="md:w-[300px]" />
					<Select>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Category" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Categories</SelectItem>
							<SelectItem value="solidity">Solidity</SelectItem>
							<SelectItem value="defi">DeFi</SelectItem>
							<SelectItem value="security">Security</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{courses.map((course: any) => (
					<Card key={course.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
						<div className="h-48 bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-6xl">
							{course.thumbnailUrl || "🔷"}
						</div>
						<CardHeader>
							<div className="flex justify-between items-start">
								<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
									{course.category || "General"}
								</span>
								<div className="flex items-center gap-1 text-yellow-500 text-sm font-medium">
									⭐ 4.9
								</div>
							</div>
							<CardTitle className="line-clamp-1 mt-2">{course.title}</CardTitle>
							<p className="text-sm text-muted-foreground">by {course.teacherWalletAddress?.slice(0, 6)}...{course.teacherWalletAddress?.slice(-4)}</p>
						</CardHeader>
						<CardContent className="flex-1">
							<div className="flex justify-between items-end">
								<div className="text-sm text-muted-foreground"></div>
								<div className="text-lg font-bold text-primary">{course.priceYd} YD</div>
							</div>
						</CardContent>
						<CardFooter>
							<Button asChild className="w-full">
								<Link to={`/courses/${course.id}`}>View Course</Link>
							</Button>
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	);
};

export default CourseCatalog;