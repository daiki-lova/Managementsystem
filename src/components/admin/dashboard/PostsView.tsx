'use client'

import React, { useState, useCallback, useRef } from 'react';
import {
    Search, Plus, MoreVertical, Copy, Eye, Trash2, ImageIcon,
    ChevronDown, ArrowUpZA, ArrowDownAZ, Sparkles, PenTool,
    Send, Calendar as CalendarIcon, Ban, Loader2, RotateCcw, X, FileEdit,
    GripVertical, ArrowUpDown, Check
} from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '@/app/admin/lib/utils';
import { Article } from '@/app/admin/lib/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from "../ui/avatar";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Calendar } from '../ui/calendar';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/dialog";
import { ConfirmDialog } from '../ui/confirm-dialog';
import {
    useArticles,
    useDeleteArticle,
    useDeleteArticlePermanent,
    usePublishArticle,
    useScheduleArticle,
    useUpdateArticle,
    useCreateArticle,
    useRestoreArticle,
} from '@/app/admin/lib/hooks';

export type ExtendedArticle = Article & {
    categories: string[];
    thumbnail?: string;
    slug?: string;
    publishedAt?: string;
    authorName?: string;
    version?: number;
};

interface PostsViewProps {
    data?: ExtendedArticle[];
    onDataChange?: (data: ExtendedArticle[]) => void;
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
const ARTICLE_ROW_TYPE = 'ARTICLE_ROW';

// 行のドラッグ＆ドロップ用コンポーネント
interface DraggableRowProps {
    index: number;
    article: ExtendedArticle;
    moveRow: (dragIndex: number, hoverIndex: number) => void;
    onDragEnd: () => void;
    isReorderMode: boolean;
    children: React.ReactNode;
    className?: string;
}

const DraggableRow = React.memo(function DraggableRow({ index, article, moveRow, onDragEnd, isReorderMode, children, className }: DraggableRowProps) {
    const ref = useRef<HTMLTableRowElement>(null);

    const [{ isDragging }, drag, preview] = useDrag({
        type: ARTICLE_ROW_TYPE,
        item: { index, id: article.id },
        canDrag: isReorderMode,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        end: () => {
            onDragEnd();
        },
    });

    const [, drop] = useDrop({
        accept: ARTICLE_ROW_TYPE,
        hover: (item: { index: number; id: string }) => {
            if (!ref.current) return;
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) return;
            moveRow(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    preview(drop(ref));

    return (
        <tr
            ref={ref}
            className={cn(className, isDragging && "opacity-50 bg-blue-50")}
        >
            {/* ドラッグハンドル */}
            <td
                ref={drag}
                className={cn(
                    "px-2 py-3.5 bg-white transition-colors border-r border-neutral-100/50 align-middle",
                    isReorderMode ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                )}
            >
                <div className="flex items-center justify-center">
                    <GripVertical
                        size={16}
                        className={cn(
                            "transition-colors",
                            isReorderMode ? "text-neutral-400 hover:text-neutral-600" : "text-neutral-200"
                        )}
                    />
                </div>
            </td>
            {children}
        </tr>
    );
});

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

const DraggableHeader = React.memo(function DraggableHeader({
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
                "px-4 py-2.5 relative bg-neutral-50/80 select-none whitespace-nowrap text-xs text-neutral-500 font-medium group border-b border-neutral-200 border-r border-neutral-100/50",
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
});

interface ArticlesTableProps {
    data: ExtendedArticle[];
    onEdit: (id?: string) => void;
    userRole: 'owner' | 'writer';
    onPreview: (article: any) => void;
    onPublish: (id: string, version: number) => void;
    onSchedule: (id: string, scheduledAt: string, version: number) => void;
    onDelete: (id: string) => void;
    onRestore: (id: string) => void;
    onDeletePermanent: (id: string) => void;
    onUpdateStatus: (id: string, status: string, version: number) => void;
    onUpdatePublishedAt?: (id: string, publishedAt: string | null, version: number) => void;
    onDuplicate: (article: ExtendedArticle) => void;
    isTrashView: boolean;
    // Bulk operation handlers (silent - no individual dialogs)
    onBulkDelete: (ids: string[]) => void;
    onBulkDeletePermanent: (ids: string[]) => void;
    onBulkRestore: (ids: string[]) => void;
    onBulkSetDraft: (ids: string[]) => void;
    // 順番変更
    onReorder: (items: { id: string; displayOrder: number }[]) => void;
    isReorderMode: boolean;
}

// 公開日編集コンポーネント
interface PublishedAtEditorProps {
    article: ExtendedArticle;
    onUpdate: (date: string | null) => void;
}

const PublishedAtEditor = React.memo(function PublishedAtEditor({ article, onUpdate }: PublishedAtEditorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(() => {
        if (article.publishedAt) {
            // "yyyy-MM-dd HH:mm" 形式からパース
            const parts = article.publishedAt.split(' ');
            if (parts.length === 2) {
                const [datePart, timePart] = parts;
                const [year, month, day] = datePart.split('-').map(Number);
                const [hours, minutes] = timePart.split(':').map(Number);
                return new Date(year, month - 1, day, hours, minutes);
            }
        }
        return undefined;
    });
    const [time, setTime] = useState<string>(() => {
        if (article.publishedAt) {
            const parts = article.publishedAt.split(' ');
            if (parts.length === 2) {
                return parts[1];
            }
        }
        return '12:00';
    });

    const handleSave = () => {
        if (date) {
            const [hh, mm] = time.split(':').map(Number);
            const newDate = new Date(date);
            if (Number.isFinite(hh)) newDate.setHours(hh);
            if (Number.isFinite(mm)) newDate.setMinutes(mm);
            newDate.setSeconds(0, 0);
            onUpdate(newDate.toISOString());
        } else {
            onUpdate(null);
        }
        setIsOpen(false);
    };

    const handleClear = () => {
        setDate(undefined);
        onUpdate(null);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button className="text-[11px] text-neutral-500 font-mono hover:text-blue-600 hover:underline decoration-blue-300 underline-offset-2 transition-all cursor-pointer text-left">
                    {article.publishedAt || <span className="text-neutral-300">未設定</span>}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 space-y-3">
                    <div className="text-sm font-medium text-neutral-700">公開日を編集</div>
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                        locale={ja}
                    />
                    <div>
                        <label className="text-xs text-neutral-500 block mb-1.5">時間</label>
                        <Input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="h-9"
                        />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                            クリア
                        </Button>
                        <div className="flex-1" />
                        <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                            キャンセル
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            保存
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
});

const ArticlesTable = React.memo(function ArticlesTable({ data, onEdit, userRole, onPreview, onPublish, onSchedule, onDelete, onRestore, onDeletePermanent, onUpdateStatus, onUpdatePublishedAt, onDuplicate, isTrashView, onBulkDelete, onBulkDeletePermanent, onBulkRestore, onBulkSetDraft, onReorder, isReorderMode }: ArticlesTableProps) {
    // Bulk action confirmation dialog state
    const [bulkConfirmDialog, setBulkConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        variant: 'default' | 'destructive';
        onConfirm: () => void;
    }>({
        open: false,
        title: '',
        description: '',
        variant: 'default',
        onConfirm: () => {},
    });

    const [columns, setColumns] = useState<ColumnConfig[]>([
        { id: 'order', label: '', width: 40, minWidth: 40 },
        { id: 'actions', label: '', width: 40, minWidth: 40 },
        { id: 'select', label: '', width: 40, minWidth: 40 },
        { id: 'status', label: 'ステータス', width: 100, minWidth: 100 },
        { id: 'title', label: 'タイトル', width: 300, minWidth: 200 },
        { id: 'thumbnail', label: 'サムネイル', width: 80, minWidth: 80 },
        { id: 'categories', label: 'カテゴリー', width: 150, minWidth: 120 },
        { id: 'tags', label: 'タグ', width: 180, minWidth: 120 },
        { id: 'pv', label: 'PV数', width: 80, minWidth: 80 },
        { id: 'cv', label: 'CV数', width: 80, minWidth: 80 },
        { id: 'updatedAt', label: '更新日', width: 140, minWidth: 120 },
        { id: 'publishedAt', label: '公開日', width: 140, minWidth: 120 },
        { id: 'slug', label: 'スラッグ', width: 150, minWidth: 120 },
    ]);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filters, setFilters] = useState<Record<string, Set<string>>>({});
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Schedule Dialog State
    const [schedulingArticle, setSchedulingArticle] = useState<ExtendedArticle | null>(null);
    const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());
    const [scheduleTime, setScheduleTime] = useState<string>(() => {
        const now = new Date(Date.now() + 60 * 60 * 1000);
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
    });

    const openScheduleDialog = (article: ExtendedArticle) => {
        const now = new Date(Date.now() + 60 * 60 * 1000);
        setSchedulingArticle(article);
        setScheduleDate(now);
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setScheduleTime(`${hh}:${mm}`);
    };

    const moveColumn = useCallback((dragIndex: number, hoverIndex: number) => {
        setColumns((prevColumns) => {
            const newColumns = [...prevColumns];
            const [draggedColumn] = newColumns.splice(dragIndex, 1);
            newColumns.splice(hoverIndex, 0, draggedColumn);
            return newColumns;
        });
    }, []);

    // 順番変更用のローカルデータ
    const [localData, setLocalData] = useState<ExtendedArticle[]>(data);
    React.useEffect(() => {
        setLocalData(data);
    }, [data]);

    const moveRow = useCallback((dragIndex: number, hoverIndex: number) => {
        setLocalData((prevData) => {
            const newData = [...prevData];
            const [draggedItem] = newData.splice(dragIndex, 1);
            newData.splice(hoverIndex, 0, draggedItem);
            return newData;
        });
    }, []);

    const handleDragEnd = useCallback(() => {
        // ドラッグ終了時に順番をサーバーに保存
        const reorderedItems = localData.map((item, index) => ({
            id: item.id,
            displayOrder: index,
        }));
        onReorder(reorderedItems);
    }, [localData, onReorder]);

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

    // 順番変更モードの場合はlocalDataを使用、通常モードはフィルタ適用
    const filteredData = (isReorderMode ? localData : data).filter(item => {
        if (isReorderMode) return true; // 順番変更モードではフィルタを無効化
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

    const handlePublishArticle = (article: ExtendedArticle) => {
        onPublish(article.id, article.version || 1);
    };

    const handleUnpublish = (article: ExtendedArticle) => {
        onUpdateStatus(article.id, 'DRAFT', article.version || 1);
    };

    const handleScheduleConfirm = () => {
        if (!schedulingArticle || !scheduleDate) return;
        const [hh, mm] = scheduleTime.split(':').map((v) => Number(v));
        const scheduled = new Date(scheduleDate);
        if (Number.isFinite(hh)) scheduled.setHours(hh);
        if (Number.isFinite(mm)) scheduled.setMinutes(mm);
        scheduled.setSeconds(0, 0);
        onSchedule(schedulingArticle.id, scheduled.toISOString(), schedulingArticle.version || 1);
        setSchedulingArticle(null);
    };

    const handleClearSelection = () => {
        setSelectedIds(new Set());
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;
        const ids = Array.from(selectedIds);

        setBulkConfirmDialog({
            open: true,
            title: isTrashView ? '一括完全削除' : '一括ゴミ箱へ移動',
            description: isTrashView
                ? `選択した${selectedIds.size}件の記事を完全に削除してもよろしいですか？この操作は取り消せません。`
                : `選択した${selectedIds.size}件の記事をゴミ箱へ移動してもよろしいですか？`,
            variant: 'destructive',
            onConfirm: () => {
                setBulkConfirmDialog(prev => ({ ...prev, open: false }));
                // Use silent bulk handlers (no individual dialogs)
                if (isTrashView) {
                    onBulkDeletePermanent(ids);
                } else {
                    onBulkDelete(ids);
                }
                setSelectedIds(new Set());
            },
        });
    };

    const handleBulkRestore = () => {
        if (selectedIds.size === 0) return;
        const ids = Array.from(selectedIds);

        setBulkConfirmDialog({
            open: true,
            title: '一括復元',
            description: `選択した${selectedIds.size}件の記事を下書きに復元してもよろしいですか？`,
            variant: 'default',
            onConfirm: () => {
                setBulkConfirmDialog(prev => ({ ...prev, open: false }));
                // Use silent bulk handler (no individual dialogs)
                onBulkRestore(ids);
                setSelectedIds(new Set());
            },
        });
    };

    const handleBulkPublish = () => {
        selectedIds.forEach(id => {
            const article = data.find(d => d.id === id);
            if (article) {
                onPublish(article.id, article.version || 1);
            }
        });
        setSelectedIds(new Set());
    };

    const handleBulkSetDraft = () => {
        if (selectedIds.size === 0) return;
        const ids = Array.from(selectedIds);

        setBulkConfirmDialog({
            open: true,
            title: '一括で下書きに戻す',
            description: `選択した${selectedIds.size}件の記事を下書きステータスに変更してもよろしいですか？`,
            variant: 'default',
            onConfirm: () => {
                setBulkConfirmDialog(prev => ({ ...prev, open: false }));
                onBulkSetDraft(ids);
                setSelectedIds(new Set());
            },
        });
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="w-full h-full flex flex-col relative">
                {/* Toolbar */}
                {selectedIds.size > 0 && (
                    <div className="flex items-center justify-between py-3 px-6 border-b border-neutral-100 bg-neutral-50/50 flex-none">
                        <div className="text-xs text-neutral-600 font-medium">
                            {selectedIds.size}件を選択中
                        </div>
                        <div className="flex items-center gap-2">
                            {!isTrashView && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs border-neutral-300 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:border-neutral-400"
                                        onClick={handleBulkSetDraft}
                                    >
                                        <FileEdit size={12} className="mr-1.5" /> 下書きに戻す
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-400"
                                        onClick={handleBulkPublish}
                                    >
                                        <Send size={12} className="mr-1.5" /> 一括公開
                                    </Button>
                                </>
                            )}
                            {isTrashView && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-400"
                                    onClick={handleBulkRestore}
                                >
                                    <RotateCcw size={12} className="mr-1.5" /> 一括復元
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs border-red-300 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-400"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 size={12} className="mr-1.5" /> {isTrashView ? '完全削除' : 'ゴミ箱へ'}
                            </Button>
                            <button
                                onClick={handleClearSelection}
                                className="h-7 w-7 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="flex-1 overflow-auto">
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
                        {filteredData.map((article, rowIndex) => (
                            <DraggableRow
                                key={article.id}
                                index={rowIndex}
                                article={article}
                                moveRow={moveRow}
                                onDragEnd={handleDragEnd}
                                isReorderMode={isReorderMode}
                                className={cn(
                                    "group hover:bg-neutral-50/80 transition-colors",
                                    selectedIds.has(article.id) && "bg-blue-50/50 hover:bg-blue-50/60"
                                )}
                            >
                                {columns.map((column, colIndex) => {
                                    // 'order'カラムはDraggableRow内でレンダリング
                                    if (column.id === 'order') return null;

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
                                                    <DropdownMenuContent align="start" className="w-48">
                                                        <DropdownMenuItem onClick={() => onPreview(article)}>
                                                            <Eye size={14} className="mr-2" /> プレビュー
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onEdit(article.id)}>
                                                            <PenTool size={14} className="mr-2" /> 編集
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onDuplicate(article)}>
                                                            <Copy size={14} className="mr-2" /> 複製
                                                        </DropdownMenuItem>

                                                        <DropdownMenuSeparator />

                                                        {!isTrashView && ['draft', 'review', 'DRAFT', 'REVIEW'].includes(article.status as string) && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handlePublishArticle(article)} className="text-blue-600 focus:text-blue-600">
                                                                    <Send size={14} className="mr-2" /> 公開する
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => {
                                                                    openScheduleDialog(article);
                                                                }}>
                                                                    <CalendarIcon size={14} className="mr-2" /> 予約公開
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}

                                                        {!isTrashView && ['published', 'PUBLISHED'].includes(article.status as string) && (
                                                            <DropdownMenuItem onClick={() => handleUnpublish(article)} className="text-orange-600 focus:text-orange-600">
                                                                <Ban size={14} className="mr-2" /> 非公開にする
                                                            </DropdownMenuItem>
                                                        )}

                                                        <DropdownMenuSeparator />
                                                        {isTrashView || ['deleted', 'DELETED'].includes(article.status as string) ? (
                                                            <>
                                                                <DropdownMenuItem onClick={() => onRestore(article.id)}>
                                                                    <RotateCcw size={14} className="mr-2" /> 復元
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600"
                                                                    onClick={() => onDeletePermanent(article.id)}
                                                                >
                                                                    <Trash2 size={14} className="mr-2" /> 完全削除
                                                                </DropdownMenuItem>
                                                            </>
                                                        ) : (
                                                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(article.id)}>
                                                                <Trash2 size={14} className="mr-2" /> ゴミ箱へ
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}

                                            {column.id === 'status' && (() => {
                                                const status = article.status as string;
                                                return (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="flex items-center gap-2 hover:bg-neutral-100 px-2 py-1.5 -ml-2 rounded transition-colors outline-none group/status w-full text-left">
                                                            <div className={cn(
                                                                "w-2 h-2 rounded-full shrink-0",
                                                                status === 'published' ? "bg-emerald-500" :
                                                                    status === 'scheduled' ? "bg-orange-400" :
                                                                        status === 'deleted' ? "bg-red-400" :
                                                                            status === 'draft' ? "bg-neutral-300" :
                                                                                "bg-blue-500" // review
                                                            )} />
                                                            <span className={cn(
                                                                "text-[11px] font-medium flex-1 whitespace-nowrap",
                                                                status === 'published' ? "text-emerald-700" :
                                                                    status === 'scheduled' ? "text-orange-700" :
                                                                        status === 'deleted' ? "text-red-700" :
                                                                            status === 'draft' ? "text-neutral-500" :
                                                                                "text-blue-700"
                                                            )}>
                                                                {status === 'published' ? '公開中' :
                                                                    status === 'scheduled' ? '公開予約' :
                                                                        status === 'deleted' ? 'ゴミ箱' :
                                                                            status === 'draft' ? '下書き' : 'レビュー中'}
                                                            </span>
                                                            <ChevronDown size={12} className="text-neutral-400 opacity-0 group-hover/status:opacity-100 transition-opacity" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-40">
                                                        {isTrashView || ['deleted', 'DELETED'].includes(article.status as string) ? (
                                                            <>
                                                                <DropdownMenuItem onClick={() => onRestore(article.id)}>
                                                                    <RotateCcw size={14} className="mr-2" />
                                                                    復元
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600"
                                                                    onClick={() => onDeletePermanent(article.id)}
                                                                >
                                                                    <Trash2 size={14} className="mr-2" />
                                                                    完全削除
                                                                </DropdownMenuItem>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <DropdownMenuItem onClick={() => onUpdateStatus(article.id, 'DRAFT', article.version || 1)}>
                                                                    <div className="w-2 h-2 rounded-full bg-neutral-300 mr-2" />
                                                                    下書き
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => onUpdateStatus(article.id, 'REVIEW', article.version || 1)}>
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                                                                    レビュー中
                                                                </DropdownMenuItem>

                                                                <DropdownMenuItem onClick={() => handlePublishArticle(article)}>
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                                                                    公開済みにする
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => {
                                                                    openScheduleDialog(article);
                                                                }}>
                                                                    <div className="w-2 h-2 rounded-full bg-orange-400 mr-2" />
                                                                    予約公開...
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            );
                                            })()}

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
                                                        <img src={article.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
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
                                                        <AvatarFallback className="text-[9px]">{article.authorName?.slice(0, 2) || 'AD'}</AvatarFallback>
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

                                            {column.id === 'cv' && (
                                                // Mocking CV count based on PV for now, since it's not in the type yet
                                                <span className="text-[11px] text-neutral-500 font-mono">{Math.floor(article.pv * 0.02).toLocaleString()}</span>
                                            )}

                                            {column.id === 'updatedAt' && (
                                                <span className="text-[11px] text-neutral-500 font-mono">
                                                    {article.updatedAt}
                                                </span>
                                            )}

                                            {column.id === 'publishedAt' && (
                                                <PublishedAtEditor
                                                    article={article}
                                                    onUpdate={(date) => {
                                                        onUpdatePublishedAt?.(article.id, date, article.version || 1);
                                                    }}
                                                />
                                            )}

                                            {column.id === 'slug' && (
                                                <span className="text-[11px] text-neutral-400 font-mono truncate max-w-[120px] block">
                                                    {article.slug}
                                                </span>
                                            )}
                                        </td>
                                    );
                                })}
                            </DraggableRow>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>

            {/* Schedule Dialog */}
            <Dialog open={!!schedulingArticle} onOpenChange={(open) => !open && setSchedulingArticle(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>公開日時を設定</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 flex justify-center">
                        <Calendar
                            mode="single"
                            selected={scheduleDate}
                            onSelect={setScheduleDate}
                            className="rounded-md border"
                            locale={ja}
                        />
                    </div>
                    <div className="px-1 pb-2">
                        <label className="text-sm text-neutral-600">時間</label>
                        <Input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSchedulingArticle(null)}>キャンセル</Button>
                        <Button onClick={handleScheduleConfirm}>設定する</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Action Confirm Dialog */}
            <ConfirmDialog
                open={bulkConfirmDialog.open}
                onOpenChange={(open) => setBulkConfirmDialog(prev => ({ ...prev, open }))}
                title={bulkConfirmDialog.title}
                description={bulkConfirmDialog.description}
                confirmLabel="実行"
                cancelLabel="キャンセル"
                variant={bulkConfirmDialog.variant}
                onConfirm={bulkConfirmDialog.onConfirm}
            />
        </DndProvider>
    );
});

export function PostsView({
    data: _data,
    onDataChange: _onDataChange,
    onNavigateToEditor,
    userRole,
    onPreview,
    onSwitchToStrategy
}: PostsViewProps) {
    // Use API hooks
    const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
    const { data: articlesData, isLoading, error } = useArticles(
        viewMode === 'trash' ? { status: 'DELETED' } : undefined
    );
    const deleteArticle = useDeleteArticle();
    const deleteArticlePermanent = useDeleteArticlePermanent();
    const restoreArticle = useRestoreArticle();
    const publishArticle = usePublishArticle();
    const scheduleArticle = useScheduleArticle();
    const updateArticle = useUpdateArticle();
    const createArticle = useCreateArticle();

    const [searchQuery, setSearchQuery] = useState('');
    const [isReorderMode, setIsReorderMode] = useState(false);

    // 順番変更のAPI呼び出し
    const handleReorder = async (items: { id: string; displayOrder: number }[]) => {
        try {
            const response = await fetch('/api/articles/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });
            if (!response.ok) {
                console.error('並び替えの保存に失敗しました');
            }
        } catch (error) {
            console.error('並び替えエラー:', error);
        }
    };

    // Confirm Dialog States
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        variant?: 'default' | 'destructive';
    }>({
        open: false,
        title: '',
        description: '',
        onConfirm: () => {},
    });

    // Map API data to ExtendedArticle format
    const articles: ExtendedArticle[] = (articlesData?.data || []).map((article: any) => ({
        id: article.id,
        title: article.title,
        status: article.status?.toLowerCase() || 'draft',
        pv: article.viewCount || 0,
        updatedAt: article.updatedAt ? format(new Date(article.updatedAt), 'yyyy-MM-dd HH:mm') : '-',
        categories: article.categories ? [article.categories.name] : [],
        thumbnail: article.media_assets?.url || null,
        tags: article.article_tags?.map((at: any) => at.tags.name) || [],
        slug: article.slug,
        publishedAt: article.publishedAt ? format(new Date(article.publishedAt), 'yyyy-MM-dd HH:mm') : undefined,
        author: article.authors?.name || '',
        authorName: article.authors?.name,
        version: article.version || 1,
    }));

    // Filter by search
    const filteredArticles = articles.filter(article =>
        searchQuery === '' || article.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handlers
    const handlePublish = (id: string, version: number) => {
        publishArticle.mutate({ id, version });
    };

    const handleSchedule = (id: string, scheduledAt: string, version: number) => {
        scheduleArticle.mutate({ id, scheduledAt, version });
    };

    const handleDelete = (id: string) => {
        const article = articles.find(a => a.id === id);
        if (viewMode === 'trash') {
            setConfirmDialog({
                open: true,
                title: '記事を完全に削除',
                description: `「${article?.title || ''}」を完全に削除してもよろしいですか？この操作は取り消せません。`,
                variant: 'destructive',
                onConfirm: () => {
                    deleteArticlePermanent.mutate(id);
                    setConfirmDialog(prev => ({ ...prev, open: false }));
                },
            });
            return;
        }
        setConfirmDialog({
            open: true,
            title: '記事をゴミ箱へ移動',
            description: `「${article?.title || ''}」をゴミ箱に移動してもよろしいですか？`,
            variant: 'destructive',
            onConfirm: () => {
                deleteArticle.mutate(id);
                setConfirmDialog(prev => ({ ...prev, open: false }));
            },
        });
    };

    const handleRestore = (id: string) => {
        restoreArticle.mutate(id);
    };

    const handleDeletePermanent = (id: string) => {
        const article = articles.find(a => a.id === id);
        setConfirmDialog({
            open: true,
            title: '記事を完全に削除',
            description: `「${article?.title || ''}」を完全に削除してもよろしいですか？この操作は取り消せません。`,
            variant: 'destructive',
            onConfirm: () => {
                deleteArticlePermanent.mutate(id);
                setConfirmDialog(prev => ({ ...prev, open: false }));
            },
        });
    };

    const handleUpdateStatus = (id: string, status: string, version: number) => {
        updateArticle.mutate({ id, data: { status: status as 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'DELETED', version } });
    };

    const handleUpdatePublishedAt = (id: string, publishedAt: string | null, version: number) => {
        updateArticle.mutate({ id, data: { publishedAt, version } });
    };

    const handleDuplicate = (article: ExtendedArticle) => {
        createArticle.mutate({
            title: `${article.title} (コピー)`,
            slug: `${article.slug}-copy`,
            status: 'DRAFT',
        });
    };

    // Silent bulk handlers (no individual confirmation dialogs)
    const handleBulkDeleteSilent = (ids: string[]) => {
        ids.forEach(id => deleteArticle.mutate(id));
    };

    const handleBulkDeletePermanentSilent = (ids: string[]) => {
        ids.forEach(id => deleteArticlePermanent.mutate(id));
    };

    const handleBulkRestoreSilent = (ids: string[]) => {
        ids.forEach(id => restoreArticle.mutate(id));
    };

    const handleBulkSetDraftSilent = (ids: string[]) => {
        ids.forEach(id => {
            const article = articles.find(a => a.id === id);
            if (article) {
                updateArticle.mutate({ id, data: { status: 'DRAFT', version: article.version || 1 } });
            }
        });
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-white items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                <p className="mt-2 text-sm text-neutral-500">読み込み中...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col h-full bg-white items-center justify-center">
                <p className="text-sm text-red-500">データの読み込みに失敗しました</p>
                <p className="mt-1 text-xs text-neutral-400">{(error as Error).message}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header - Consistent with CategoriesView */}
            <header className="h-24 flex-none px-8 flex items-end justify-between pb-6 bg-white border-b border-neutral-100">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900">記事一覧</h1>
                    <p className="text-sm text-neutral-500 font-medium">公開済みの記事と下書きを管理します。</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={viewMode === 'active' ? 'default' : 'outline'}
                            className="h-10 rounded-full"
                            onClick={() => setViewMode('active')}
                        >
                            記事一覧
                        </Button>
                        <Button
                            variant={viewMode === 'trash' ? 'default' : 'outline'}
                            className="h-10 rounded-full"
                            onClick={() => setViewMode('trash')}
                        >
                            <Trash2 size={16} className="mr-2" />
                            ゴミ箱
                        </Button>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
                        <Input
                            placeholder="記事を検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-[300px] pl-11 h-12 bg-neutral-100 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 rounded-full text-sm font-medium transition-all"
                        />
                    </div>
                    <Button
                        variant={isReorderMode ? "default" : "outline"}
                        onClick={() => setIsReorderMode(!isReorderMode)}
                        className={cn(
                            "h-12 !px-5 rounded-full font-medium gap-2 transition-all",
                            isReorderMode
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "border-neutral-200 hover:bg-neutral-50"
                        )}
                    >
                        {isReorderMode ? (
                            <>
                                <Check size={16} />
                                完了
                            </>
                        ) : (
                            <>
                                <ArrowUpDown size={16} />
                                順番を変更
                            </>
                        )}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="h-12 !px-6 rounded-full bg-neutral-900 text-white font-bold hover:bg-neutral-800 shadow-sm gap-2">
                                新規作成
                                <ChevronDown size={16} className="text-neutral-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={onSwitchToStrategy} className="cursor-pointer py-2.5">
                                <Sparkles size={16} className="mr-2 text-purple-500" />
                                <span>AIで作成</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onNavigateToEditor()} className="cursor-pointer py-2.5">
                                <PenTool size={16} className="mr-2 text-neutral-500" />
                                <span>手動で作成</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <div className="flex-1 overflow-hidden flex flex-col relative bg-white">
                <ArticlesTable
                    data={filteredArticles}
                    onEdit={onNavigateToEditor}
                    userRole={userRole}
                    onPreview={onPreview}
                    onPublish={handlePublish}
                    onSchedule={handleSchedule}
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                    onDeletePermanent={handleDeletePermanent}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdatePublishedAt={handleUpdatePublishedAt}
                    onDuplicate={handleDuplicate}
                    isTrashView={viewMode === 'trash'}
                    onBulkDelete={handleBulkDeleteSilent}
                    onBulkDeletePermanent={handleBulkDeletePermanentSilent}
                    onBulkRestore={handleBulkRestoreSilent}
                    onBulkSetDraft={handleBulkSetDraftSilent}
                    onReorder={handleReorder}
                    isReorderMode={isReorderMode}
                />
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
                title={confirmDialog.title}
                description={confirmDialog.description}
                variant={confirmDialog.variant}
                confirmLabel={viewMode === 'trash' ? '完全に削除' : 'ゴミ箱へ移動'}
                onConfirm={confirmDialog.onConfirm}
                isLoading={deleteArticle.isPending || deleteArticlePermanent.isPending}
            />
        </div>
    );
}
