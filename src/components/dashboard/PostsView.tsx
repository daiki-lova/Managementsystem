import React, { useState, useRef, useCallback } from 'react';
import { 
  Search, Plus, MoreVertical, Copy, Eye, Trash2, ImageIcon, 
  ChevronDown, ArrowUpZA, ArrowDownAZ, Sparkles, PenTool
} from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '../../lib/utils';
import { Article } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';

export type ExtendedArticle = Article & { 
    categories: string[];
    thumbnail?: string;
    slug?: string;
    publishedAt?: string;
    authorName?: string;
};

interface PostsViewProps {
    data: ExtendedArticle[];
    onDataChange: (data: ExtendedArticle[]) => void;
    onNavigateToEditor: (id?: string, title?: string) => void;
    userRole: 'owner' | 'writer';
    onPreview: (article: any) => void;
    onSwitchToStrategy: () => void;
}

interface ColumnConfig {
    id: string;
    label: string;
    width: number;
    minWidth: number;
}

const COLUMN_TYPE = 'COLUMN';

interface DraggableHeaderProps {
    column: ColumnConfig;
    index: number;
    moveColumn: (dragIndex: number, hoverIndex: number) => void;
    onResizeStart: (e: React.MouseEvent, colId: string, currentWidth: number) => void;
    isSticky?: boolean;
    left?: number;
    className?: string;
    onSelectAll?: (checked: boolean) => void;
    allSelected?: boolean;
    onFilter?: (colId: string, value: string, checked: boolean) => void;
    filters?: Record<string, Set<string>>;
    onSort?: (colId: string, direction: 'asc' | 'desc' | null) => void;
    sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
    uniqueValues?: Record<string, { value: string; count: number }[]>;
}

