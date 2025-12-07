import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Award, Trophy } from "lucide-react";

const TeacherNFT = () => {
	const nftBadges = [
		{ id: 1, title: "Top Rated Teacher", rarity: "Gold", rating: "4.9+", image: "🏆" },
		{ id: 2, title: "100 Students Milestone", rarity: "Silver", rating: "100+", image: "🎓" },
		{ id: 3, title: "Course Creator", rarity: "Bronze", rating: "5+", image: "📚" },
	];

	return (
		<div className="py-8 max-w-7xl mx-auto space-y-8">
			<h1 className="text-3xl font-bold tracking-tight">My NFT Badges</h1>

			<Card className="bg-muted/50 border-none">
				<CardContent className="pt-6">
					<div className="flex gap-4">
						<div className="bg-primary/10 p-2 rounded-full h-fit">
							<Trophy className="h-6 w-6 text-primary" />
						</div>
						<div className="space-y-1">
							<h3 className="font-semibold">About NFT Badges</h3>
							<p className="text-sm text-muted-foreground">
								Earn NFT badges based on your teaching performance, student ratings, and milestones.
								These badges are stored on the blockchain and represent your achievements as an educator.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{nftBadges.map((badge) => (
					<Card key={badge.id} className="overflow-hidden hover:shadow-lg transition-shadow">
						<div className="h-48 bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-6xl">
							{badge.image}
						</div>
						<CardHeader>
							<div className="flex justify-between items-start">
								<CardTitle className="text-xl">{badge.title}</CardTitle>
								<Badge variant={
									badge.rarity === 'Gold' ? 'default' :
									badge.rarity === 'Silver' ? 'secondary' : 'outline'
								}>
									{badge.rarity}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">Achievement: {badge.rating}</p>
							<Button variant="outline" className="w-full">
								View on Blockchain
							</Button>
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Upcoming Badges</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
						<Award className="h-8 w-8 text-muted-foreground/50" />
						<div className="flex-1 space-y-1">
							<h4 className="font-semibold">Master Teacher</h4>
							<p className="text-sm text-muted-foreground">Achieve 5.0 average rating with 50+ reviews</p>
						</div>
						<div className="text-right space-y-1">
							<p className="text-sm font-medium">Progress</p>
							<p className="text-xs text-muted-foreground">35/50 reviews</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default TeacherNFT;
