"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateDailyScore, DAILY_LOG_STORAGE_KEY, emptyDailyLog, type DailyLog } from "@/app/lib/dailyScoring";

type LogModalProps = {
  isOpen: boolean;
  category: string;
  onClose: () => void;
  onSave: (payload: DailyLog) => void;
  initialValues?: DailyLog;
};

const categoryConfig: Record<string, { title: string; inputLabel: string; placeholder: string; type: "minutes" | "steps" | "text" | "water" | "sleep" }> = {
  Workout: { title: "Workout", inputLabel: "Duration", placeholder: "01:30", type: "minutes" },
  Steps: { title: "Steps", inputLabel: "Daily steps", placeholder: "8500", type: "steps" },
  Fruit: { title: "Fruit", inputLabel: "Fruit you ate", placeholder: "Apple", type: "text" },
  Vegetable: { title: "Vegetable", inputLabel: "Vegetable you ate", placeholder: "Broccoli", type: "text" },
  Dessert: { title: "Dessert", inputLabel: "What dessert did you have?", placeholder: "Cake", type: "text" },
  "Junk Food": { title: "Junk Food", inputLabel: "What junk food did you eat?", placeholder: "Fries", type: "text" },
  Water: { title: "Water", inputLabel: "Water amount (ml)", placeholder: "3000", type: "water" },
  Sleep: { title: "Sleep", inputLabel: "Sleep duration", placeholder: "7.5", type: "sleep" },
};

function parseDurationToMinutes(value: string) {
  if (!value) return 0;
  const clean = value.trim();
  const [hours, minutes] = clean.split(":");

  if (hours && minutes) {
    return Number(hours) * 60 + Number(minutes);
  }

  const numeric = Number(clean);
  return Number.isFinite(numeric) ? Math.round(numeric) : 0;
}

function getWorkoutParts(totalMinutes: number) {
  const safeMinutes = Number.isFinite(totalMinutes) ? Math.max(0, totalMinutes) : 0;
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  return { hours, minutes };
}

function TimeScroller({
  value,
  max,
  onChange,
  label,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div className="flex-fill">
      <label className="form-label small text-secondary mb-2">{label}</label>
      <select
        className="form-select form-select-lg rounded-3"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        style={{ height: 54 }}
      >
        {Array.from({ length: max + 1 }, (_, index) => (
          <option key={`${label}-${index}`} value={index}>
            {String(index).padStart(2, "0")}
          </option>
        ))}
      </select>
    </div>
  );
}

const defaultState = () => ({ ...emptyDailyLog });

export function LogModal({ isOpen, category, onClose, onSave, initialValues }: LogModalProps) {
  const config = categoryConfig[category] ?? categoryConfig.Workout;
  const [form, setForm] = useState<DailyLog>(initialValues ?? defaultState());
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setForm(initialValues ?? defaultState());
    setInputText("");
  }, [isOpen, initialValues]);

  const preview = useMemo(() => calculateDailyScore(form), [form]);

  if (!isOpen) return null;

  const applyValue = (value: string) => {
    if (category === "Workout") {
      const minutes = parseDurationToMinutes(value);
      setForm((current) => ({ ...current, workoutMinutes: minutes }));
      return;
    }

    if (category === "Steps") {
      setForm((current) => ({ ...current, steps: Number(value) || 0 }));
      return;
    }

    if (category === "Water") {
      setForm((current) => ({ ...current, waterMl: Number(value) || 0 }));
      return;
    }

    if (category === "Sleep") {
      setForm((current) => ({ ...current, sleepHours: Number(value) || 0 }));
      return;
    }

    if (category === "Fruit") {
      setForm((current) => ({ ...current, fruit: value }));
      return;
    }

    if (category === "Vegetable") {
      setForm((current) => ({ ...current, vegetable: value }));
      return;
    }

    if (category === "Dessert") {
      setForm((current) => ({ ...current, dessert: value }));
      return;
    }

    if (category === "Junk Food") {
      setForm((current) => ({ ...current, junkFood: value }));
      return;
    }
  };

  const handleSubmit = () => {
    onSave(form);
    onClose();
  };

  const workoutParts = getWorkoutParts(form.workoutMinutes);

  const handleWorkoutTimeChange = (segment: "hours" | "minutes", nextValue: number) => {
    const nextHours = segment === "hours" ? nextValue : workoutParts.hours;
    const nextMinutes = segment === "minutes" ? nextValue : workoutParts.minutes;
    const totalMinutes = nextHours * 60 + nextMinutes;

    setForm((current) => ({
      ...current,
      workoutMinutes: totalMinutes,
    }));
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-end justify-content-center" style={{ background: "rgba(17,24,39,0.5)", zIndex: 1100 }}>
      <div className="soft-card w-100 p-4 rounded-top-4" style={{ maxWidth: 480, borderRadius: "24px 24px 0 0" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fw-bolder mb-0">{config.title}</h3>
          <button className="btn btn-light rounded-circle" onClick={onClose} aria-label="Close">×</button>
        </div>

        {category === "Workout" ? (
          <div>
            <label className="form-label fw-semibold">{config.inputLabel}</label>
            <div className="d-flex gap-2 align-items-end">
              <TimeScroller
                label="Hours"
                value={workoutParts.hours}
                max={12}
                onChange={(value) => handleWorkoutTimeChange("hours", value)}
              />
              <TimeScroller
                label="Minutes"
                value={workoutParts.minutes}
                max={59}
                onChange={(value) => handleWorkoutTimeChange("minutes", value)}
              />
            </div>
          </div>
        ) : (
          <>
            <label className="form-label fw-semibold">{config.inputLabel}</label>
            <input
              type={config.type === "water" || config.type === "steps" || config.type === "sleep" ? "number" : "text"}
              className="form-control form-control-lg rounded-3"
              value={
                category === "Water"
                  ? String(form.waterMl || "")
                  : category === "Sleep"
                    ? String(form.sleepHours || "")
                    : category === "Steps"
                      ? String(form.steps || "")
                      : inputText
              }
              onChange={(e) => {
                const value = e.target.value;
                setInputText(value);
                applyValue(value);
              }}
              placeholder={config.placeholder}
            />
          </>
        )}

        <div className="mt-3 small text-secondary">
          Preview score: <span className="fw-bold text-primary">{preview}</span>
        </div>

        <div className="d-grid gap-2 mt-4">
          <button className="btn btn-primary-soft btn-lg rounded-pill" onClick={handleSubmit}>
            Save
          </button>
          <button className="btn btn-muted btn-lg rounded-pill" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
