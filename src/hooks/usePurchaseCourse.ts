import { useWriteContract } from 'wagmi';
import { readContract } from '@wagmi/core';
import { CONTRACTS } from '../contracts/addresses';
import { YDToken_ABI, CourseRegistry_ABI, CoursePlatform_ABI } from '../contracts/abis';
import { config } from '../wallet/config';

export function usePurchaseCourse() {
  const { writeContractAsync } = useWriteContract();

  return async (courseId: string) => {
    // 1. Get course price
    // We use 'any' here because the ABI is loaded from JSON and might not have full type inference in this context
    // In a strictly typed environment, we would use TypeChain types
    const course = await readContract(config, {
      address: CONTRACTS.CourseRegistry.address as `0x${string}`,
      abi: CourseRegistry_ABI,
      functionName: 'getCourse',
      args: [courseId]
    }) as any;

    const price = course.priceYD;

    // 2. Approve YD Token
    await writeContractAsync({
      address: CONTRACTS.YDToken.address as `0x${string}`,
      abi: YDToken_ABI,
      functionName: 'approve',
      args: [CONTRACTS.CoursePlatform.address, price]
    });

    // 3. Purchase Course
    await writeContractAsync({
      address: CONTRACTS.CoursePlatform.address as `0x${string}`,
      abi: CoursePlatform_ABI,
      functionName: 'purchaseCourse',
      args: [courseId]
    });
  }
}
