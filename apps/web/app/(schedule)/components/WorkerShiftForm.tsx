"use client";

import { useEffect, useMemo } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

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

function buildSchedulePayload(values: MultiShiftFormValues) {
  return {
    outletId: values.outletId,
    workerId: values.workerId,
    station: values.station,
    schedules: values.shifts.flatMap((shift) =>
      shift.days.map((day) => ({
        day,
        start: shift.start,
        end: shift.end,
      })),
    ),
  };
}

export function WorkerShiftForm({ initialValues, submitLabel }: Props) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MultiShiftFormValues>({
    resolver: zodResolver(MultiShiftFormSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "shifts",
  });

  const values = useWatch({
    control,
  }) as MultiShiftFormValues;

  const overlapErrors = useMemo(
    () => detectOverlaps(values.shifts ?? []),
    [values.shifts],
  );

  const mutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildSchedulePayload>) =>
      api.post("/api/admin/schedule", payload).then((r) => r.data),
  });

  function onSubmit(values: MultiShiftFormValues) {
    if (overlapErrors.length > 0) return;
    mutation.mutate(buildSchedulePayload(values));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input hidden {...register("outletId")} />
      <input hidden {...register("workerId")} />
      <input hidden {...register("station")} />
      <h2>Worker Schedule</h2>
      {overlapErrors.length > 0 && (
        <div style={{ color: "red", marginBottom: 16 }}>
          {overlapErrors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}{" "}
      {fields.map((field, index) => (
        <div
          key={field.id}
          style={{
            border: "1px solid #ccc",
            padding: 12,
            marginBottom: 12,
          }}
        >
          <strong>Shift {index + 1}</strong>

          <Controller
            control={control}
            name={`shifts.${index}.days`}
            render={({ field }) => (
              <div style={{ marginTop: 12, marginBottom: 12 }}>
                {DAYS.map((day) => (
                  <label
                    key={day}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={field.value?.includes(day) ?? false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          field.onChange([...field.value, day]);
                        } else {
                          field.onChange(field.value.filter((d) => d !== day));
                        }
                      }}
                    />

                    <span style={{ marginLeft: 4 }}>{day}</span>
                  </label>
                ))}

                {errors.shifts?.[index]?.days && (
                  <p style={{ color: "red" }}>
                    {errors.shifts[index]?.days?.message}
                  </p>
                )}
              </div>
            )}
          />

          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div>
              <label>Start</label>
              <br />
              <input type="time" {...register(`shifts.${index}.start`)} />
            </div>

            <div>
              <label>End</label>
              <br />
              <input type="time" {...register(`shifts.${index}.end`)} />
            </div>
          </div>

          <button type="button" onClick={() => remove(index)}>
            Remove Shift
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          append({
            days: [],
            start: "",
            end: "",
          })
        }
      >
        + Add Shift
      </button>
      <br />
      <br />{" "}
      {mutation.isError && (
        <p style={{ color: "red" }}>
          {(mutation.error as any)?.response?.data?.message ||
            mutation.error?.message ||
            "Failed"}
        </p>
      )}
      {mutation.isSuccess && (
        <p style={{ color: "green" }}>Saved successfully</p>
      )}
      <button
        type="submit"
        disabled={overlapErrors.length > 0 || mutation.isPending}
      >
        {mutation.isPending ? "Saving..." : submitLabel}
      </button>
      <div
        style={{
          marginTop: 24,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          background: "#000000",
        }}
      >
        <h3>Payload Preview</h3>

        <pre
          style={{
            overflowX: "auto",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {JSON.stringify(buildSchedulePayload(values), null, 2)}
        </pre>
      </div>
    </form>
  );
}
