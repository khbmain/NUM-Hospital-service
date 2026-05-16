type EmailDomainInputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  placeholder?: string;
  required?: boolean;
};

const emailDomains = ['@stud.num.edu.mn', '@num.edu.mn'];

function getEmailLocalPart(value: string) {
  return value.trim().split('@')[0] || '';
}

export default function EmailDomainInput({
  label = 'Имэйл',
  value,
  onChange,
  className,
  labelClassName = 'mb-1 block text-xs font-medium text-surface-600',
  inputClassName = 'input-field',
  placeholder = 'name',
  required,
}: EmailDomainInputProps) {
  const localPart = getEmailLocalPart(value);

  const applyDomain = (domain: string) => {
    if (!localPart) return;
    onChange(`${localPart}${domain}`);
  };

  return (
    <div className={className}>
      <label className={labelClassName}>{label}</label>
      <input
        type="email"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
        placeholder={placeholder}
        required={required}
      />
      <div className="mt-1 flex flex-wrap gap-1">
        {emailDomains.map((domain) => (
          <button
            key={domain}
            type="button"
            onClick={() => applyDomain(domain)}
            disabled={!localPart}
            className="rounded-md border border-surface-200 bg-white px-2 py-1 text-[10px] font-medium text-surface-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {domain}
          </button>
        ))}
      </div>
    </div>
  );
}
