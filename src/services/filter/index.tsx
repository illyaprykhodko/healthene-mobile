// outsource dependencies
import React, { memo, PropsWithChildren } from 'react';
// local dependencies
import Text from '../../components/Text';

/** ---------- Types ---------- */

type Primitive = string | number;

export interface TruncateOptions {
  length?: number;
  end?: string;
  breakOnWord?: boolean;
}

export interface RoundDigitsOptions {
  digits: number;
}

export type FilterInput = Primitive;

export type FilterFn<O = unknown> = (value: FilterInput, options?: O) => string | number;

export interface FiltersMap {
  enum: FilterFn;
  humanize: FilterFn;
  sanitize: FilterFn;
  truncate: FilterFn<TruncateOptions>;
  feetToMiles: (ft: number) => number;
  timeFormat: (seconds: number) => string;
  centimetersToFeet: (cm: number) => string;             // kept string for backward-compat
  feetToCentimeters: (ft: number) => string;             // kept string for backward-compat
  kilogramsToPounds: (kg: number) => number;
  poundsToKilograms: (lbs: number) => number;
  lbsToBMI: (lb: number, ft: number) => number;
  decimalsToFractions: (num: number) => string;
  BMIToLbs: (BMI: number, ft: number) => number;
  convertBloodGlucose: (mmolL: number) => number;
  formatBytes: (bytes: number, decimals?: number) => string;
  roundDigitsAfterComma: (num: number, digits: number) => number;
}

/** Public enum-like mapping (stable keys for consumers) */
export const FILTER_TYPE = Object.freeze({
    ENUM: 'enum',
    TRUNCATE: 'truncate',
    HUMANIZE: 'humanize',
    SANITIZE: 'sanitize',
    BMITOLBS: 'BMIToLbs',
    LBSTOBMI: 'lbsToBMI',
    TIMEFORMAT: 'timeFormat',
    FORMATBYTES: 'formatBytes',
    FEETTOMILES: 'feetToMiles',
    CENTIMETERSTOFEET: 'centimetersToFeet',
    FEETTOCENTIMETERS: 'feetToCentimeters',
    KILOGRAMSTOPounds: 'kilogramsToPounds',
    POUNDSTOKILOGRAMS: 'poundsToKilograms',
    CONVERTBLOODGLUCOSE: 'convertBloodGlucose',
    DECIMALSTOFRACTIONS: 'decimalsToFractions',
    ROUNDDIGITSAFTERCOMMA: 'roundDigitsAfterComma',
} as const);

export type FilterType = typeof FILTER_TYPE[keyof typeof FILTER_TYPE];

/** ---------- Filter functions (tree-shakable) ---------- */

// 1) Sanitize
export const sanitize: FiltersMap['sanitize'] = (str = '') =>
    String(str)
        .replace(/(<([^>]+)>)/gi, '')  // strip HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/\n/g, '');

