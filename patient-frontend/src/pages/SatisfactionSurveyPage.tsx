import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardCheck, Send } from 'lucide-react';
import { ACTIVE_SATISFACTION_SURVEY_TEMPLATE, MY_SATISFACTION_SURVEY, MY_SATISFACTION_SURVEY_REQUIREMENT } from '../graphql/queries';
import { SUBMIT_SATISFACTION_SURVEY } from '../graphql/mutations';
import { useToast } from '../components/common/ToastProvider';
import LoadingSpinner from '../components/common/LoadingSpinner';

const serviceOptions = [
  { value: 'doctor_consultation', label: 'Эмчид үзүүлж зөвлөгөө авсан' },
  { value: 'injection', label: 'Тариа эмчилгээ' },
  { value: 'physical_therapy', label: 'Физик эмчилгээ' },
  { value: 'dressing', label: 'Боолт' },
];

const scoreLabels = ['Огт хангалтгүй', 'Хангалтгүй', 'Дундаж', 'Хангалттай', 'Хангалттай сайн'];

type SurveyQuestion = {
  key: string;
  label: string;
  category: string;
  order: number;
  active: boolean;
};

type FormState = {
  occupation: string;
  studentHousing: string;
  hasVisited: string;
  visitFrequency: string;
  servicesReceived: string[];
  wouldReturn: string;
  wouldReturnReason: string;
  improvementSuggestion: string;
  ratings: Record<string, number>;
  overallRating: number;
};

const initialForm: FormState = {
  occupation: '',
  studentHousing: '',
  hasVisited: '',
  visitFrequency: '',
  servicesReceived: [],
  wouldReturn: '',
  wouldReturnReason: '',
  improvementSuggestion: '',
  ratings: {},
  overallRating: 0,
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-display text-surface-900">{children}</h2>;
}