function DraggableHeader({ 
    column, 
    index, 
    moveColumn, 
    onResizeStart, 
    isSticky, 
    left, 
    className, 
    onSelectAll, 
    allSelected,
    onFilter,
    filters,
    onSort,
    sortConfig,
    uniqueValues
}: DraggableHeaderProps) {
    const ref = useRef<HTMLTableHeaderCellElement>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [{ isDragging }, drag] = useDrag({
        type: COLUMN_TYPE,
        item: { index, id: column.id },
        canDrag: !isSticky,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [, drop] = useDrop({
        accept: COLUMN_TYPE,
        hover(item: { index: number; id: string }) {
            if (!ref.current) return;
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) return;
            if (isSticky) return;

            moveColumn(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    if (!isSticky) {
        drag(drop(ref));
    }

    const isFilterable = uniqueValues && uniqueValues[column.id];
    const isSortable = ['title', 'updatedAt', 'publishedAt', 'pv'].includes(column.id);

    return (
        <th 
            ref={ref}
            className={cn(
                "px-4 py-3.5 relative bg-neutral-50/80 select-none whitespace-nowrap text-[11px] text-neutral-500 font-medium group border-b border-neutral-200 border-r border-neutral-100/50",
                isDragging && "opacity-50",
                isSticky && "sticky z-20",
                className
            )}
            style={{ 
                width: column.width,
                minWidth: column.minWidth,
                left: isSticky ? left : undefined
            }}
        >
            <div className="flex items-center gap-2 h-full">
                {column.id === 'select' ? (
                    <div className="flex items-center justify-center w-full">
                        <input 
                            type="checkbox" 
                            checked={allSelected}
                            onChange={(e) => onSelectAll?.(e.target.checked)}
                            className="rounded border-neutral-300 scale-90 cursor-pointer"
                        />
                    </div>
                ) : (
                    <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                        <PopoverTrigger asChild>
                            <button className={cn(
                                "flex items-center gap-2 hover:bg-neutral-100 rounded px-1 py-0.5 -ml-1 transition-colors outline-none group/btn",
                                (filters?.[column.id]?.size ?? 0) > 0 && "text-blue-600 bg-blue-50 hover:bg-blue-100",
                                sortConfig?.key === column.id && "text-blue-600"
                            )}>
                                {column.label}
                                {(isFilterable || isSortable) && (
                                    <ChevronDown size={10} className={cn("text-neutral-300 group-hover/btn:text-neutral-500", (filters?.[column.id]?.size ?? 0) > 0 && "text-blue-400")} />
                                )}
                            </button>
                        </PopoverTrigger>
                        {(isFilterable || isSortable) && (
                             <PopoverContent className="w-56 p-2" align="start">
                                <div className="space-y-2">
                                    <div className="text-xs font-medium text-neutral-500 px-2 py-1">{column.label}</div>
                                    
                                    {isSortable && (
                                        <div className="space-y-1 border-b border-neutral-100 pb-2 mb-2">
                                            <button onClick={() => { onSort?.(column.id, 'asc'); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-neutral-100">
                                                <ArrowUpZA size={14} className="text-neutral-400" /> 昇順
                                            </button>
                                            <button onClick={() => { onSort?.(column.id, 'desc'); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-neutral-100">
                                                <ArrowDownAZ size={14} className="text-neutral-400" /> 降順
                                            </button>
                                        </div>
                                    )}

                                    {isFilterable && (
                                         <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                            {uniqueValues![column.id].map((item) => (
                                                <div key={item.value} className="flex items-center justify-between px-2 py-1.5 hover:bg-neutral-50 rounded">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={filters?.[column.id]?.has(item.value) || false}
                                                            onChange={(e) => onFilter?.(column.id, item.value, e.target.checked)}
                                                            className="rounded border-neutral-300 text-blue-600"
                                                        />
                                                        <span className="text-sm text-neutral-700 truncate">{item.value}</span>
                                                    </div>
                                                    <span className="text-xs text-neutral-400">{item.count}</span>
                                                </div>
                                            ))}
                                         </div>
                                    )}
                                </div>
                            </PopoverContent>
                        )}
                    </Popover>
                )}
            </div>
            
            <div 
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors z-30"
                onMouseDown={(e) => onResizeStart(e, column.id, column.width)}
            />
        </th>
    );
}

function ArticlesTable({ data, onDataChange, onEdit, userRole, onPreview }: Omit<PostsViewProps, 'onNavigateToEditor' | 'onSwitchToStrategy'> & { onEdit: (id?: string) => void }) {
    const [columns, setColumns] = useState<ColumnConfig[]>([
        { id: 'actions', label: '', width: 40, minWidth: 40 },
        { id: 'select', label: '', width: 40, minWidth: 40 },
        { id: 'status', label: 'ステータス', width: 100, minWidth: 100 },
        { id: 'title', label: 'タイトル', width: 300, minWidth: 200 },
        { id: 'thumbnail', label: 'サムネイル', width: 80, minWidth: 80 },
        { id: 'author', label: '執筆者', width: 120, minWidth: 100 },
        { id: 'categories', label: 'カテゴリー', width: 150, minWidth: 120 },
        { id: 'tags', label: 'タグ', width: 180, minWidth: 120 },
        { id: 'pv', label: 'PV数', width: 80, minWidth: 80 },
        { id: 'updatedAt', label: '更新日', width: 140, minWidth: 120 },
        { id: 'publishedAt', label: '公開日', width: 140, minWidth: 120 },
        { id: 'slug', label: 'スラッグ', width: 150, minWidth: 120 },
    ]);
    
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filters, setFilters] = useState<Record<string, Set<string>>>({});
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const moveColumn = useCallback((dragIndex: number, hoverIndex: number) => {
        setColumns((prevColumns) => {
            const newColumns = [...prevColumns];
            const [draggedColumn] = newColumns.splice(dragIndex, 1);
            newColumns.splice(hoverIndex, 0, draggedColumn);
            return newColumns;
        });
    }, []);

    const handleResizeStart = (e: React.MouseEvent, colId: string, currentWidth: number) => {
        e.preventDefault();
        const startX = e.clientX;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const diff = moveEvent.clientX - startX;
            setColumns(cols => cols.map(col => {
                if (col.id === colId) {
                    return { ...col, width: Math.max(col.minWidth, currentWidth + diff) };
                }
                return col;
            }));
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const uniqueValues = React.useMemo(() => {
        const values: Record<string, { value: string; count: number }[]> = {};
        ['status', 'author', 'categories', 'tags'].forEach(key => {
            const counts: Record<string, number> = {};
            data.forEach(item => {
                // @ts-ignore
                const val = item[key];
                if (Array.isArray(val)) {
                    val.forEach(v => counts[v] = (counts[v] || 0) + 1);
                } else if (val) {
                    counts[val] = (counts[val] || 0) + 1;
                }
            });
            values[key] = Object.entries(counts).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
        });
        return values;
    }, [data]);

    const filteredData = data.filter(item => {
        return Object.entries(filters).every(([key, filterSet]) => {
            if (filterSet.size === 0) return true;
            // @ts-ignore
            const val = item[key];
            if (Array.isArray(val)) return val.some(v => filterSet.has(v));
            return filterSet.has(val);
        });
    }).sort((a, b) => {
        if (!sortConfig) return 0;
        // @ts-ignore
        const aVal = a[sortConfig.key];
        // @ts-ignore
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? new Set(filteredData.map(d => d.id)) : new Set());
    };

    const handleFilter = (colId: string, value: string, checked: boolean) => {
        const newFilters = { ...filters };
        if (!newFilters[colId]) newFilters[colId] = new Set();
        if (checked) newFilters[colId].add(value);
        else newFilters[colId].delete(value);
        setFilters(newFilters);
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="w-full h-full overflow-auto relative">
                <table className="w-full border-collapse" style={{ minWidth: columns.reduce((acc, col) => acc + col.width, 0) }}>
                    <thead className="sticky top-0 z-20">
                        <tr>
                            {columns.map((column, index) => {
                                const isSticky = ['select', 'actions', 'status'].includes(column.id);
                                let left = 0;
                                if (isSticky) {
                                    for (let i = 0; i < index; i++) {
                                        left += columns[i].width;
                                    }
                                }

                                return (
                                    <DraggableHeader
                                        key={column.id}
                                        column={column}
                                        index={index}
                                        moveColumn={moveColumn}
                                        onResizeStart={handleResizeStart}
                                        isSticky={isSticky}
                                        left={left}
                                        onSelectAll={column.id === 'select' ? toggleSelectAll : undefined}
                                        allSelected={filteredData.length > 0 && selectedIds.size === filteredData.length}
                                        uniqueValues={uniqueValues}
                                        onFilter={handleFilter}
                                        filters={filters}
                                        onSort={(key, dir) => setSortConfig(dir ? { key, direction: dir } : null)}
                                        sortConfig={sortConfig}
                                    />
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {filteredData.map((article) => (
                            <tr 
                                key={article.id} 
                                className={cn(
                                    "group hover:bg-neutral-50/80 transition-colors",
                                    selectedIds.has(article.id) && "bg-blue-50/50 hover:bg-blue-50/60"
                                )}
                            >
                                {columns.map((column, colIndex) => {
                                    const isSticky = ['select', 'actions', 'status'].includes(column.id);
                                    let left = 0;
                                    if (isSticky) {
                                        for (let i = 0; i < colIndex; i++) {
                                            left += columns[i].width;
                                        }
                                    }

                                    return (
                                        <td 
                                            key={column.id}
                                            className={cn(
                                                "px-4 py-3.5 bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50 align-middle",
                                                isSticky && "sticky z-10",
                                                selectedIds.has(article.id) && "bg-blue-50/50 group-hover:bg-blue-50/60"
                                            )}
                                            style={{ left: isSticky ? left : undefined }}
                                        >
                                            {column.id === 'select' && (
                                                <div className="flex items-center justify-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedIds.has(article.id)}
                                                        onChange={() => toggleSelection(article.id)}
                                                        className="rounded border-neutral-300 scale-90 cursor-pointer"
                                                    />
                                                </div>
                                            )}
                                            
                                            {column.id === 'actions' && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-900 transition-colors outline-none focus:bg-neutral-100">
                                                            <MoreVertical size={14} />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-32">
                                                        <DropdownMenuItem onClick={() => onPreview(article)}>
                                                            <Eye size={14} className="mr-2" /> プレビュー
                                                        </DropdownMenuItem>
                                                         <DropdownMenuItem onClick={() => {
                                                             const newArticle = { ...article, id: Math.random().toString(36).substr(2, 9), title: `${article.title} (Copy)`, status: 'draft' };
                                                             onDataChange([...data, newArticle as ExtendedArticle]);
                                                         }}>
                                                            <Copy size={14} className="mr-2" /> 複製
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onEdit(article.id)}>
                                                            <PenTool size={14} className="mr-2" /> 編集
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDataChange(data.filter(d => d.id !== article.id))}>
                                                            <Trash2 size={14} className="mr-2" /> 削除
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}

                                            {column.id === 'status' && (
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        article.status === 'published' ? "bg-emerald-500" :
                                                        article.status === 'scheduled' ? "bg-orange-400" :
                                                        article.status === 'draft' ? "bg-neutral-300" :
                                                        "bg-blue-500" // review
                                                    )} />
                                                    <span className={cn(
                                                        "text-[11px] font-medium",
                                                        article.status === 'published' ? "text-emerald-700" :
                                                        article.status === 'scheduled' ? "text-orange-700" :
                                                        article.status === 'draft' ? "text-neutral-500" :
                                                        "text-blue-700"
                                                    )}>
                                                        {article.status === 'published' ? '公開中' :
                                                         article.status === 'scheduled' ? '公開予約' :
                                                         article.status === 'draft' ? '下書き' : 'レビュー中'}
                                                    </span>
                                                </div>
                                            )}

                                            {column.id === 'title' && (
                                                <div 
                                                    className="font-medium text-neutral-900 text-xs leading-normal cursor-pointer hover:text-blue-600 hover:underline decoration-blue-300 underline-offset-2 transition-all"
                                                    onClick={() => onEdit(article.id)}
                                                >
                                                    {article.title}
                                                </div>
                                            )}

                                            {column.id === 'thumbnail' && (
                                                <div className="w-10 h-10 rounded bg-neutral-100 overflow-hidden border border-neutral-100">
                                                    {article.thumbnail ? (
                                                        <img src={article.thumbnail} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                                            <ImageIcon size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {column.id === 'author' && (
                                                <div className="flex items-center gap-1.5">
                                                    <Avatar className="h-5 w-5 border border-neutral-100">
                                                        <AvatarFallback className="text-[9px]">{article.authorName?.slice(0,2) || 'AD'}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-[11px] text-neutral-600">{article.authorName || 'Admin'}</span>
                                                </div>
                                            )}

                                            {column.id === 'categories' && (
                                                <div className="flex flex-wrap gap-1">
                                                    {article.categories?.map(cat => (
                                                        <span key={cat} className="px-1.5 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] rounded border border-neutral-200 whitespace-nowrap">
                                                            {cat}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {column.id === 'tags' && (
                                                <div className="flex flex-wrap gap-1">
                                                    {article.tags?.slice(0, 2).map(tag => (
                                                        <span key={tag} className="flex items-center gap-0.5 text-[10px] text-neutral-500 whitespace-nowrap">
                                                            <span className="text-neutral-300">#</span>
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {(article.tags?.length || 0) > 2 && (
                                                        <span className="text-[10px] text-neutral-400">+{article.tags.length - 2}</span>
                                                    )}
                                                </div>
                                            )}

                                            {column.id === 'pv' && (
                                                <span className="text-[11px] text-neutral-500 font-mono">{article.pv.toLocaleString()}</span>
                                            )}

                                            {(column.id === 'updatedAt' || column.id === 'publishedAt') && (
                                                <span className="text-[11px] text-neutral-500 font-mono">
                                                    {/* @ts-ignore */}
                                                    {article[column.id]}
                                                </span>
                                            )}

                                            {column.id === 'slug' && (
                                                <span className="text-[11px] text-neutral-400 font-mono truncate max-w-[120px] block">
                                                    {article.slug}
                                                </span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DndProvider>
    );
}

export function PostsView({ 
    data, 
    onDataChange, 
    onNavigateToEditor, 
    userRole, 
    onPreview,
    onSwitchToStrategy 
}: PostsViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    
    const filteredData = data.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (post.slug && post.slug.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="flex flex-col h-full">
            <header className="h-24 flex-none px-8 flex items-end justify-between pb-6 bg-white border-b border-neutral-100">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900">記事一覧</h1>
                    <p className="text-sm text-neutral-500 font-medium">記事コンテンツの管理・編集</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
                        <Input 
                            className="w-[300px] pl-11 h-12 bg-neutral-100 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 rounded-full text-sm font-medium transition-all"
                            placeholder="記事を検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="h-12 !px-8 rounded-full bg-neutral-900 text-white font-bold hover:bg-neutral-800 shadow-sm">
                                新規作成
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>作成方法を選択</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onSwitchToStrategy} className="cursor-pointer">
                                <Sparkles size={14} className="mr-2 text-indigo-500" />
                                <div className="flex flex-col">
                                    <span className="font-medium">AIで記事を作成</span>
                                    <span className="text-[10px] text-neutral-500">AI記事企画から提案</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onNavigateToEditor()} className="cursor-pointer">
                                <PenTool size={14} className="mr-2" />
                                    <div className="flex flex-col">
                                    <span className="font-medium">手動で作成</span>
                                    <span className="text-[10px] text-neutral-500">エディタを開く</span>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <div className="flex-1 overflow-hidden relative">
                <ArticlesTable 
                    data={filteredData}
                    onDataChange={onDataChange}
                    onEdit={(id) => onNavigateToEditor(id)} 
                    userRole={userRole} 
                    onPreview={onPreview} 
                />
            </div>
        </div>
    );
}