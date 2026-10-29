CREATE TYPE "public"."user_role" AS ENUM('ADMIN');--> statement-breakpoint
CREATE TYPE "public"."contact_status" AS ENUM('NEW', 'HANDLED');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_type" AS ENUM('PICKUP', 'DELIVERY');--> statement-breakpoint
CREATE TYPE "public"."order_request_status" AS ENUM('NEW', 'CALLED', 'DONE', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'ADMIN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" varchar(300),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "menu_item" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"short_description" varchar(200),
	"description" text,
	"ingredients" text,
	"is_spicy" boolean DEFAULT false NOT NULL,
	"is_vegetarian" boolean DEFAULT false NOT NULL,
	"is_best_seller" boolean DEFAULT false NOT NULL,
	"is_new" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_sold_out_today" boolean DEFAULT false NOT NULL,
	"sold_out_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "menu_item_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "menu_item_image" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_item_id" text NOT NULL,
	"public_id" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"alt" varchar(200),
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_item_option" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_item_id" text NOT NULL,
	"name" varchar(60) NOT NULL,
	"price" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "menu_item_option_price_check" CHECK ("menu_item_option"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "contact_message" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"phone" varchar(15),
	"email" varchar(120),
	"message" varchar(1000) NOT NULL,
	"status" "contact_status" DEFAULT 'NEW' NOT NULL,
	"telegram_sent_at" timestamp with time zone,
	"telegram_error" varchar(500),
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_message_contact_check" CHECK ("contact_message"."phone" IS NOT NULL OR "contact_message"."email" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "form_rate_limit" (
	"key" varchar(120) PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"window_start" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_request" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"customer_name" varchar(80) NOT NULL,
	"phone" varchar(15) NOT NULL,
	"fulfillment" "fulfillment_type" NOT NULL,
	"delivery_address" varchar(300),
	"requested_at" timestamp with time zone,
	"note" varchar(500),
	"estimated_total" integer NOT NULL,
	"status" "order_request_status" DEFAULT 'NEW' NOT NULL,
	"admin_note" varchar(500),
	"telegram_sent_at" timestamp with time zone,
	"telegram_message_id" bigint,
	"telegram_error" varchar(500),
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_request_code_unique" UNIQUE("code"),
	CONSTRAINT "order_request_delivery_address_check" CHECK ("order_request"."fulfillment" <> 'DELIVERY' OR "order_request"."delivery_address" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "order_request_item" (
	"id" text PRIMARY KEY NOT NULL,
	"order_request_id" text NOT NULL,
	"menu_item_id" text,
	"menu_item_option_id" text,
	"item_name" varchar(120) NOT NULL,
	"option_name" varchar(60) NOT NULL,
	"unit_price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"line_total" integer NOT NULL,
	CONSTRAINT "order_request_item_quantity_check" CHECK ("order_request_item"."quantity" BETWEEN 1 AND 50)
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_image" ADD CONSTRAINT "menu_item_image_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_option" ADD CONSTRAINT "menu_item_option_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_request_item" ADD CONSTRAINT "order_request_item_order_request_id_order_request_id_fk" FOREIGN KEY ("order_request_id") REFERENCES "public"."order_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_request_item" ADD CONSTRAINT "order_request_item_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_request_item" ADD CONSTRAINT "order_request_item_menu_item_option_id_menu_item_option_id_fk" FOREIGN KEY ("menu_item_option_id") REFERENCES "public"."menu_item_option"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_active_sort_idx" ON "category" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE INDEX "menu_item_category_idx" ON "menu_item" USING btree ("category_id","is_active","sort_order");--> statement-breakpoint
CREATE INDEX "menu_item_featured_idx" ON "menu_item" USING btree ("is_featured") WHERE "menu_item"."is_active" = true;--> statement-breakpoint
CREATE INDEX "menu_item_image_item_idx" ON "menu_item_image" USING btree ("menu_item_id","sort_order");--> statement-breakpoint
CREATE INDEX "menu_item_option_item_idx" ON "menu_item_option" USING btree ("menu_item_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_item_option_one_default_idx" ON "menu_item_option" USING btree ("menu_item_id") WHERE "menu_item_option"."is_default" = true;--> statement-breakpoint
CREATE INDEX "contact_message_status_idx" ON "contact_message" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "order_request_status_idx" ON "order_request" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "order_request_created_idx" ON "order_request" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "order_request_phone_idx" ON "order_request" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "order_request_item_request_idx" ON "order_request_item" USING btree ("order_request_id");--> statement-breakpoint
CREATE INDEX "order_request_item_menu_item_idx" ON "order_request_item" USING btree ("menu_item_id");