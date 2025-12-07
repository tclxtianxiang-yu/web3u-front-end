import {
	ArrowRight,
	Award,
	BookOpen,
	Coins,
	Upload,
	Wallet,
} from "lucide-react";
import { Link } from "react-router";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";

const Home = () => {
	return (
		<div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
			{/* Hero Section */}
			<section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
				<div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
					<h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
						Welcome to <span className="text-primary">Web3 University</span>
					</h1>
					<p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
						Decentralized Learning Platform with NFT Certificates. Earn while
						you learn, and own your achievements.
					</p>
					<div className="flex gap-4">
						<Button asChild size="lg">
							<Link to="/courses">
								Browse Courses <ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="container space-y-6 bg-muted/50 py-8 md:py-12 lg:py-24">
				<div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
					<h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
						Platform Features
					</h2>
					<p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
						Built for the future of education.
					</p>
				</div>
				<div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-2">
					<Card>
						<CardHeader>
							<div className="bg-primary/10 w-fit p-2 rounded-full mb-2">
								<BookOpen className="h-6 w-6 text-primary" />
							</div>
							<CardTitle>For Students</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="space-y-2 text-muted-foreground">
								<li className="flex items-center">
									✓ Access premium courses with YD tokens
								</li>
								<li className="flex items-center">
									✓ Earn NFT certificates upon completion
								</li>
								<li className="flex items-center">
									✓ Track your blockchain-verified progress
								</li>
							</ul>
							<Button asChild className="mt-4 w-full" variant="secondary">
								<Link to="/student">Student Dashboard</Link>
							</Button>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<div className="bg-primary/10 w-fit p-2 rounded-full mb-2">
								<Upload className="h-6 w-6 text-primary" />
							</div>
							<CardTitle>For Teachers</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="space-y-2 text-muted-foreground">
								<li className="flex items-center">✓ Monetize your knowledge</li>
								<li className="flex items-center">
									✓ Receive payments in YD tokens
								</li>
								<li className="flex items-center">
									✓ Automatic DeFi yield optimization
								</li>
							</ul>
							<Button asChild className="mt-4 w-full" variant="secondary">
								<Link to="/teacher">Teacher Dashboard</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* How it works */}
			<section className="container py-8 md:py-12 lg:py-24">
				<div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-10">
					<h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
						How It Works
					</h2>
				</div>
				<div className="mx-auto grid justify-center gap-8 sm:grid-cols-3 md:max-w-[64rem]">
					<div className="flex flex-col items-center text-center space-y-2">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
							<Wallet className="h-8 w-8" />
						</div>
						<h3 className="text-xl font-bold">Connect Wallet</h3>
						<p className="text-muted-foreground">
							Link your Web3 wallet to get started securely.
						</p>
					</div>
					<div className="flex flex-col items-center text-center space-y-2">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
							<Coins className="h-8 w-8" />
						</div>
						<h3 className="text-xl font-bold">Get YD Tokens</h3>
						<p className="text-muted-foreground">
							Purchase tokens to unlock premium content.
						</p>
					</div>
					<div className="flex flex-col items-center text-center space-y-2">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
							<Award className="h-8 w-8" />
						</div>
						<h3 className="text-xl font-bold">Learn & Earn</h3>
						<p className="text-muted-foreground">
							Complete courses and mint your NFT certificates.
						</p>
					</div>
				</div>
			</section>
		</div>
	);
};

export default Home;
