export interface CustomizationOption {
  id: number;
  name: string;
  extra_amount: number;
}

export interface CustomizationGroup {
  id: number;
  name: string;
  required: boolean;
  max_choices: number;
  options: CustomizationOption[];
}

export interface MenuItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  image_url: string;
  price_amount: number;
  customization_groups: CustomizationGroup[];
}

export interface Location {
  id: number;
  name: string;
}

export interface CartLine {
  key: string;
  item: MenuItem;
  quantity: number;
  optionIds: number[];
}

export interface CheckoutResponse {
  order_id: string;
  tracking_token: string;
  client_secret: string;
}

export type PaymentStatus =
  "pending" | "processing" | "paid" | "failed" | "canceled";
export type FulfillmentStatus = "preparing" | "ready" | "fulfilled";

export interface OrderCustomization {
  group_name: string;
  option_name: string;
  extra_amount: number;
}

export interface OrderLine {
  title: string;
  unit_amount: number;
  quantity: number;
  customizations: OrderCustomization[];
}

export interface CustomerOrder {
  id: string;
  created_at: string;
  location: string;
  currency: string;
  amount_total: number;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  items: OrderLine[];
}

export interface MerchantOrder extends CustomerOrder {
  customer_name: string;
  customer_email: string;
}

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    fields?: unknown;
  };
}