// 2) Humanize (ENUM/camelCase/slug → Pretty)
export const humanize: FiltersMap['humanize'] = str =>
    String(str)
        .replace(/([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g, '$1$4 $2$3$5')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^\s*|\s*$/g, '')
        .toLowerCase()
        .replace(/^.{1}/, sib => sib.toUpperCase());

// 3) To ENUM (UPPER_SNAKE)
export const toEnum: FiltersMap['enum'] = (str = '') =>
    String(str)
        .replace(/[^\w\d\s]/gi, '')
        .replace(/\s+/g, '_')
        .toUpperCase();

// 4) Truncate
export const truncate: FiltersMap['truncate'] = (
    source,
    { length = 10, end = '...', breakOnWord = false }: TruncateOptions = {}
) => {
    const s = String(source);
    if (!Number.isFinite(length) || length <= 0 || s.length <= length) { return s; }
    let cut = s.substring(0, length);
    if (!breakOnWord) {
        const lastSpace = cut.lastIndexOf(' ');
        if (lastSpace !== -1) { cut = cut.substring(0, lastSpace); }
    }
    return cut.trim() + end;
};

// 5) Unit conversions
export const centimetersToFeet: FiltersMap['centimetersToFeet'] = cm =>
    (cm / 30.48).toFixed(3);

export const feetToCentimeters: FiltersMap['feetToCentimeters'] = ft =>
    (ft * 30.48).toFixed(1);

export const kilogramsToPounds: FiltersMap['kilogramsToPounds'] = kg =>
    Math.round(kg * 2.205);

export const poundsToKilograms: FiltersMap['poundsToKilograms'] = lbs =>
    lbs / 2.205;

export const BMIToLbs: FiltersMap['BMIToLbs'] = (BMI, ft) =>
    BMI * Math.pow(ft * 12, 2) / 703;

export const lbsToBMI: FiltersMap['lbsToBMI'] = (lb, ft) =>
    703 * lb / Math.pow(ft * 12, 2);

export const feetToMiles: FiltersMap['feetToMiles'] = ft =>
    Number((ft * 0.00018939).toFixed(2));

export const convertBloodGlucose: FiltersMap['convertBloodGlucose'] = value =>
    Number((value * 18.0182).toFixed(2));

// 6) Fractions (robust matching with tolerance)
const FRACTIONS: Array<{ value: number; glyph: string }> = [
    { value: 1 / 8, glyph: '⅛' },
    { value: 1 / 4, glyph: '¼' },
    { value: 1 / 3, glyph: '⅓' },
    { value: 1 / 2, glyph: '½' },
    { value: 2 / 3, glyph: '⅔' },
    { value: 3 / 4, glyph: '¾' },
];

export const decimalsToFractions: FiltersMap['decimalsToFractions'] = num => {
    if (!Number.isFinite(num)) { return String(num); }
    if (Number.isInteger(num)) { return String(num); }

    const integer = Math.trunc(num);
    const frac = Math.abs(num - integer);
    const tolerance = 0.02; // ~2% neighborhood

    let best = FRACTIONS[0];
    let bestDelta = Infinity;

    for (const f of FRACTIONS) {
        const delta = Math.abs(frac - f.value);
        if (delta < bestDelta) {
            best = f;
            bestDelta = delta;
        }
    }

    if (bestDelta <= tolerance) {
        return integer ? `${integer} ${best.glyph}` : best.glyph;
    }
    // Fallback to trimmed decimal
    const rounded = Math.round(num * 100) / 100;
    return String(rounded);
};

// 7) Time format HH:MM:SS
export const timeFormat: FiltersMap['timeFormat'] = seconds => {
    const t = Math.max(0, Math.floor(seconds));
    const h = String(Math.floor(t / 3600)).padStart(2, '0');
    const m = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
    const s = String(t % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
};

// 8) Bytes → Human
export const formatBytes: FiltersMap['formatBytes'] = (bytes, decimals = 2) => {
    if (!Number.isFinite(bytes) || bytes <= 0) { return '0 Bytes'; }
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// 9) Rounding
export const roundDigitsAfterComma: FiltersMap['roundDigitsAfterComma'] = (number, digits) =>
    Math.round(number * Math.pow(10, digits)) / Math.pow(10, digits);

/** ---------- Aggregated map (for component usage) ---------- */

export const filters: FiltersMap = {
    enum: toEnum,
    truncate,
    humanize,
    sanitize,
    BMIToLbs,
    lbsToBMI,
    timeFormat,
    formatBytes,
    feetToMiles,
    centimetersToFeet,
    feetToCentimeters,
    kilogramsToPounds,
    poundsToKilograms,
    convertBloodGlucose,
    decimalsToFractions,
    roundDigitsAfterComma,
};

/** ---------- <Filter/> component ---------- */

export interface FilterProps<O = unknown> extends PropsWithChildren<{}> {
  /** Filter type (use FILTER_TYPE.*) */
  type?: FilterType;
  /** Either pass `text` or children (string/number). `text` wins if both provided */
  text?: Primitive;
  /** Options passed to the filter */
  options?: O;
  /** Additional props forwarded to Text component */
  [attr: string]: any; // preserve Text's attrs
}

// Helper: resolve value
const getValue = (text?: Primitive, children?: React.ReactNode): Primitive => {
    if (typeof text === 'string' || typeof text === 'number') { return text; }
    if (typeof children === 'string' || typeof children === 'number') { return children; }
    return '';
};

// Functional, memoized component
export const Filter: React.FC<FilterProps> = memo(({ type = FILTER_TYPE.HUMANIZE, text, children, options, ...attr }) => {
    const value = getValue(text, children);
    const fn = (filters as Record<string, any>)[type];
    if (typeof fn !== 'function') {
        return <Text {...attr}>{`Incorrect filter type ${String(type)}`}</Text>;
    }
    const result = fn(value, options);
    return <Text {...attr}>{String(result)}</Text>;
});

Filter.displayName = 'Filter';

/** ---------- Shortcuts ---------- */
export const Enum: React.FC<FilterProps> = p => <Filter {...p} type={FILTER_TYPE.ENUM} />;
export const Humanize: React.FC<FilterProps> = p => <Filter {...p} type={FILTER_TYPE.HUMANIZE} />;
export const Sanitize: React.FC<FilterProps> = p => <Filter {...p} type={FILTER_TYPE.SANITIZE} />;
export const TimeFormat: React.FC<FilterProps<number>> = p => <Filter {...p} type={FILTER_TYPE.TIMEFORMAT} />;
export const FormatBytes: React.FC<FilterProps<number>> = p => <Filter {...p} type={FILTER_TYPE.FORMATBYTES} />;
export const Truncate: React.FC<FilterProps<TruncateOptions>> = p => <Filter {...p} type={FILTER_TYPE.TRUNCATE} />;
export const Fractions: React.FC<FilterProps<number>> = p => <Filter {...p} type={FILTER_TYPE.DECIMALSTOFRACTIONS} />;

export default Filter;
