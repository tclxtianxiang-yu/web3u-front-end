import { useReadContract } from 'wagmi';
import { CONTRACTS } from '../contracts/addresses';
import { StudentCertificate_ABI } from '../contracts/abis';

export function useStudentCertificates(studentAddress?: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.StudentCertificate.address as `0x${string}`,
    abi: StudentCertificate_ABI,
    functionName: 'getCertificatesByStudent',
    args: studentAddress ? [studentAddress] : undefined,
    query: {
      enabled: !!studentAddress
    }
  });
}
