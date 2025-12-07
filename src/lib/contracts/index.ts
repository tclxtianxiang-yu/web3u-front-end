import type { Abi } from "viem";
import { Counter__factory, type Counter } from "../../types/contracts";

export const counterAbi = Counter__factory.abi as unknown as Abi;

export type CounterContract = Counter;
export type CounterAbi = typeof counterAbi;

export const counterContractConfig = (address: `0x${string}`) =>
	({
		address,
		abi: counterAbi,
	}) as const;
