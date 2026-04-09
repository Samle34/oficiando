"use client";

export interface PhoneValue {
  prefix: string;
  number: string;
}

interface Props {
  value: PhoneValue;
  onChange: (val: PhoneValue) => void;
}

const COUNTRY_CODES = [
  { flag: "🇦🇷", name: "Argentina",   dial: "+54"  },
  { flag: "🇺🇾", name: "Uruguay",     dial: "+598" },
  { flag: "🇧🇷", name: "Brasil",      dial: "+55"  },
  { flag: "🇨🇱", name: "Chile",       dial: "+56"  },
  { flag: "🇵🇾", name: "Paraguay",    dial: "+595" },
  { flag: "🇧🇴", name: "Bolivia",     dial: "+591" },
  { flag: "🇵🇪", name: "Perú",        dial: "+51"  },
  { flag: "🇨🇴", name: "Colombia",    dial: "+57"  },
  { flag: "🇻🇪", name: "Venezuela",   dial: "+58"  },
  { flag: "🇪🇨", name: "Ecuador",     dial: "+593" },
  { flag: "🇲🇽", name: "México",      dial: "+52"  },
  { flag: "🇨🇺", name: "Cuba",        dial: "+53"  },
  { flag: "🇩🇴", name: "R. Dominicana", dial: "+1809" },
  { flag: "🇬🇹", name: "Guatemala",   dial: "+502" },
  { flag: "🇨🇷", name: "Costa Rica",  dial: "+506" },
  { flag: "🇵🇦", name: "Panamá",      dial: "+507" },
  { flag: "🇪🇸", name: "España",      dial: "+34"  },
  { flag: "🇺🇸", name: "EE.UU.",      dial: "+1"   },
  { flag: "🇨🇦", name: "Canadá",      dial: "+1"   },
  { flag: "🇬🇧", name: "Reino Unido", dial: "+44"  },
  { flag: "🇩🇪", name: "Alemania",    dial: "+49"  },
  { flag: "🇫🇷", name: "Francia",     dial: "+33"  },
  { flag: "🇮🇹", name: "Italia",      dial: "+39"  },
  { flag: "🇵🇹", name: "Portugal",    dial: "+351" },
  { flag: "🇨🇳", name: "China",       dial: "+86"  },
  { flag: "🇯🇵", name: "Japón",       dial: "+81"  },
  { flag: "🇰🇷", name: "Corea del Sur", dial: "+82" },
  { flag: "🇮🇳", name: "India",       dial: "+91"  },
  { flag: "🇦🇺", name: "Australia",   dial: "+61"  },
  { flag: "🇿🇦", name: "Sudáfrica",   dial: "+27"  },
  { flag: "🇳🇬", name: "Nigeria",     dial: "+234" },
  { flag: "🇲🇦", name: "Marruecos",   dial: "+212" },
  { flag: "🇷🇺", name: "Rusia",       dial: "+7"   },
];

const inputClass = [
  "h-11 px-3 rounded-md",
  "border border-border bg-card",
  "text-sm text-primary",
  "focus:outline-none focus:border-brand",
  "transition-colors duration-150",
].join(" ");

export default function PhoneInput({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      <select
        value={value.prefix}
        onChange={(e) => onChange({ ...value, prefix: e.target.value })}
        className={`${inputClass} w-28 shrink-0 cursor-pointer`}
        aria-label="Prefijo de país"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={`${c.name}-${c.dial}`} value={c.dial}>
            {c.flag} {c.dial}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={value.number}
        onChange={(e) => onChange({ ...value, number: e.target.value })}
        placeholder="11 1234-5678"
        autoComplete="tel-national"
        className={`${inputClass} flex-1`}
      />
    </div>
  );
}
