"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateDeliveryPoints,
  calculateDessertPoints,
  calculateDineOutPoints,
  calculateFruitPoints,
  calculateJunkFoodPoints,
  calculateSleepPoints,
  calculateStepPoints,
  calculateVegetablePoints,
  calculateWaterPoints,
  calculateWorkoutPoints,
  emptyDailyLog,
  formatPoints,
  type DailyLog,
} from "@/app/lib/dailyScoring";

type LogModalProps = {
  isOpen: boolean;
  category: string;
  onClose: () => void;
  onSave: (payload: DailyLog) => void;
  initialValues?: DailyLog;
};

const categoryConfig: Record<string, { title: string; inputLabel: string; placeholder: string; type: "steps" | "text" | "water" | "sleep" | "toggle" }> = {
  Workout: { title: "Workout", inputLabel: "Choose a duration", placeholder: "", type: "text" },
  Steps: { title: "Steps", inputLabel: "Daily steps", placeholder: "8500", type: "steps" },
  Fruit: { title: "Fruit", inputLabel: "Add a fruit", placeholder: "Apple", type: "text" },
  Vegetable: { title: "Vegetable", inputLabel: "Add a vegetable", placeholder: "Broccoli", type: "text" },
  Dessert: { title: "Dessert", inputLabel: "What dessert did you have?", placeholder: "Cake", type: "text" },
  "Junk Food": { title: "Junk Food", inputLabel: "What junk food did you eat?", placeholder: "Fries", type: "text" },
  Water: { title: "Water", inputLabel: "Water amount (ml)", placeholder: "3000", type: "water" },
  Sleep: { title: "Sleep", inputLabel: "Sleep duration", placeholder: "7.5", type: "sleep" },
  "Dine Out": { title: "Dine Out", inputLabel: "Did you dine out today?", placeholder: "", type: "toggle" },
  Delivery: { title: "Delivery", inputLabel: "Did you order delivery today?", placeholder: "", type: "toggle" },
};

const workoutOptions = [
  { label: "Less than 1 hour", minutes: 59, points: 1 },
  { label: "1 to 2 hours", minutes: 120, points: 2 },
  { label: "More than 2 hours", minutes: 180, points: 3 },
];

const defaultState = () => ({ ...emptyDailyLog });

