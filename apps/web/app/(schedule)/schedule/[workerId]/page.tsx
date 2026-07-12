"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { WorkerShiftForm } from "../../components/WorkerShiftForm";
import { mapScheduleToForm } from "../../utils/mapScheduleToForm";

export default function ScheduleEditPage() {
  const { workerId } = useParams() as { workerId: string };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["schedule", workerId],
    queryFn: () =>
      api.get(`/api/admin/schedule/${workerId}`).then((r) => r.data),
  });

  if (isLoading) return <p>Loading schedule...</p>;
  if (isError) return <p style={{ color: "red" }}>Failed to load schedule.</p>;

  const initialValues = {
    outletId: "35dd708b-1be9-4598-81d7-834b3b44fd51",
    workerId,
    station: "washing" as const,
    shifts: mapScheduleToForm(data.data),
  };

  return (
    <WorkerShiftForm
      submitLabel="Update Schedule"
      initialValues={initialValues}
    />
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import { useForm, useFieldArray } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import {
//   MultiShiftFormSchema,
//   MultiShiftFormValues,
// } from "../../validation/shiftForm.schema";
// import { WorkerShiftDay } from "../../validation/prisma.enum";
// import { detectOverlaps } from "../../utils/shiftOverlap";
// import { mapScheduleToForm } from "../../utils/mapScheduleToForm";
// import { useParams } from "next/navigation";

// const DAYS = Object.values(WorkerShiftDay);

// export default function EditSchedulePage() {
//   const params = useParams();
//   const workerId = params.workerId as string;

//   const [loading, setLoading] = useState(true);

//   const form = useForm<MultiShiftFormValues>({
//     resolver: zodResolver(MultiShiftFormSchema),
//     defaultValues: {
//       outletId: "35dd708b-1be9-4598-81d7-834b3b44fd51",
//       workerId,
//       station: "washing",
//       shifts: [],
//     },
//   });

//   const { control, register, watch, setValue, handleSubmit } = form;

//   // ✅ ADD append & remove
//   const { fields, append, remove, replace } = useFieldArray({
//     control,
//     name: "shifts",
//   });

//   const shifts = watch("shifts");
//   const overlapErrors = detectOverlaps(shifts ?? []);

//   useEffect(() => {
//     async function loadSchedule() {
//       const res = await fetch(
//         `http://localhost:3000/api/admin/schedule/${workerId}`
//       );
//       const data = await res.json();
//       const mapped = mapScheduleToForm(data);
//       replace(mapped);
//       setLoading(false);
//     }

//     loadSchedule();
//   }, [workerId, replace]);

//   async function onSubmit(values: MultiShiftFormValues) {
//     if (overlapErrors.length > 0) return;

//     const schedules = values.shifts.flatMap((shift) =>
//       shift.days.map((day) => ({
//         day,
//         start: shift.start,
//         end: shift.end,
//       }))
//     );

//     await fetch("http://localhost:3000/api/admin/schedule", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         outletId: values.outletId,
//         workerId: values.workerId,
//         station: values.station,
//         schedules,
//       }),
//     });
//   }

//   if (loading) return <p>Loading schedule...</p>;

//   return (
//     <form onSubmit={handleSubmit(onSubmit)}>
//       <input type="hidden" {...register("outletId")} />
//       <input type="hidden" {...register("workerId")} />
//       <input type="hidden" {...register("station")} />

//       {overlapErrors.length > 0 && (
//         <p style={{ color: "red" }}>{overlapErrors[0]}</p>
//       )}

//       {fields.map((field, index) => {
//         const selectedDays = shifts?.[index]?.days ?? [];

//         return (
//           <div key={field.id} style={{ marginBottom: 12 }}>
//             <strong>Shift {index + 1}</strong>

//             <div>
//               {DAYS.map((day) => (
//                 <label key={day}>
//                   <input
//                     type="checkbox"
//                     checked={selectedDays.includes(day)}
//                     onChange={(e) => {
//                       const checked = e.target.checked;
//                       setValue(
//                         `shifts.${index}.days`,
//                         checked
//                           ? [...selectedDays, day]
//                           : selectedDays.filter((d) => d !== day)
//                       );
//                     }}
//                   />
//                   {day}
//                 </label>
//               ))}
//             </div>

//             <input type="time" {...register(`shifts.${index}.start`)} />
//             <input type="time" {...register(`shifts.${index}.end`)} />

//             {/* ✅ REMOVE */}
//             <button type="button" onClick={() => remove(index)}>
//               Remove shift
//             </button>
//           </div>
//         );
//       })}

//       {/* ✅ ADD SHIFT */}
//       <button
//         type="button"
//         onClick={() => append({ days: [], start: "", end: "" })}
//       >
//         + Add shift
//       </button>

//       <br />

//       <button type="submit" disabled={overlapErrors.length > 0}>
//         Update Schedule
//       </button>
//     </form>
//   );
// }
