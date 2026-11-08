import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

// Tıklanınca sıralayan tablo başlığı. sortConfig: { key, direction: 'asc' | 'desc' }
function SortIcon({ active, direction }) {
  if (!active) {
    return (
      <ArrowUpDown className='h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100' />
    );
  }
  return direction === 'asc' ? (
    <ArrowUp className='h-3.5 w-3.5 text-brand' />
  ) : (
    <ArrowDown className='h-3.5 w-3.5 text-brand' />
  );
}

export default function SortableTh({ k, sortConfig, onSort, align = 'left', children }) {
  const right = align === 'right';
  return (
    <th
      scope='col'
      onClick={() => onSort(k)}
      className={`group cursor-pointer px-6 py-4 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100/60 ${right ? 'text-right' : 'text-left'}`}
    >
      <div className={`flex items-center gap-2 ${right ? 'justify-end' : ''}`}>
        {children}
        <SortIcon active={sortConfig.key === k} direction={sortConfig.direction} />
      </div>
    </th>
  );
}
