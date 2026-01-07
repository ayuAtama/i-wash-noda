/*
  Warnings:

  - A unique constraint covering the columns `[driver_id,order_id]` on the table `driver_job_status` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "driver_job_status_driver_id_order_id_key" ON "driver_job_status"("driver_id", "order_id");
