import { useEffect, useMemo, useState } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { ICD_CHILDREN, ICD_ROOT_CHAPTERS, ICD_SEARCH } from '../../graphql/queries';
import LoadingSpinner from '../common/LoadingSpinner';
import { ChevronRight, Search, ArrowLeft, X } from 'lucide-react';

type IcdEntity = {
  id?: string;
  uri: string;
  code?: string;
  title: string;
  hasChildren: boolean;
  foundationUri?: string;
  browserUrl?: string;
};

type Props = {
  onSelect: (entity: IcdEntity, parent?: IcdEntity) => void;
  selectedCode?: string;
};

function cleanText(text?: string) {
  return (text || '').replace(/<[^>]*>/g, '').trim();
}

export default function Icd11Picker({ onSelect, selectedCode }: Props) {
  const [query, setQuery] = useState('');
  const [path, setPath] = useState<IcdEntity[]>([]);
  const [items, setItems] = useState<IcdEntity[]>([]);
  const [browseError, setBrowseError] = useState('');

  const {
    data: rootData,
    loading: rootLoading,
    error: rootError,
  } = useQuery(ICD_ROOT_CHAPTERS, {
    variables: { language: 'en' },
  });

  const [
    loadChildren,
    { loading: childrenLoading, error: childrenError },
  ] = useLazyQuery(ICD_CHILDREN, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      setItems(data?.icd11Children || []);
      setBrowseError('');
    },
    onError: (err) => setBrowseError(err.message),
  });

  const [
    searchIcd,
    { data: searchData, loading: searching, error: searchError },
  ] = useLazyQuery(ICD_SEARCH, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (path.length === 0) {
      setItems(rootData?.icd11RootChapters || []);
    }
  }, [rootData, path.length]);

  useEffect(() => {
    if (rootError) setBrowseError(rootError.message);
  }, [rootError]);

  useEffect(() => {
    if (childrenError) setBrowseError(childrenError.message);
  }, [childrenError]);

  const currentParent = path[path.length - 1];
  const searchResults = useMemo(
    () =>
      (searchData?.icd11Search || []).map((item: IcdEntity) => ({
        ...item,
        title: cleanText(item.title),
      })),
    [searchData],
  );

  const runSearch = () => {
    if (query.trim().length < 2) return;
    searchIcd({ variables: { q: query.trim(), language: 'en' } });
  };

  const openNode = async (item: IcdEntity) => {
    if (!item.hasChildren) {
      onSelect(item, currentParent);
      return;
    }

    setPath((prev) => [...prev, item]);
    await loadChildren({ variables: { uri: item.uri, language: 'en' } });
  };

  const goBack = async (index?: number) => {
    const nextPath = typeof index === 'number' ? path.slice(0, index + 1) : path.slice(0, -1);
    setPath(nextPath);

    const target = nextPath[nextPath.length - 1];
    if (!target) {
      setItems(rootData?.icd11RootChapters || []);
      setBrowseError('');
      return;
    }

    await loadChildren({ variables: { uri: target.uri, language: 'en' } });
  };

  const renderItem = (item: IcdEntity) => (
    <button
      key={item.uri || item.code}
      type="button"
      onClick={() => openNode(item)}
      className={`flex min-h-12 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
        selectedCode && item.code === selectedCode
          ? 'border-brand-300 bg-brand-50 text-brand-800'
          : 'border-surface-200 bg-white text-surface-700 hover:border-brand-300'
      }`}
    >
      <span className="w-14 flex-shrink-0 text-xs font-medium text-surface-400">{item.code || '-'}</span>
      <span className="flex-1 text-sm leading-snug">{cleanText(item.title)}</span>
      {item.hasChildren && <ChevronRight size={14} className="flex-shrink-0 text-surface-300" />}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), runSearch())}
            className="input-field pl-9"
            placeholder="ICD-11 хайх"
          />
        </div>
        <button type="button" onClick={runSearch} className="btn-ghost text-sm">
          Хайх
        </button>
      </div>

      {query.trim().length > 0 && (
        <div className="space-y-2 rounded-lg border border-surface-200 bg-surface-50 p-2">
          <p className="text-[10px] uppercase tracking-wider text-surface-500">Хайлтын үр дүн</p>
          {searching ? (
            <LoadingSpinner />
          ) : searchError ? (
            <p className="text-sm text-red-600">{searchError.message}</p>
          ) : searchResults.length > 0 ? (
            searchResults.slice(0, 10).map(renderItem)
          ) : query.trim().length >= 2 ? (
            <p className="py-3 text-sm text-surface-400">Илэрц олдсонгүй</p>
          ) : (
            <p className="py-3 text-sm text-surface-400">Дор хаяж 2 үсэг оруулж хайна</p>
          )}
        </div>
      )}

      <div className="space-y-2 rounded-lg border border-surface-200 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {path.length > 0 && (
            <button type="button" onClick={() => goBack()} className="btn-ghost text-xs">
              <ArrowLeft size={12} /> Буцах
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setPath([]);
              setItems(rootData?.icd11RootChapters || []);
              setBrowseError('');
            }}
            className="btn-ghost text-xs"
          >
            <X size={12} /> Эхлэх
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1 text-xs text-surface-500">
          <span className="font-medium text-surface-700">Зам:</span>
          <button type="button" onClick={() => { setPath([]); setItems(rootData?.icd11RootChapters || []); }} className="underline-offset-2 hover:underline">
            Бүлгүүд
          </button>
          {path.map((item, index) => (
            <div key={item.uri} className="flex items-center gap-1">
              <ChevronRight size={12} />
              <button type="button" onClick={() => goBack(index)} className="underline-offset-2 hover:underline">
                {item.code || cleanText(item.title)}
              </button>
            </div>
          ))}
        </div>

        {browseError && <p className="text-sm text-red-600">{browseError}</p>}

        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {rootLoading || childrenLoading ? (
            <LoadingSpinner />
          ) : items.length > 0 ? (
            items.map(renderItem)
          ) : (
            <p className="py-8 text-center text-sm text-surface-400">Сонгох ICD-11 элемент олдсонгүй</p>
          )}
        </div>
      </div>
    </div>
  );
}
