import { Question } from '../../types';
import { Modal } from '../Modal';

export function QuestionDetailDialog({ question, onClose }: { question: Question | null; onClose: () => void }) {
  const rich = question?.contentRich && typeof question.contentRich === 'object' && 'html' in question.contentRich ? String((question.contentRich as { html?: string }).html || '') : '';
  return <Modal isOpen={Boolean(question)} onClose={onClose} title={question?.code || 'Chi tiết câu hỏi'}>{question && <div className="space-y-5">
    <div><div className="font-semibold leading-6">{rich ? <div dangerouslySetInnerHTML={{ __html: rich }} /> : question.content}</div><p className="mt-2 text-sm text-slate-500">{question.subject?.subjectName} · {question.chapter?.name}</p></div>
    {question.media?.length ? <div className="flex flex-wrap gap-3">{question.media.map(media => <img key={media.id || media.url} src={media.url} alt={media.altText || media.fileName} className="max-h-64 max-w-full rounded-xl border object-contain" />)}</div> : null}
    <div className="space-y-2">{question.options?.map(o => <div key={o.id || o.order} className={`rounded-xl border p-3 ${o.isCorrect ? 'border-emerald-300 bg-emerald-50' : ''}`}><b>{o.label}.</b> {o.content}{o.media?.length ? <div className="mt-2 flex gap-2">{o.media.map(media => <img key={media.id || media.url} src={media.url} alt={media.altText || media.fileName} className="h-20 rounded border object-contain" />)}</div> : null}</div>)}</div>
    {question.explanation && <div className="rounded-xl bg-slate-50 p-3 text-sm"><b>Giải thích:</b> {question.explanation}</div>}
    <div className="border-t pt-4 text-sm"><b>Thống kê:</b> {question.statistic?.usedCount ? `${question.statistic.usedCount} lần sử dụng; tỷ lệ đúng ${question.statistic.correctRate == null ? 'chưa có' : `${Math.round(question.statistic.correctRate * 100)}%`}` : 'Chưa sử dụng'}</div>
  </div>}</Modal>;
}
