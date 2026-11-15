CREATE TYPE "public"."trainer_status" AS ENUM('incomplete', 'submitted', 'changes_requested', 'approved');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'declined', 'expired', 'withdrawn', 'cancelled', 'completed');--> statement-breakpoint
CREATE TABLE "trainer_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"status" "trainer_status" DEFAULT 'incomplete' NOT NULL,
	"status_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"area" text NOT NULL,
	"address" text NOT NULL,
	"instructions" text,
	"time_zone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_user_id" uuid NOT NULL,
	"client_user_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"price_minor" integer NOT NULL,
	"currency" char(3) NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_duration_minutes_positive" CHECK ("bookings"."duration_minutes" > 0),
	CONSTRAINT "bookings_price_minor_non_negative" CHECK ("bookings"."price_minor" >= 0),
	CONSTRAINT "bookings_expires_after_requested" CHECK ("bookings"."expires_at" > "bookings"."requested_at")
);
--> statement-breakpoint
CREATE TABLE "booking_status_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"from_status" "booking_status",
	"to_status" "booking_status" NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trainer_profiles" ADD CONSTRAINT "trainer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_trainer_user_id_users_id_fk" FOREIGN KEY ("trainer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_trainer_user_id_users_id_fk" FOREIGN KEY ("trainer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_client_user_id_users_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_changes" ADD CONSTRAINT "booking_status_changes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "venues_trainer_user_id_idx" ON "venues" USING btree ("trainer_user_id");--> statement-breakpoint
CREATE INDEX "bookings_trainer_status_expires_idx" ON "bookings" USING btree ("trainer_user_id","status","expires_at");--> statement-breakpoint
CREATE INDEX "bookings_trainer_status_starts_idx" ON "bookings" USING btree ("trainer_user_id","status","starts_at");--> statement-breakpoint
CREATE INDEX "bookings_client_status_idx" ON "bookings" USING btree ("client_user_id","status");--> statement-breakpoint
CREATE INDEX "booking_status_changes_booking_id_idx" ON "booking_status_changes" USING btree ("booking_id");