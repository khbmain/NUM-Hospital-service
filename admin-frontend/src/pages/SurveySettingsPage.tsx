import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { ClipboardCheck, Plus, Save, Trash2 } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/ToastProvider';
import { ACTIVE_SATISFACTION_SURVEY_TEMPLATE } from '../graphql/queries';
import { REMOVE_SATISFACTION_SURVEY_TEMPLATE, UPDATE_SATISFACTION_SURVEY_TEMPLATE } from '../graphql/mutations';

type QuestionForm = {
  key?: string;
  label: string;
  category: string;
  order: number;
  active: boolean;
};

type TemplateVersion = {
  version: number;
  title: string;
  validFrom: string;
  validTo?: string;
  questions: { key: string; active: boolean }[];
};

const emptyQuestion = (order: number): QuestionForm => ({
  label: '',
  category: 'Эмнэлгийн үйлчилгээ',
  order,
  active: true,
});

export default function SurveySettingsPage() {
  const { toast } = useToast();
  const { data, loading } = useQuery(ACTIVE_SATISFACTION_SURVEY_TEMPLATE);
  const [saveTemplate, { loading: saving }] = useMutation(UPDATE_SATISFACTION_SURVEY_TEMPLATE, {
    refetchQueries: [{ query: ACTIVE_SATISFACTION_SURVEY_TEMPLATE }],
  });
  const [removeTemplate, { loading: removing }] = useMutation(REMOVE_SATISFACTION_SURVEY_TEMPLATE, {
    refetchQueries: [{ query: ACTIVE_SATISFACTION_SURVEY_TEMPLATE }],
  });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const template = data?.getActiveSatisfactionSurveyTemplate;

  const formatDateTime = (value?: string) => {
    if (!value) return 'Одоо идэвхтэй';
    return new Date(value).toLocaleString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    const activeTemplate = data?.getActiveSatisfactionSurveyTemplate;
    if (!activeTemplate) return;
    setTitle(activeTemplate.title || '');
    setDescription(activeTemplate.description || '');
    setQuestions(
      [...activeTemplate.questions]
        .sort((a: QuestionForm, b: QuestionForm) => a.order - b.order)
        .map((question: QuestionForm, index: number) => ({ ...question, order: index + 1 }))
    );
  }, [data]);

  const updateQuestion = (index: number, patch: Partial<QuestionForm>) => {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question
      )
    );
  };

  const removeQuestion = (index: number) => {
    setQuestions((current) =>
      current
        .filter((_, questionIndex) => questionIndex !== index)
        .map((question, questionIndex) => ({ ...question, order: questionIndex + 1 }))
    );
  };

  const addQuestion = () => {
    setQuestions((current) => [...current, emptyQuestion(current.length + 1)]);
  };

  const removeOrArchive = async () => {
    const ok = window.confirm('Бөглөсөн хариултгүй бол шууд устгана. Хариулттай бол архивлана. Үргэлжлүүлэх үү?');
    if (!ok) return;

    try {
      const { data: result } = await removeTemplate();
      const payload = result?.removeSatisfactionSurveyTemplate;
      if (payload?.deleted) {
        toast('Судалгаа бөглөлтгүй байсан тул устгагдлаа', 'success');
      } else if (payload?.archived) {
        toast(`${payload.responseCount} бөглөлттэй тул судалгаа архивлагдлаа`, 'success');
      }
    } catch (err: any) {
      toast(err.message || 'Судалгаа устгах/архивлахад алдаа гарлаа', 'error');
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      toast('Судалгааны гарчиг оруулна уу', 'error');
      return;
    }

    const activeQuestions = questions.filter((question) => question.active);
    if (activeQuestions.length === 0) {
      toast('Идэвхтэй асуулт дор хаяж нэг байх ёстой', 'error');
      return;
    }

    if (questions.some((question) => !question.label.trim() || !question.category.trim())) {
      toast('Асуулт болон бүлгийн нэр хоосон байж болохгүй', 'error');
      return;
    }

    try {
      await saveTemplate({
        variables: {
          input: {
            title,
            description,
            questions: questions.map((question, index) => ({
              key: question.key,
              label: question.label,
              category: question.category,
              order: index + 1,
              active: question.active,
            })),
          },
        },
      });
      toast('Судалгааны асуултууд хадгалагдлаа', 'success');
    } catch (err: any) {
      toast(err.message || 'Судалгаа хадгалахад алдаа гарлаа', 'error');
    }
  };

  if (loading) return <LoadingSpinner text="Судалгаа ачааллаж байна..." />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <ClipboardCheck size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-display text-surface-900">Судалгааны тохиргоо</h1>
            <p className="text-sm text-surface-500">Patient portal дээр харагдах асуултуудыг засварлана.</p>
            {template && (
              <p className="mt-1 text-xs text-brand-700">Одоогийн хувилбар: v{template.currentVersion}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={removeOrArchive} disabled={removing} className="btn-secondary text-sm !text-red-600 hover:!border-red-200 hover:!bg-red-50">
            <Trash2 size={16} /> Устгах/Архивлах
          </button>
          <button type="button" onClick={addQuestion} className="btn-secondary text-sm">
            <Plus size={16} /> Асуулт нэмэх
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <section className="card space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-surface-500">Гарчиг</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="input-field" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-surface-500">Тайлбар</span>
              <input value={description} onChange={(event) => setDescription(event.target.value)} className="input-field" />
            </label>
          </div>
        </section>

        <section className="space-y-3">
          {questions.map((question, index) => (
            <div key={`${question.key || 'new'}-${index}`} className="card !p-4">
              <div className="grid gap-3 lg:grid-cols-[72px_1fr_220px_110px_40px] lg:items-end">
                <label>
                  <span className="mb-1 block text-xs font-medium text-surface-500">Дараалал</span>
                  <input
                    type="number"
                    value={index + 1}
                    readOnly
                    className="input-field bg-surface-50 text-center"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium text-surface-500">Асуулт</span>
                  <textarea
                    value={question.label}
                    onChange={(event) => updateQuestion(index, { label: event.target.value })}
                    className="input-field min-h-[46px]"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium text-surface-500">Бүлэг</span>
                  <input
                    value={question.category}
                    onChange={(event) => updateQuestion(index, { category: event.target.value })}
                    className="input-field"
                  />
                </label>
                <label className="flex h-[46px] items-center gap-2 rounded-xl border border-surface-300 px-3 text-sm text-surface-700">
                  <input
                    type="checkbox"
                    checked={question.active}
                    onChange={(event) => updateQuestion(index, { active: event.target.checked })}
                    className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-300"
                  />
                  Идэвхтэй
                </label>
                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                  title="Устгах"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            <Save size={16} /> Хадгалах
          </button>
        </div>
      </form>

      {template?.versions?.length > 0 && (
        <section className="card space-y-3">
          <div>
            <h2 className="text-lg font-display text-surface-900">Хувилбарын түүх</h2>
            <p className="text-sm text-surface-500">Асуулгын хувилбар бүр хэднээс хэдэн хүртэл ашиглагдсаныг хадгална.</p>
          </div>
          <div className="divide-y divide-surface-200">
            {[...template.versions]
              .sort((a: TemplateVersion, b: TemplateVersion) => b.version - a.version)
              .map((version: TemplateVersion) => (
                <div key={version.version} className="grid gap-2 py-3 text-sm md:grid-cols-[96px_1fr_160px] md:items-center">
                  <span className="font-semibold text-brand-700">v{version.version}</span>
                  <span className="text-surface-700">
                    {formatDateTime(version.validFrom)} - {formatDateTime(version.validTo)}
                  </span>
                  <span className="text-surface-500">
                    {version.questions.filter((question) => question.active).length} идэвхтэй асуулт
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
