"use client";

import { WorkerShiftForm } from "../components/WorkerShiftForm";

export default function ScheduleCreatePage() {
  return (
    <WorkerShiftForm
      submitLabel="Save Schedule"
      initialValues={{
        outletId: "35dd708b-1be9-4598-81d7-834b3b44fd51",
        workerId: "f3e97637-404c-4034-8b9f-b4d3765c3518",
        station: "washing",
        shifts: [{ days: [], start: "", end: "" }],
      }}
    />
  );
}

// "use client";

// import { useForm, useFieldArray } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import {
//   MultiShiftFormSchema,
//   MultiShiftFormValues,
// } from "../validation/shiftForm.schema";
// import { WorkerShiftDay } from "../validation/prisma.enum";
// import { detectOverlaps } from "../utils/shiftOverlap";
// import { useState } from "react";

// const DAYS = Object.values(WorkerShiftDay);

// export default function SchedulePage() {
//   const [submitError, setSubmitError] = useState<string | null>(null);
//   const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

//   /**
//    * 1. Initialize form
//    */
//   const {
//     control,
//     register,
//     handleSubmit,
//     watch,
//     setValue,
//     formState: { errors },
//   } = useForm<MultiShiftFormValues>({
//     resolver: zodResolver(MultiShiftFormSchema),
//     defaultValues: {
//       outletId: "35dd708b-1be9-4598-81d7-834b3b44fd51",
//       workerId: "f3e97637-404c-4034-8b9f-b4d3765c3518",
//       station: "washing",
//       shifts: [
//         {
//           days: [],
//           start: "",
//           end: "",
//         },
//       ],
//     },
//   });

//   /**
//    * 2. Manage dynamic shifts
//    */
//   const { fields, append, remove } = useFieldArray({
//     control,
//     name: "shifts",
//   });

//   /**
//    * 3. Watch shifts for overlap detection
//    */
//   const shifts = watch("shifts");
//   const overlapErrors = detectOverlaps(shifts ?? []);

//   /**
//    * 4. Submit handler
//    */
//   async function onSubmit(values: MultiShiftFormValues) {
//     setSubmitError(null);
//     setSubmitSuccess(null);
//     // SAFETY: backend will also validate
//     if (overlapErrors.length > 0) {
//       return;
//     }

//     // Transform shifts → schedules (backend format)
//     const schedules = values.shifts.flatMap((shift) =>
//       shift.days.map((day) => ({
//         day,
//         start: shift.start,
//         end: shift.end,
//       }))
//     );

//     const res = await fetch("http://localhost:3000/api/admin/schedule", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         outletId: values.outletId,
//         workerId: values.workerId,
//         station: values.station,
//         schedules,
//       }),
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       setSubmitError(data.message || "Failed to save schedule");
//       return;
//     }

//     setSubmitSuccess(data.message || "Schedule saved");
//   }

//   /**
//    * 5. Render UI
//    */
//   return (
//     <form onSubmit={handleSubmit(onSubmit)}>
//       {/* Required hidden fields */}
//       <input type="hidden" {...register("outletId")} />
//       <input type="hidden" {...register("workerId")} />
//       <input type="hidden" {...register("station")} />

//       <h2>Worker Schedule</h2>

//       {/* OVERLAP ERROR DISPLAY */}
//       {overlapErrors.length > 0 && (
//         <div style={{ color: "red", marginBottom: 12 }}>
//           {overlapErrors.map((msg, i) => (
//             <div key={i}>{msg}</div>
//           ))}
//         </div>
//       )}

//       {/* SHIFTS */}
//       {fields.map((field, index) => {
//         const selectedDays = shifts?.[index]?.days ?? [];

//         return (
//           <div
//             key={field.id}
//             style={{
//               border: "1px solid #ccc",
//               padding: 12,
//               marginBottom: 12,
//             }}
//           >
//             <strong>Shift {index + 1}</strong>

//             {/* DAYS */}
//             <div>
//               {DAYS.map((day) => (
//                 <label key={day} style={{ marginRight: 8 }}>
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
//               {errors.shifts?.[index]?.days && (
//                 <p>{errors.shifts[index]?.days?.message}</p>
//               )}
//             </div>

//             {/* TIME */}
//             <div>
//               <input type="time" {...register(`shifts.${index}.start`)} />
//               <input type="time" {...register(`shifts.${index}.end`)} />
//             </div>

//             {/* REMOVE */}
//             <button type="button" onClick={() => remove(index)}>
//               Remove shift
//             </button>
//           </div>
//         );
//       })}

//       {/* ADD SHIFT */}
//       <button
//         type="button"
//         onClick={() => append({ days: [], start: "", end: "" })}
//       >
//         + Add shift
//       </button>

//       <br />
//       <br />

//       {/* SUBMIT */}
//       {submitError && <p style={{ color: "red" }}>{submitError}</p>}
//       {submitSuccess && <p style={{ color: "green" }}>{submitSuccess}</p>}

//       <button type="submit" disabled={overlapErrors.length > 0}>
//         Save Schedule
//       </button>
//     </form>
//   );
// }