function RadioPill({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
      checked ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-surface-300 bg-white text-surface-600 hover:bg-surface-50'
    }`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      {children}
    </label>
  );
}

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (score: number) => void;
}) {
  return (
    <div className="grid gap-3 border-b border-surface-200 py-4 last:border-0 md:grid-cols-[1fr_auto] md:items-center">
      <p className="text-sm font-medium text-surface-800">{label}</p>
      <div className="grid grid-cols-5 gap-1">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            title={scoreLabels[score - 1]}
            className={`h-10 w-10 rounded-lg border text-sm font-semibold transition-colors ${
              value === score
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-surface-300 bg-white text-surface-600 hover:bg-surface-50'
            }`}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SatisfactionSurveyPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data } = useQuery(MY_SATISFACTION_SURVEY);
  const { data: templateData, loading: templateLoading } = useQuery(ACTIVE_SATISFACTION_SURVEY_TEMPLATE);
  const [submitSurvey, { loading }] = useMutation(SUBMIT_SATISFACTION_SURVEY, {
    refetchQueries: [
      { query: MY_SATISFACTION_SURVEY },
      { query: MY_SATISFACTION_SURVEY_REQUIREMENT },
    ],
  });
  const [form, setForm] = useState<FormState>(initialForm);
  const template = templateData?.getActiveSatisfactionSurveyTemplate;
  const ratingQuestions: SurveyQuestion[] = useMemo(
    () => [...(template?.questions || [])].filter((question: SurveyQuestion) => question.active).sort((a: SurveyQuestion, b: SurveyQuestion) => a.order - b.order),
    [template]
  );

  const groupedQuestions = useMemo(() => {
    return ratingQuestions.reduce<Record<string, SurveyQuestion[]>>((groups, question) => {
      groups[question.category] ||= [];
      groups[question.category].push(question);
      return groups;
    }, {});
  }, [ratingQuestions]);

  const toggleService = (value: string) => {
    setForm((current) => ({
      ...current,
      servicesReceived: current.servicesReceived.includes(value)
        ? current.servicesReceived.filter((item) => item !== value)
        : [...current.servicesReceived, value],
    }));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.occupation || !form.hasVisited || !form.wouldReturn) {
      toast('Ерөнхий асуултуудыг бүрэн бөглөнө үү', 'error');
      return;
    }

    if (ratingQuestions.some((question) => !form.ratings[question.key]) || !form.overallRating) {
      toast('Үйлчилгээний чанарын бүх үнэлгээг 1-5 оноогоор бөглөнө үү', 'error');
      return;
    }

    try {
      await submitSurvey({
        variables: {
          input: {
            occupation: form.occupation,
            studentHousing: form.studentHousing || '',
            hasVisited: form.hasVisited === 'yes',
            visitFrequency: form.visitFrequency || '',
            servicesReceived: form.servicesReceived,
            wouldReturn: form.wouldReturn === 'yes',
            wouldReturnReason: form.wouldReturnReason || undefined,
            improvementSuggestion: form.improvementSuggestion || undefined,
            ratings: ratingQuestions.map((question) => ({
              key: question.key,
              label: question.label,
              category: question.category,
              score: form.ratings[question.key],
            })),
            overallRating: form.overallRating,
          },
        },
      });
      setForm(initialForm);
      toast('Судалгаанд оролцсонд баярлалаа', 'success');
      const next = params.get('next');
      if (next) navigate(next, { replace: true });
    } catch (err: any) {
      toast(err.message || 'Судалгаа илгээхэд алдаа гарлаа', 'error');
    }
  };

  const latestSurvey = data?.getMySatisfactionSurvey;

  if (templateLoading) return <LoadingSpinner text="Судалгаа ачааллаж байна..." />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          <ClipboardCheck size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-display text-surface-900">{template?.title || 'Сэтгэл ханамжийн судалгаа'}</h1>
          <p className="mt-1 text-sm text-surface-500">
            {template?.description || 'Таны хариулт эмнэлгийн үйлчилгээний чанарыг сайжруулахад ашиглагдана.'}
          </p>
          {latestSurvey && (
            <p className="mt-2 text-xs text-emerald-700">
              Сүүлд бөглөсөн: {new Date(latestSurvey.createdAt).toLocaleDateString('mn-MN')}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={save} className="space-y-5">
        <section className="card space-y-4">
          <SectionTitle>Нэг. Ерөнхий асуултууд</SectionTitle>

          <div className="space-y-2">
            <p className="text-sm font-medium text-surface-700">Таны эрхэлдэг ажил юу вэ?</p>
            <div className="flex flex-wrap gap-2">
              <RadioPill name="occupation" value="teacher" checked={form.occupation === 'teacher'} onChange={(occupation) => setForm({ ...form, occupation })}>Багш</RadioPill>
              <RadioPill name="occupation" value="student" checked={form.occupation === 'student'} onChange={(occupation) => setForm({ ...form, occupation })}>Оюутан</RadioPill>
              <RadioPill name="occupation" value="staff" checked={form.occupation === 'staff'} onChange={(occupation) => setForm({ ...form, occupation })}>Ажилтан</RadioPill>
            </div>
          </div>

          {form.occupation === 'student' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-surface-700">Оюутан бол хаана амьдардаг вэ?</p>
              <div className="flex flex-wrap gap-2">
                <RadioPill name="studentHousing" value="dormitory" checked={form.studentHousing === 'dormitory'} onChange={(studentHousing) => setForm({ ...form, studentHousing })}>Оюутны байр</RadioPill>
                <RadioPill name="studentHousing" value="home" checked={form.studentHousing === 'home'} onChange={(studentHousing) => setForm({ ...form, studentHousing })}>Гэртээ</RadioPill>
                <RadioPill name="studentHousing" value="rental" checked={form.studentHousing === 'rental'} onChange={(studentHousing) => setForm({ ...form, studentHousing })}>Түрээсийн байр</RadioPill>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-surface-700">Та МУИС-ийн эмнэлгээр үйлчлүүлж байсан уу?</p>
              <div className="flex flex-wrap gap-2">
                <RadioPill name="hasVisited" value="yes" checked={form.hasVisited === 'yes'} onChange={(hasVisited) => setForm({ ...form, hasVisited })}>Тийм</RadioPill>
                <RadioPill name="hasVisited" value="no" checked={form.hasVisited === 'no'} onChange={(hasVisited) => setForm({ ...form, hasVisited })}>Үгүй</RadioPill>
              </div>
            </div>

            {form.hasVisited === 'yes' && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-surface-700">Та хэдэн удаа үйлчлүүлсэн бэ?</p>
                <div className="flex flex-wrap gap-2">
                  <RadioPill name="visitFrequency" value="once" checked={form.visitFrequency === 'once'} onChange={(visitFrequency) => setForm({ ...form, visitFrequency })}>1 удаа</RadioPill>
                  <RadioPill name="visitFrequency" value="multiple" checked={form.visitFrequency === 'multiple'} onChange={(visitFrequency) => setForm({ ...form, visitFrequency })}>1-ээс дээш</RadioPill>
                  <RadioPill name="visitFrequency" value="regular" checked={form.visitFrequency === 'regular'} onChange={(visitFrequency) => setForm({ ...form, visitFrequency })}>Байнгын</RadioPill>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-surface-700">Та ямар үйлчилгээ авч байсан бэ?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {serviceOptions.map((option) => (
                <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm text-surface-700 hover:bg-surface-50">
                  <input
                    type="checkbox"
                    checked={form.servicesReceived.includes(option.value)}
                    onChange={() => toggleService(option.value)}
                    className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-300"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-surface-700">Танд МУИС-ийн эмнэлгээр дахин үйлчлүүлэх сэтгэгдэл төрсөн үү?</p>
            <div className="flex flex-wrap gap-2">
              <RadioPill name="wouldReturn" value="yes" checked={form.wouldReturn === 'yes'} onChange={(wouldReturn) => setForm({ ...form, wouldReturn })}>Тийм</RadioPill>
              <RadioPill name="wouldReturn" value="no" checked={form.wouldReturn === 'no'} onChange={(wouldReturn) => setForm({ ...form, wouldReturn })}>Үгүй</RadioPill>
            </div>
          </div>

          {form.wouldReturn === 'no' && (
            <textarea
              value={form.wouldReturnReason}
              onChange={(e) => setForm({ ...form, wouldReturnReason: e.target.value })}
              className="input-field min-h-[90px]"
              placeholder="Шалтгаанаа тодорхой бичнэ үү"
            />
          )}

          <textarea
            value={form.improvementSuggestion}
            onChange={(e) => setForm({ ...form, improvementSuggestion: e.target.value })}
            className="input-field min-h-[120px]"
            placeholder="Цаашид анхаарах, сайжруулах санал хүсэлтээ бичнэ үү"
          />
        </section>

        <section className="card space-y-3">
          <div>
            <SectionTitle>Хоёр. Эмнэлгийн үйлчилгээний чанар</SectionTitle>
            <p className="mt-1 text-xs text-surface-500">1 = огт хангалтгүй, 5 = хангалттай сайн</p>
          </div>

          {Object.entries(groupedQuestions).map(([category, questions]) => (
            <div key={category} className="rounded-xl bg-surface-50 px-4">
              <h3 className="pt-4 text-sm font-semibold text-brand-700">{category}</h3>
              {questions.map((question) => (
                <RatingRow
                  key={question.key}
                  label={question.label}
                  value={form.ratings[question.key]}
                  onChange={(score) => setForm({ ...form, ratings: { ...form.ratings, [question.key]: score } })}
                />
              ))}
            </div>
          ))}

          <div className="rounded-xl border border-brand-100 bg-brand-50 px-4">
            <RatingRow
              label="МУИС-ийн эмнэлгийн үйлчилгээний чанарт өгөх ерөнхий үнэлгээ"
              value={form.overallRating || undefined}
              onChange={(overallRating) => setForm({ ...form, overallRating })}
            />
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary">
            <Send size={16} /> Илгээх
          </button>
        </div>
      </form>
    </div>
  );
}
