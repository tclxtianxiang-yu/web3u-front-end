import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { DollarSign, TrendingUp, Wallet, ArrowRightLeft, Loader2 } from "lucide-react";
import { useAccount, useReadContract } from "wagmi"; // 引入 useReadContract
import { useQuery } from "@tanstack/react-query";
import { GET_TRANSACTIONS } from "../../lib/queries";
import { graphQLClient } from "../../lib/graphql";
import { CONTRACTS } from "../../contracts/addresses"; // 引入合约地址
import { YDToken_ABI } from "../../contracts/abis"; // 引入 YDToken ABI
import { formatUnits } from "viem"; // 引入 formatUnits

const TeacherEarnings = () => {
    const { address: teacherAddress } = useAccount();

    // 1. 获取 YD Token 余额 (Liquid Wallet)
    const { data: ydTokenBalance, isLoading: isYdBalanceLoading } = useReadContract({
        address: CONTRACTS.YDToken.address as `0x${string}`,
        abi: YDToken_ABI,
        functionName: 'balanceOf',
        args: teacherAddress ? [teacherAddress] : undefined,
        query: {
            enabled: !!teacherAddress,
            refetchInterval: 10000, // 每 10 秒刷新一次余额
        },
    });
    const liquidBalance = ydTokenBalance ? parseFloat(formatUnits(ydTokenBalance as bigint, 18)).toFixed(2) : "0.00";


    const { data: transactionsData, isLoading: isTransactionsLoading } = useQuery({
        queryKey: ["teacherTransactions", teacherAddress],
        queryFn: async () => {
            if (!teacherAddress) return null;
            return await graphQLClient.request(GET_TRANSACTIONS, { walletAddress: teacherAddress });
        },
        enabled: !!teacherAddress,
    });

    const transactions = (transactionsData as any)?.transactions || [];

    // 计算统计数据
    const totalEarnings = transactions
        .filter((tx: any) => tx.toWalletAddress.toLowerCase() === teacherAddress?.toLowerCase())
        .reduce((sum: number, tx: any) => sum + (tx.amountYd || 0), 0);

	// Mock balance data for now (DeFi Vault remains mock)
	const defiBalance = 650; // This remains mock as per discussion.

    const isLoading = isYdBalanceLoading || isTransactionsLoading;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2 text-muted-foreground">加载收益数据...</p>
            </div>
        );
    }

    if (!teacherAddress) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                <p>请连接钱包以查看您的收益。</p>
            </div>
        );
    }

	return (
		<div className="py-8 max-w-6xl mx-auto space-y-8">
			<h1 className="text-3xl font-bold tracking-tight">Earnings Dashboard</h1>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Liquid Wallet - Immediately Available */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Liquid Wallet (Available)</CardTitle>
						<Wallet className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{liquidBalance} YD</div>
						<p className="text-xs text-muted-foreground">
							Ready to withdraw or transfer
						</p>
					</CardContent>
				</Card>

                {/* DeFi Vault - Auto-invested */}
				<Card className="border-green-500/20 bg-green-500/5">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">DeFi Vault (Locked)</CardTitle>
						<TrendingUp className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-700 dark:text-green-400">{defiBalance} USDT</div>
						<div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                Auto-Compounding
                            </span>
                            <p className="text-xs text-green-600 dark:text-green-400">
                                +2.5% APY
                            </p>
                        </div>
					</CardContent>
				</Card>

                {/* Total Historical Earnings */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Lifetime Earnings</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalEarnings} YD</div>
						<p className="text-xs text-muted-foreground">
							≈ ${totalEarnings.toFixed(2)} USD
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Transaction History</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
                            {transactions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">暂无交易记录</p>
                            ) : (
                                transactions.map((tx: any) => (
                                    <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div>
                                            <p className="font-medium">
                                                {tx.transactionType === 'course_purchase' ? '课程销售收入' : tx.transactionType}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(Number(tx.createdAt)).toLocaleDateString()} • {tx.transactionHash.slice(0, 6)}...{tx.transactionHash.slice(-4)}
                                            </p>
                                        </div>
                                        <div className="font-bold text-green-600">+{tx.amountYd} YD</div>
                                    </div>
                                ))
                            )}
						</div>
					</CardContent>
				</Card>

				<div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Funds</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Withdraw from DeFi Vault</h4>
                                <div className="flex gap-2">
                                    <Input type="number" placeholder="Amount USDT" />
                                    <Button size="icon">
                                        <ArrowRightLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button className="w-full" variant="secondary">Redeem to Wallet</Button>
                            </div>
                            
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Withdraw Liquid YD</h4>
                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">Transfer to Bank</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
			</div>
		</div>
	);
};

export default TeacherEarnings;