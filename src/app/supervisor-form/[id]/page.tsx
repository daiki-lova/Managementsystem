'use client'

import React, { useState, useEffect, use } from 'react';
import { User, Calendar, Users, GraduationCap, BookOpen, Sparkles, Plus, Trash2, Loader2, Check, AlertCircle } from 'lucide-react';

// 型定義
interface Certification {
  name: string;
  year?: number;
  location?: string;
}

interface Episode {
  type: 'transformation' | 'student' | 'teaching' | 'other';
  title: string;
  content: string;
}

interface SupervisorData {
  id: string;
  name: string;
  slug: string;
  role: string;
  imageUrl?: string;
  bio?: string;
  careerStartYear?: number;
  teachingStartYear?: number;
  totalStudentsTaught?: number;
  graduatesCount?: number;
  weeklyLessons?: number;
  certifications?: Certification[];
  episodes?: Episode[];
  signaturePhrases?: string[];
  specialties?: string[];
  writingStyle?: 'formal' | 'casual' | 'professional';
  philosophy?: string;
  avoidWords?: string[];
  targetAudience?: string;
  teachingApproach?: string;
  influences?: string[];
  locationContext?: string;
}

export default function SupervisorFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [data, setData] = useState<SupervisorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'career' | 'personality'>('basic');

  // データ取得
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/supervisor-form/${id}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'データの取得に失敗しました');
        }
      } catch {
        setError('サーバーに接続できません');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // 保存
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/supervisor-form/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(result.error || '保存に失敗しました');
      }
    } catch {
      setError('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // ローディング表示
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-400 mx-auto" />
          <p className="mt-4 text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">エラー</h1>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const updateField = <K extends keyof SupervisorData>(field: K, value: SupervisorData[K]) => {
    setData({ ...data, [field]: value });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
              {data.imageUrl ? (
                <img src={data.imageUrl} alt={data.name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
              <p className="text-gray-500">{data.role || '監修者'}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              以下のフォームに情報を入力してください。入力された情報はAI記事生成に活用されます。
            </p>
            <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              💡 <span className="font-medium">わからない項目は空欄でOKです。</span>できる範囲で埋めていただければ大丈夫です。
            </p>
          </div>
        </div>

        {/* 成功メッセージ */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Check className="h-5 w-5 text-green-500" />
            <p className="text-green-700 font-medium">保存しました</p>
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit}>
          {/* タブナビゲーション */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {[
                  { id: 'basic', label: '基本情報' },
                  { id: 'career', label: 'キャリア・資格' },
                  { id: 'personality', label: 'パーソナリティ' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* 基本情報タブ */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        名前 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={data.name || ''}
                        onChange={(e) => updateField('name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 山田 花子"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">肩書き</label>
                      <input
                        type="text"
                        value={data.role || ''}
                        onChange={(e) => updateField('role', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: ヨガインストラクター"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">活動拠点</label>
                    <input
                      type="text"
                      value={data.locationContext || ''}
                      onChange={(e) => updateField('locationContext', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="例: 東京・渋谷区を中心に活動"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      自己紹介文（記事に使用されます）
                    </label>
                    <textarea
                      value={data.bio || ''}
                      onChange={(e) => updateField('bio', e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="読者に向けた自己紹介メッセージを入力してください。経歴や想いなど。"
                    />
                  </div>
                </div>
              )}

              {/* キャリア・資格タブ */}
              {activeTab === 'career' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      具体的な数字を入力することで、AIがより信頼性の高い記事を生成します。
                    </p>
                  </div>

                  {/* キャリアデータ */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> ヨガ開始年
                      </label>
                      <input
                        type="number"
                        min="1950"
                        max={new Date().getFullYear()}
                        value={data.careerStartYear || ''}
                        onChange={(e) => updateField('careerStartYear', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 2005"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" /> 指導開始年
                      </label>
                      <input
                        type="number"
                        min="1950"
                        max={new Date().getFullYear()}
                        value={data.teachingStartYear || ''}
                        onChange={(e) => updateField('teachingStartYear', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 2010"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Users className="h-4 w-4" /> 累計指導人数
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={data.totalStudentsTaught || ''}
                        onChange={(e) => updateField('totalStudentsTaught', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 5000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" /> 養成講座卒業生
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={data.graduatesCount || ''}
                        onChange={(e) => updateField('graduatesCount', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <BookOpen className="h-4 w-4" /> 週レッスン数
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={data.weeklyLessons || ''}
                        onChange={(e) => updateField('weeklyLessons', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 15"
                      />
                    </div>
                  </div>

                  {/* 専門分野 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      専門・得意分野（カンマ区切り）
                    </label>
                    <input
                      type="text"
                      value={data.specialties?.join(', ') || ''}
                      onChange={(e) => updateField('specialties', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="例: マタニティヨガ, シニアヨガ, リストラティブヨガ"
                    />
                  </div>

                  {/* 資格情報 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">保有資格</label>
                      <button
                        type="button"
                        onClick={() => updateField('certifications', [...(data.certifications || []), { name: '', year: undefined, location: '' }])}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4" /> 資格を追加
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(data.certifications || []).map((cert, idx) => (
                        <div key={idx} className="flex gap-3 items-start p-4 bg-gray-50 rounded-xl">
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={cert.name}
                              onChange={(e) => {
                                const newCerts = [...(data.certifications || [])];
                                newCerts[idx] = { ...newCerts[idx], name: e.target.value };
                                updateField('certifications', newCerts);
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="資格名 (例: RYT200)"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="number"
                                value={cert.year || ''}
                                onChange={(e) => {
                                  const newCerts = [...(data.certifications || [])];
                                  newCerts[idx] = { ...newCerts[idx], year: e.target.value ? parseInt(e.target.value) : undefined };
                                  updateField('certifications', newCerts);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="取得年"
                              />
                              <input
                                type="text"
                                value={cert.location || ''}
                                onChange={(e) => {
                                  const newCerts = [...(data.certifications || [])];
                                  newCerts[idx] = { ...newCerts[idx], location: e.target.value };
                                  updateField('certifications', newCerts);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="取得場所"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateField('certifications', (data.certifications || []).filter((_, i) => i !== idx))}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* エピソード */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">経験エピソード</label>
                      <button
                        type="button"
                        onClick={() => updateField('episodes', [...(data.episodes || []), { type: 'transformation', title: '', content: '' }])}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4" /> エピソードを追加
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(data.episodes || []).map((ep, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-xl space-y-3">
                          <div className="flex gap-3 items-center">
                            <select
                              value={ep.type}
                              onChange={(e) => {
                                const newEps = [...(data.episodes || [])];
                                newEps[idx] = { ...newEps[idx], type: e.target.value as Episode['type'] };
                                updateField('episodes', newEps);
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                            >
                              <option value="transformation">自身の変化</option>
                              <option value="student">生徒の変化</option>
                              <option value="teaching">指導での気づき</option>
                              <option value="other">その他</option>
                            </select>
                            <input
                              type="text"
                              value={ep.title}
                              onChange={(e) => {
                                const newEps = [...(data.episodes || [])];
                                newEps[idx] = { ...newEps[idx], title: e.target.value };
                                updateField('episodes', newEps);
                              }}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="タイトル"
                            />
                            <button
                              type="button"
                              onClick={() => updateField('episodes', (data.episodes || []).filter((_, i) => i !== idx))}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <textarea
                            value={ep.content}
                            onChange={(e) => {
                              const newEps = [...(data.episodes || [])];
                              newEps[idx] = { ...newEps[idx], content: e.target.value };
                              updateField('episodes', newEps);
                            }}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="エピソード内容..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* よく使うフレーズ */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">よく使うフレーズ</label>
                      <button
                        type="button"
                        onClick={() => updateField('signaturePhrases', [...(data.signaturePhrases || []), ''])}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4" /> 追加
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(data.signaturePhrases || []).map((phrase, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={phrase}
                            onChange={(e) => {
                              const newPhrases = [...(data.signaturePhrases || [])];
                              newPhrases[idx] = e.target.value;
                              updateField('signaturePhrases', newPhrases);
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="例: 呼吸を大切に"
                          />
                          <button
                            type="button"
                            onClick={() => updateField('signaturePhrases', (data.signaturePhrases || []).filter((_, i) => i !== idx))}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* パーソナリティタブ */}
              {activeTab === 'personality' && (
                <div className="space-y-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <p className="text-sm text-purple-700 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      パーソナリティ設定は、AI検知を下げ「この人らしさ」を出すために重要です。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">文体スタイル</label>
                      <select
                        value={data.writingStyle || ''}
                        onChange={(e) => updateField('writingStyle', e.target.value as SupervisorData['writingStyle'] || undefined)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">選択してください</option>
                        <option value="formal">丁寧・フォーマル</option>
                        <option value="casual">親しみやすい・カジュアル</option>
                        <option value="professional">専門的・プロフェッショナル</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">主な指導対象</label>
                      <input
                        type="text"
                        value={data.targetAudience || ''}
                        onChange={(e) => updateField('targetAudience', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 20〜40代の働く女性、シニア層、初心者"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">指導理念・信念</label>
                    <textarea
                      value={data.philosophy || ''}
                      onChange={(e) => updateField('philosophy', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="なぜヨガを教えるのか、大切にしていることなど"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">指導スタイル</label>
                      <input
                        type="text"
                        value={data.teachingApproach || ''}
                        onChange={(e) => updateField('teachingApproach', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 寄り添い型、理論重視、実践重視"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        影響を受けた先生・流派（カンマ区切り）
                      </label>
                      <input
                        type="text"
                        value={data.influences?.join(', ') || ''}
                        onChange={(e) => updateField('influences', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 綿本彰, アイアンガーヨガ"
                      />
                    </div>
                  </div>

                  {/* 使わない言葉 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">使わない言葉・表現（AIっぽさを避ける）</label>
                      <button
                        type="button"
                        onClick={() => updateField('avoidWords', [...(data.avoidWords || []), ''])}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4" /> 追加
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(data.avoidWords || []).map((word, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={word}
                            onChange={(e) => {
                              const newWords = [...(data.avoidWords || [])];
                              newWords[idx] = e.target.value;
                              updateField('avoidWords', newWords);
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="例: 是非、まさに、実際に"
                          />
                          <button
                            type="button"
                            onClick={() => updateField('avoidWords', (data.avoidWords || []).filter((_, i) => i !== idx))}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {['是非', 'まさに', '実際に', 'いかがでしょうか', '〜と言えるでしょう'].map((word) => (
                        <button
                          key={word}
                          type="button"
                          className="text-xs px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full hover:bg-gray-200 transition-colors"
                          onClick={() => {
                            if (!(data.avoidWords || []).includes(word)) {
                              updateField('avoidWords', [...(data.avoidWords || []), word]);
                            }
                          }}
                        >
                          + {word}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 送信ボタン */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存する'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* フッター */}
        <p className="mt-6 text-center text-sm text-gray-400">
          入力された情報はAI記事生成に活用されます
        </p>
      </div>
    </div>
  );
}
