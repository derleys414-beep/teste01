CREATE TABLE "channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#4f46e5' NOT NULL,
	"commission_pct" numeric(6,2) DEFAULT '0' NOT NULL,
	"fixed_fee" numeric(12,2) DEFAULT '0' NOT NULL,
	"tax_pct" numeric(6,2) DEFAULT '6' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_prices" (
	"product_id" uuid,
	"channel_id" uuid,
	"user_id" text NOT NULL,
	"price" numeric(12,2) DEFAULT '0' NOT NULL,
	"shipping" numeric(12,2) DEFAULT '0' NOT NULL,
	CONSTRAINT "product_prices_pkey" PRIMARY KEY("product_id","channel_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"cost" numeric(12,2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY,
	"email" text NOT NULL,
	"status" text DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activated_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"product_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12,2) NOT NULL,
	"unit_cost" numeric(12,2) NOT NULL,
	"unit_shipping" numeric(12,2) DEFAULT '0' NOT NULL,
	"commission_pct" numeric(6,2) NOT NULL,
	"fixed_fee" numeric(12,2) DEFAULT '0' NOT NULL,
	"tax_pct" numeric(6,2) NOT NULL,
	"sold_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "channels_user_idx" ON "channels" ("user_id");--> statement-breakpoint
CREATE INDEX "product_prices_user_idx" ON "product_prices" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_user_sku_key" ON "products" ("user_id","sku");--> statement-breakpoint
CREATE INDEX "sales_user_sold_at_idx" ON "sales" ("user_id","sold_at");--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_user_id_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_channel_id_channels_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_user_id_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_channel_id_channels_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE RESTRICT;