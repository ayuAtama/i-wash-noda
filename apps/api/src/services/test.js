// fetch the orderItem
// const orderItems = await prisma.orderItem.findMany({
//   where: { order_id: orderId },
//   select: { item_id: true, quantity_initial: true },
// });

// the inputted items array
// const inputItems = data.map((item) => ({
//   item_id: item.itemId,
//   quantity_initial: item.quantity,
// }));

// compare the inputted items with the orderItems
// convert db items into a map
// const orderMap = new Map(
//   orderItems.map((item) => [item.item_id, item.quantity_initial])
// );
// const isMatch =
//   orderItems.length === inputItems.length && // array length match
//   inputItems.every(
//     (item) => orderMap.get(item.item_id) === item.quantity_initial // check it
//   );

const orderItems = [
  {
    item_id: 1,
    quantity_initial: 53,
  },
  {
    item_id: 2,
    quantity_initial: 1,
  },
  {
    item_id: 3,
    quantity_initial: 1,
  },
  {
    item_id: 1,
    quantity_initial: 1,
  },
];

const inputItems = [
  {
    item_id: 1,
    quantity_initial: 1,
  },
  {
    item_id: 3,
    quantity_initial: 1,
  },
  {
    item_id: 2,
    quantity_initial: 1,
  },
  {
    item_id: 13341234,
    quantity_initial: 1,
  },
];

const orderMap = new Map(
  orderItems.map((item) => [item.item_id, item.quantity_initial])
);
console.log(orderMap);
const expected = orderMap.get(1);
console.log(expected);

// check the length first
if (orderItems.length !== inputItems.length) {
  console.log("length not match");
}

// sort the arrays
const sortByItemId = (a, b) => a.item_id - b.item_id;

const sortedOrderItems = [...orderItems].sort(sortByItemId);
const sortedInputItems = [...inputItems].sort(sortByItemId);

console.log(sortedOrderItems, sortedInputItems);
