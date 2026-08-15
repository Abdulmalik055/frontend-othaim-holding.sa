"use client";

import ReactSelect, { type InputActionMeta, type Props as RSProps } from "react-select";
import { useId } from "react";
import { normalizeTextDigits } from "@/lib/input-auto-convert";

// ── Types ──────────────────────────────────────────────
export type SelectOption = { label: string; value: string };

type Props = Omit<RSProps<SelectOption, boolean>, "id"> & {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  variant?: "default" | "filter";
};

type CN = NonNullable<RSProps<SelectOption, boolean>["classNames"]>;

// ── Control functions ──────────────────────────────────
function defaultControlCn({ isFocused, isDisabled }: { isFocused: boolean; isDisabled: boolean }) {
  return [
    "h-[45px] px-2 border rounded-[9px] bg-white text-sm cursor-pointer",
    "transition-colors duration-200 shadow-none",
    isFocused ? "border-admin-primary shadow-[0_0_0_3px_rgba(52,89,165,0.15)]" : "border-line-mid",
    isDisabled ? "bg-surface opacity-60 cursor-not-allowed" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function filterControlCn({ isFocused, isDisabled }: { isFocused: boolean; isDisabled: boolean }) {
  return [
    "h-[42px] px-2 border rounded-[10px] bg-white text-sm cursor-pointer",
    "transition-colors duration-200 shadow-none",
    isFocused ? "border-admin-primary shadow-[0_0_0_3px_rgba(52,89,165,0.15)]" : "border-gray-200",
    isDisabled ? "bg-surface opacity-60 cursor-not-allowed" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

// ── Shared classNames ──────────────────────────────────
const sharedClassNames: Omit<CN, "control"> = {
  placeholder: () => "text-line-mid",
  singleValue: () => "text-ink",
  multiValue: () => "bg-line-subtler rounded-[4px]",
  multiValueLabel: () => "text-ink text-sm px-1",
  multiValueRemove: () => "hover:bg-line-faint rounded-e-[4px] px-1 cursor-pointer",
  indicatorSeparator: () => "hidden",
  dropdownIndicator: () => "text-muted hover:text-primary",
  clearIndicator: () => "text-muted hover:text-primary cursor-pointer",
  menu: () =>
    [
      "mt-1 bg-white border border-line-mid rounded-[9px]",
      "shadow-[0_4px_16px_rgba(0,0,0,0.09)] overflow-hidden",
    ].join(" "),
  option: ({ isSelected, isFocused }) =>
    [
      "px-3 py-2 text-sm cursor-pointer transition-colors",
      isSelected ? "bg-admin-primary text-white" : "text-ink",
      isFocused && !isSelected ? "bg-[#EEF2FA]" : "",
    ]
      .filter(Boolean)
      .join(" "),
  noOptionsMessage: () => "py-3 text-sm text-muted text-center",
  input: () => "text-ink text-sm",
};

// ── Component ──────────────────────────────────────────
export function AdminSelect({
  label,
  error,
  hint,
  required,
  variant = "default",
  ...props
}: Props) {
  const generatedId = useId();
  const inputId = props.inputId ?? generatedId;
  const instanceId = props.instanceId ?? inputId;
  const controlFn = variant === "filter" ? filterControlCn : defaultControlCn;
  const customClassNames = props.classNames;

  function handleInputChange(nextValue: string, actionMeta: InputActionMeta) {
    const normalizedValue = normalizeTextDigits(nextValue);
    const externalResult = props.onInputChange?.(normalizedValue, actionMeta);

    if (typeof externalResult === "string") {
      return normalizeTextDigits(externalResult);
    }

    return normalizedValue;
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-bold text-muted">
          {label}
          {required && <span className="text-danger ms-0.5">*</span>}
        </label>
      )}

      <ReactSelect
        {...props}
        inputId={inputId}
        instanceId={instanceId}
        onInputChange={handleInputChange}
        unstyled
        menuPortalTarget={typeof document === "undefined" ? undefined : document.body}
        menuPosition="fixed"
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 70 }),
        }}
        classNames={{
          ...sharedClassNames,
          ...customClassNames,
          control: (selectState) =>
            [
              customClassNames?.control?.(selectState) ?? controlFn(selectState),
              error ? "!border-danger" : "",
            ]
              .filter(Boolean)
              .join(" "),
        }}
        placeholder={props.placeholder ?? "Search..."}
        noOptionsMessage={props.noOptionsMessage ?? (() => "No results")}
      />

      {error && <p className="text-xs text-danger">{error}</p>}
      {!error && hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
