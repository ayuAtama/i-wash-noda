/*
  Warnings:

  - A unique constraint covering the columns `[order_id,item_id,station]` on the table `station_summary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "station_summary_order_id_item_id_station_key" ON "station_summary"("order_id", "item_id", "station");