export function LogModal({ isOpen, category, onClose, onSave, initialValues }: LogModalProps) {
  const config = categoryConfig[category] ?? categoryConfig.Workout;
  const [form, setForm] = useState<DailyLog>(initialValues ?? defaultState());
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const resetTimer = window.setTimeout(() => {
      setForm(initialValues ?? defaultState());
      const values = initialValues ?? defaultState();
      const categoryText = category === "Fruit" ? values.fruit
        : category === "Vegetable" ? values.vegetable
          : category === "Dessert" ? values.dessert
            : category === "Junk Food" ? values.junkFood
              : "";
      setInputText(category === "Fruit" || category === "Vegetable" ? "" : categoryText);
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [isOpen, initialValues]);

  const preview = useMemo(() => {
    switch (category) {
      case "Workout":
        return calculateWorkoutPoints(form.workoutMinutes);
      case "Steps":
        return calculateStepPoints(form.steps);
      case "Fruit":
        return calculateFruitPoints(form.fruit);
      case "Vegetable":
        return calculateVegetablePoints(form.vegetable);
      case "Dessert":
        return calculateDessertPoints(form.dessert);
      case "Junk Food":
        return calculateJunkFoodPoints(form.junkFood);
      case "Water":
        return calculateWaterPoints(form.waterMl);
      case "Sleep":
        return calculateSleepPoints(form.sleepHours);
      case "Dine Out":
        return calculateDineOutPoints(form.dineOut);
      case "Delivery":
        return calculateDeliveryPoints(form.delivery);
      default:
        return 0;
    }
  }, [category, form]);

  if (!isOpen) return null;

  const applyValue = (value: string) => {
    if (category === "Workout") {
      setForm((current) => ({ ...current, workoutMinutes: Number(value) }));
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

    if (category === "Dine Out") {
      setForm((current) => ({ ...current, dineOut: value === "true" }));
      return;
    }

    if (category === "Delivery") {
      setForm((current) => ({ ...current, delivery: value === "true" }));
    }
  };

  const handleSubmit = () => {
    onSave(form);
    onClose();
  };

  const addFoodItem = () => {
    const newItems = inputText.split(",").map((item) => item.trim()).filter(Boolean);
    if (!newItems.length) return;

    setForm((current) => {
      const existing = (category === "Fruit" ? current.fruit : current.vegetable).split(",").map((item) => item.trim()).filter(Boolean);
      const items = [...existing, ...newItems].join(", ");
      return category === "Fruit" ? { ...current, fruit: items } : { ...current, vegetable: items };
    });
    setInputText("");
  };

  const removeFoodItem = (indexToRemove: number) => {
    setForm((current) => {
      const currentItems = (category === "Fruit" ? current.fruit : current.vegetable).split(",").map((item) => item.trim()).filter(Boolean);
      const items = currentItems.filter((_, index) => index !== indexToRemove).join(", ");
      return category === "Fruit" ? { ...current, fruit: items } : { ...current, vegetable: items };
    });
  };

  const selectedWorkout = form.workoutMinutes <= 0 ? 0 : form.workoutMinutes <= 60 ? 60 : form.workoutMinutes <= 120 ? 120 : 180;
  const foodItems = (category === "Fruit" ? form.fruit : form.vegetable).split(",").map((item) => item.trim()).filter(Boolean);

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
            <div className="d-grid gap-2" role="radiogroup" aria-label="Workout duration">
              {workoutOptions.map((option) => (
                <label key={option.minutes} className="form-check list-surface d-flex align-items-center gap-3 p-3 mb-0">
                  <input
                    className="form-check-input mt-0"
                    type="radio"
                    name="workout-duration"
                    value={option.minutes}
                    checked={selectedWorkout === option.minutes}
                    onChange={(event) => applyValue(event.target.value)}
                  />
                  <span className="flex-grow-1">{option.label}</span>
                  <span className="fw-semibold text-primary">+{option.points} pt{option.points > 1 ? "s" : ""}</span>
                </label>
              ))}
            </div>
          </div>
        ) : config.type === "toggle" ? (
          <div className="form-check form-switch fs-5">
            <input
              className="form-check-input"
              type="checkbox"
              checked={category === "Dine Out" ? form.dineOut : form.delivery}
              onChange={(event) => applyValue(String(event.target.checked))}
              id={`toggle-${category}`}
            />
            <label className="form-check-label" htmlFor={`toggle-${category}`}>{config.inputLabel}</label>
          </div>
        ) : category === "Fruit" || category === "Vegetable" ? (
          <>
            <label className="form-label fw-semibold" htmlFor="food-items">{config.inputLabel}</label>
            <div className="input-group">
              <input
                id="food-items"
                className="form-control form-control-lg"
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addFoodItem();
                  }
                }}
                placeholder={config.placeholder}
              />
              <button className="btn btn-dark" type="button" onClick={addFoodItem} disabled={!inputText.trim()}>Add</button>
            </div>
            {foodItems.length ? <ul className="list-group list-group-flush mt-3">{foodItems.map((item, index) => <li key={`${item}-${index}`} className="list-group-item d-flex align-items-center justify-content-between gap-3 px-0"><span className="flex-grow-1">{item}</span><span className="text-success fw-semibold">+1 pt</span><button className="btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center" type="button" style={{ width: 32, height: 32 }} onClick={() => removeFoodItem(index)} aria-label={`Remove ${item}`}>-</button></li>)}</ul> : null}
          </>
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
          This activity: <span className={`fw-bold ${preview < 0 ? "text-danger" : "text-primary"}`}>{preview > 0 ? "+" : ""}{formatPoints(preview)} points</span>
        </div>

        <div className="d-grid gap-2 mt-4">
          <button className="btn btn-primary-soft btn-lg rounded-pill" onClick={handleSubmit}>
            {category === "Fruit" || category === "Vegetable" ? "Done" : "Save"}
          </button>
          <button className="btn btn-muted btn-lg rounded-pill" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
