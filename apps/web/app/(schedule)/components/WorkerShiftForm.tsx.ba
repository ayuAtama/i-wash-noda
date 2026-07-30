"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import {
  MultiShiftFormSchema,
  MultiShiftFormValues,
} from "../validation/shiftForm.schema";
import { WorkerShiftDay } from "../validation/prisma.enum";
import { detectOverlaps } from "../utils/shiftOverlap";

const DAYS = Object.values(WorkerShiftDay);

type Props = {
  initialValues: MultiShiftFormValues;
  submitLabel: string;
};

export function WorkerShiftForm({ initialValues, submitLabel }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<MultiShiftFormValues>({
    resolver: zodResolver(MultiShiftFormSchema),
    defaultValues: initialValues,
  });

  /**
   * IMPORTANT:
   * When initialValues change (edit page),
   * we MUST reset the form
   */
  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "shifts",
  });

  const shifts = watch("shifts");
  const overlapErrors = detectOverlaps(shifts ?? []);

  async function onSubmit(values: MultiShiftFormValues) {
    setSubmitError(null);
    setSubmitSuccess(null);

    if (overlapErrors.length > 0) return;

    const schedules = values.shifts.flatMap((shift) =>
      shift.days.map((day) => ({
        day,
        start: shift.start,
        end: shift.end,
      }))
    );

    const res = await fetch("http://localhost:3000/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outletId: values.outletId,
        workerId: values.workerId,
        station: values.station,
        schedules,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setSubmitError(data.message || "Failed to save schedule");
      return;
    }

    setSubmitSuccess(data.message || "Schedule saved");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="hidden" {...register("outletId")} />
      <input type="hidden" {...register("workerId")} />
      <input type="hidden" {...register("station")} />

      <h2>Worker Schedule</h2>

      {overlapErrors.length > 0 && (
        <div style={{ color: "red", marginBottom: 12 }}>
          {overlapErrors.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </div>
      )}

      {fields.map((field, index) => {
        const selectedDays = shifts?.[index]?.days ?? [];

        return (
          <div
            key={field.id}
            style={{
              border: "1px solid #ccc",
              padding: 12,
              marginBottom: 12,
            }}
          >
            <strong>Shift {index + 1}</strong>

            <div>
              {DAYS.map((day) => (
                <label key={day} style={{ marginRight: 8 }}>
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setValue(
                        `shifts.${index}.days`,
                        checked
                          ? [...selectedDays, day]
                          : selectedDays.filter((d) => d !== day)
                      );
                    }}
                  />
                  {day}
                </label>
              ))}
              {errors.shifts?.[index]?.days && (
                <p>{errors.shifts[index]?.days?.message}</p>
              )}
            </div>

            <div>
              <input type="time" {...register(`shifts.${index}.start`)} />
              <input type="time" {...register(`shifts.${index}.end`)} />
            </div>

            <button type="button" onClick={() => remove(index)}>
              Remove shift
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => append({ days: [], start: "", end: "" })}
      >
        + Add shift
      </button>

      <br />
      <br />

      {submitError && <p style={{ color: "red" }}>{submitError}</p>}
      {submitSuccess && <p style={{ color: "green" }}>{submitSuccess}</p>}

      <button type="submit" disabled={overlapErrors.length > 0}>
        {submitLabel}
      </button>
    </form>
  );
}
