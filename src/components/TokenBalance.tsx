import { useReadContract, useBalance, useAccount } from "wagmi";
import { formatUnits } from "viem";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Wallet, Coins, TrendingUp, Loader2, ExternalLink } from "lucide-react";
import { CONTRACTS } from "../contracts/addresses";
import { YDToken_ABI } from "../contracts/abis";

const TokenBalance = () => {
    const { address, isConnected } = useAccount();

    // Fetch YD Token Balance
    const { data: ydBalance, isLoading: isYdLoading } = useReadContract({
        address: CONTRACTS.YDToken.address as `0x${string}`,
        abi: YDToken_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
            refetchInterval: 10000, // Refetch every 10s
        }
    });

    // Fetch ETH Balance
    const { data: ethBalance, isLoading: isEthLoading } = useBalance({
        address: address,
        query: {
            enabled: !!address,
            refetchInterval: 10000,
        }
    });

    // Mock USDT Balance (Since we don't have a real USDT contract yet)
    const usdtBalance = 650; // This would be fetched from contract in real scenario

    if (!isConnected) return null;

    const formattedYd = ydBalance ? parseFloat(formatUnits(ydBalance as bigint, 18)).toFixed(2) : "0.00";
    const formattedEth = ethBalance ? parseFloat(formatUnits(ethBalance.value, 18)).toFixed(4) : "0.0000";

    const totalValue = (parseFloat(formattedYd) * 1 + parseFloat(formattedEth) * 3000 + usdtBalance).toFixed(2); // Mock exchange rates: YD=1$, ETH=$3000

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 gap-2 px-3 mr-2 hidden sm:flex">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{isYdLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : formattedYd} YD</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h4 className="text-sm font-medium leading-none text-muted-foreground">总资产估值</h4>
                        <p className="text-2xl font-bold">≈ ${totalValue}</p>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="bg-primary/10 p-1.5 rounded-full">
                                    <Coins className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">YD Token</p>
                                    <p className="text-xs text-muted-foreground">平台代币</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium">{formattedYd}</p>
                                <p className="text-xs text-muted-foreground">≈ ${formattedYd}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-500/10 p-1.5 rounded-full">
                                    <Wallet className="h-4 w-4 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">ETH</p>
                                    <p className="text-xs text-muted-foreground">Gas 费用</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium">{formattedEth}</p>
                                <p className="text-xs text-muted-foreground">≈ ${(parseFloat(formattedEth) * 3000).toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="bg-green-500/10 p-1.5 rounded-full">
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">理财份额</p>
                                    <p className="text-xs text-muted-foreground">USDT (模拟)</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium">{usdtBalance.toFixed(2)}</p>
                                <p className="text-xs text-green-500">+2.5% APY</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="w-full">
                            充值 YD
                        </Button>
                        <Button size="sm" className="w-full">
                            去提现 <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default TokenBalance;
