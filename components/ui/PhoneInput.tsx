"use client";

import { useState, useRef, useEffect } from "react";

export interface PhoneValue {
  prefix: string;
  number: string;
}

interface Props {
  value: PhoneValue;
  onChange: (val: PhoneValue) => void;
}

const COUNTRY_CODES = [
  { flag: "🇦🇷", name: "Argentina",        dial: "+54"  },
  { flag: "🇺🇾", name: "Uruguay",           dial: "+598" },
  { flag: "🇧🇷", name: "Brasil",            dial: "+55"  },
  { flag: "🇨🇱", name: "Chile",             dial: "+56"  },
  { flag: "🇵🇾", name: "Paraguay",          dial: "+595" },
  { flag: "🇧🇴", name: "Bolivia",           dial: "+591" },
  { flag: "🇵🇪", name: "Perú",              dial: "+51"  },
  { flag: "🇨🇴", name: "Colombia",          dial: "+57"  },
  { flag: "🇻🇪", name: "Venezuela",         dial: "+58"  },
  { flag: "🇪🇨", name: "Ecuador",           dial: "+593" },
  { flag: "🇲🇽", name: "México",            dial: "+52"  },
  { flag: "🇨🇺", name: "Cuba",              dial: "+53"  },
  { flag: "🇩🇴", name: "R. Dominicana",     dial: "+1809"},
  { flag: "🇬🇹", name: "Guatemala",         dial: "+502" },
  { flag: "🇨🇷", name: "Costa Rica",        dial: "+506" },
  { flag: "🇵🇦", name: "Panamá",            dial: "+507" },
  { flag: "🇪🇸", name: "España",            dial: "+34"  },
  { flag: "🇺🇸", name: "EE.UU.",            dial: "+1"   },
  { flag: "🇨🇦", name: "Canadá",            dial: "+1"   },
  { flag: "🇬🇧", name: "Reino Unido",       dial: "+44"  },
  { flag: "🇩🇪", name: "Alemania",          dial: "+49"  },
  { flag: "🇫🇷", name: "Francia",           dial: "+33"  },
  { flag: "🇮🇹", name: "Italia",            dial: "+39"  },
  { flag: "🇵🇹", name: "Portugal",          dial: "+351" },
  { flag: "🇨🇳", name: "China",             dial: "+86"  },
  { flag: "🇯🇵", name: "Japón",             dial: "+81"  },
  { flag: "🇰🇷", name: "Corea del Sur",     dial: "+82"  },
  { flag: "🇮🇳", name: "India",             dial: "+91"  },
  { flag: "🇦🇺", name: "Australia",         dial: "+61"  },
  { flag: "🇿🇦", name: "Sudáfrica",         dial: "+27"  },
  { flag: "🇳🇬", name: "Nigeria",           dial: "+234" },
  { flag: "🇲🇦", name: "Marruecos",         dial: "+212" },
  { flag: "🇷🇺", name: "Rusia",             dial: "+7"   },
];

export default function PhoneInput({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = COUNTRY_CODES.find((c) => c.dial === value.prefix) ?? COUNTRY_CODES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex gap-2">
      {/* Custom prefix dropdown */}
      <div ref={ref} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={[
            "h-11 px-3 rounded-md flex items-center gap-1.5",
            "border border-border bg-card",
            "text-sm text-primary",
            "focus:outline-none focus:border-brand",
            "transition-colors duration-150",
            "whitespace-nowrap",
          ].join(" ")}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="text-lg leading-none">{selected.flag}</span>
          <span className="text-secondary">{selected.dial}</span>
          <svg className="w-3 h-3 text-tertiary ml-0.5" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {open && (
          <ul
            role="listbox"
            className={[
              "absolute z-50 left-0 top-12",
              "w-56 max-h-64 overflow-y-auto",
              "rounded-md border border-border bg-card shadow-lg",
              "py-1",
            ].join(" ")}
          >
            {COUNTRY_CODES.map((c) => (
              <li
                key={`${c.name}-${c.dial}`}
                role="option"
                aria-selected={c.dial === value.prefix && c.name === selected.name}
                onClick={() => {
                  onChange({ ...value, prefix: c.dial });
                  setOpen(false);
                }}
                className={[
                  "flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm",
                  "hover:bg-surface transition-colors",
                  c.dial === value.prefix && c.name === selected.name
                    ? "text-brand font-semibold"
                    : "text-primary",
                ].join(" ")}
              >
                <span className="text-xl leading-none">{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-secondary text-xs">{c.dial}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Number input */}
      <input
        type="tel"
        value={value.number}
        onChange={(e) => onChange({ ...value, number: e.target.value })}
        placeholder="11 1234-5678"
        autoComplete="tel-national"
        className={[
          "flex-1 h-11 px-4 rounded-md",
          "border border-border bg-card",
          "text-sm text-primary placeholder:text-tertiary",
          "focus:outline-none focus:border-brand",
          "transition-colors duration-150",
        ].join(" ")}
      />
    </div>
  );
}
