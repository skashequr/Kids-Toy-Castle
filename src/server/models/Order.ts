import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    slug: { type: String },
    image: { type: String },
    variantLabel: { type: String },
    variantId: { type: String },
    variantSku: { type: String },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String, required: true },
    area: { type: String },
    city: { type: String, default: "" },
    district: { type: String },
    postalCode: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerEmail: { type: String },
    items: { type: [OrderItemSchema], default: [] },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    couponCode: { type: String },
    giftWrap: { type: Boolean, default: false },
    orderNotes: { type: String },
    // cash_on_delivery | bkash | nagad | rocket | sslcommerz | visa | mastercard
    paymentMethod: { type: String, default: "cash_on_delivery" },
    // pending | paid | failed | refunded
    paymentStatus: { type: String, default: "pending" },
    // pending | confirmed | processing | shipped | delivered | returned | cancelled
    status: { type: String, default: "pending" },
    trackingNumber: { type: String },
    courier: { type: String },
    courierConsignmentId: { type: Number },
    courierStatus: { type: String },
    courierTrackingMessage: { type: String },
    courierTrackingHistory: { type: [{ message: String, status: String, updatedAt: Date }], default: [] },
    courierDeliveryCharge: { type: Number },
    courierCodAmount: { type: Number },
    courierUpdatedAt: { type: Date },
    courierStatusUpdatedAt: { type: Date },
    courierReturnRequestId: { type: Number },
    courierReturnStatus: { type: String },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

export type OrderDoc = InferSchemaType<typeof OrderSchema>;

export const Order: Model<OrderDoc> =
  (mongoose.models.Order as Model<OrderDoc>) ||
  mongoose.model<OrderDoc>("Order", OrderSchema);
