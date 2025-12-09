import { useWriteContract } from 'wagmi';
import { readContract, waitForTransactionReceipt } from '@wagmi/core/actions';
import { CONTRACTS } from '../contracts/addresses';
import { YDToken_ABI, CourseRegistry_ABI, CoursePlatform_ABI } from '../contracts/abis';
import { config } from '../wallet/config';

export function usePurchaseCourse() {
  const { writeContractAsync } = useWriteContract();

  return async (courseId: string) => {
    // 1. Get course price
    const course = await readContract(config, {
      address: CONTRACTS.CourseRegistry.address as `0x${string}`,
      abi: CourseRegistry_ABI,
      functionName: 'getCourse',
      args: [courseId]
    }) as any;

    const price = course.priceYD; // Use priceYD (大写 D) from course details

    // 2. Approve YD Token
    const approveHash = await writeContractAsync({ // Get transaction hash
      address: CONTRACTS.YDToken.address as `0x${string}`,
      abi: YDToken_ABI,
      functionName: 'approve',
      args: [CONTRACTS.CoursePlatform.address, price]
    });

    // Wait for the approve transaction to be confirmed
    await waitForTransactionReceipt(config, {
      hash: approveHash,
      confirmations: 1,
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
