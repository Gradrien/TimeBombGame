import Image from 'next/image';
import {cn} from '@/components/ui';
import {useSkinAsset} from '@/skins';
import type {ChaosRoleChipProps} from './types';

export function ChaosRoleChip({team}: ChaosRoleChipProps) {
  const isBlue = team === 'blue';
  const skinned = useSkinAsset();
  return (
      <span
          className={cn(
              'flex items-center justify-center rounded-md border px-1 py-0.5 shadow-inner',
              isBlue ? 'border-sherlock/40 bg-sherlock-deep/40' : 'border-moriarty/40 bg-moriarty-deep/40',
          )}
      >
        <Image
            src={skinned(`/assets/roles/role-${isBlue ? 'blue' : 'red'}-1.png`)}
            alt={isBlue ? 'Sherlock' : 'Moriarty'}
            width={14}
            height={19}
            className="object-contain"
        />
      </span>
  );
}
