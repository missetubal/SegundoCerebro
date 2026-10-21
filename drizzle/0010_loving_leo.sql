CREATE TABLE "credit_card" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"nickname" text NOT NULL,
	"brand" text,
	"last4" text,
	"credit_limit_minor" bigint,
	"closing_day" integer NOT NULL,
	"due_day" integer NOT NULL,
	"currency" char(3) NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_card_days" CHECK ("credit_card"."closing_day" between 1 and 31 and "credit_card"."due_day" between 1 and 31),
	CONSTRAINT "credit_card_last4" CHECK ("credit_card"."last4" is null or "credit_card"."last4" ~ '^[0-9]{4}$'),
	CONSTRAINT "credit_card_currency" CHECK ("credit_card"."currency" in ('BRL', 'USD', 'EUR')),
	CONSTRAINT "credit_card_limit_non_negative" CHECK ("credit_card"."credit_limit_minor" is null or "credit_card"."credit_limit_minor" >= 0)
);
--> statement-breakpoint
CREATE TABLE "financial_account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"account_type" text NOT NULL,
	"currency" char(3) NOT NULL,
	"opening_balance_minor" bigint DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "financial_account_currency" CHECK ("financial_account"."currency" in ('BRL', 'USD', 'EUR'))
);
--> statement-breakpoint
CREATE TABLE "financial_institution" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_batch" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"statement_id" text NOT NULL,
	"source_format" text NOT NULL,
	"status" text DEFAULT 'preview' NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"imported_count" integer DEFAULT 0 NOT NULL,
	"ignored_count" integer DEFAULT 0 NOT NULL,
	"mapping_config" jsonb,
	"draft_rows" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_asset" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"ticker" text,
	"asset_class" text NOT NULL,
	"currency" char(3) NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "investment_asset_currency" CHECK ("investment_asset"."currency" in ('BRL', 'USD', 'EUR'))
);
--> statement-breakpoint
CREATE TABLE "investment_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"operation_type" text NOT NULL,
	"operation_date" date NOT NULL,
	"quantity" numeric(20, 8) NOT NULL,
	"unit_price_minor" bigint NOT NULL,
	"fees_minor" bigint DEFAULT 0 NOT NULL,
	"currency" char(3) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "investment_transaction_currency" CHECK ("investment_transaction"."currency" in ('BRL', 'USD', 'EUR')),
	CONSTRAINT "investment_transaction_fees_non_negative" CHECK ("investment_transaction"."fees_minor" >= 0)
);
--> statement-breakpoint
CREATE TABLE "investment_valuation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"valuation_date" date NOT NULL,
	"unit_value_minor" bigint,
	"total_value_minor" bigint,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "investment_valuation_one_value" CHECK (("investment_valuation"."unit_value_minor" is null) <> ("investment_valuation"."total_value_minor" is null)),
	CONSTRAINT "investment_valuation_source" CHECK ("investment_valuation"."source" = 'manual')
);
--> statement-breakpoint
CREATE TABLE "statement_attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"statement_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"checksum" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "statement" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text,
	"credit_card_id" text,
	"reference_month" date NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"due_date" date,
	"declared_total_minor" bigint,
	"currency" char(3) NOT NULL,
	"status" text DEFAULT 'attached' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "statement_one_owner" CHECK (("statement"."account_id" is null) <> ("statement"."credit_card_id" is null)),
	CONSTRAINT "statement_period" CHECK ("statement"."period_start" <= "statement"."period_end"),
	CONSTRAINT "statement_currency" CHECK ("statement"."currency" in ('BRL', 'USD', 'EUR'))
);
--> statement-breakpoint
CREATE TABLE "transaction_category" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"icon" text,
	"parent_id" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text,
	"credit_card_id" text,
	"statement_id" text,
	"import_batch_id" text,
	"transaction_date" date NOT NULL,
	"posted_date" date,
	"description" text NOT NULL,
	"amount_minor" bigint NOT NULL,
	"currency" char(3) NOT NULL,
	"direction" text NOT NULL,
	"type" text NOT NULL,
	"category_id" text,
	"installment_number" integer,
	"installment_total" integer,
	"dedupe_hash" text NOT NULL,
	"external_id" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_one_owner" CHECK (("transaction"."account_id" is null) <> ("transaction"."credit_card_id" is null)),
	CONSTRAINT "transaction_amount_positive" CHECK ("transaction"."amount_minor" > 0),
	CONSTRAINT "transaction_currency" CHECK ("transaction"."currency" in ('BRL', 'USD', 'EUR')),
	CONSTRAINT "transaction_direction" CHECK (("transaction"."type" = 'expense' and "transaction"."direction" = 'outflow')
        or ("transaction"."type" = 'income' and "transaction"."direction" = 'inflow')
        or ("transaction"."type" = 'refund' and "transaction"."direction" = 'inflow')
        or ("transaction"."type" in ('invoice_payment', 'transfer'))),
	CONSTRAINT "transaction_installments" CHECK (("transaction"."installment_number" is null and "transaction"."installment_total" is null)
        or (
          "transaction"."installment_number" is not null
          and "transaction"."installment_total" is not null
          and "transaction"."installment_total" >= 1
          and "transaction"."installment_number" between 1 and "transaction"."installment_total"
        ))
);
--> statement-breakpoint
ALTER TABLE "credit_card" ADD CONSTRAINT "credit_card_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card" ADD CONSTRAINT "credit_card_institution_id_financial_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."financial_institution"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_account" ADD CONSTRAINT "financial_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_account" ADD CONSTRAINT "financial_account_institution_id_financial_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."financial_institution"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_institution" ADD CONSTRAINT "financial_institution_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batch" ADD CONSTRAINT "import_batch_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batch" ADD CONSTRAINT "import_batch_statement_id_statement_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."statement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_asset" ADD CONSTRAINT "investment_asset_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_asset" ADD CONSTRAINT "investment_asset_institution_id_financial_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."financial_institution"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_transaction" ADD CONSTRAINT "investment_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_transaction" ADD CONSTRAINT "investment_transaction_asset_id_investment_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."investment_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_valuation" ADD CONSTRAINT "investment_valuation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_valuation" ADD CONSTRAINT "investment_valuation_asset_id_investment_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."investment_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_attachment" ADD CONSTRAINT "statement_attachment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement_attachment" ADD CONSTRAINT "statement_attachment_statement_id_statement_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."statement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement" ADD CONSTRAINT "statement_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement" ADD CONSTRAINT "statement_account_id_financial_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."financial_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statement" ADD CONSTRAINT "statement_credit_card_id_credit_card_id_fk" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_card"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_category" ADD CONSTRAINT "transaction_category_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_category" ADD CONSTRAINT "transaction_category_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."transaction_category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_account_id_financial_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."financial_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_credit_card_id_credit_card_id_fk" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_card"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_statement_id_statement_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."statement"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_import_batch_id_import_batch_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batch"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_category_id_transaction_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."transaction_category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_card_user_archived_idx" ON "credit_card" USING btree ("user_id","archived_at");--> statement-breakpoint
CREATE INDEX "financial_account_user_archived_idx" ON "financial_account" USING btree ("user_id","archived_at");--> statement-breakpoint
CREATE UNIQUE INDEX "financial_institution_user_name_unique" ON "financial_institution" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE INDEX "import_batch_statement_idx" ON "import_batch" USING btree ("statement_id");--> statement-breakpoint
CREATE INDEX "investment_asset_user_archived_idx" ON "investment_asset" USING btree ("user_id","archived_at");--> statement-breakpoint
CREATE INDEX "investment_transaction_asset_date_idx" ON "investment_transaction" USING btree ("asset_id","operation_date","created_at");--> statement-breakpoint
CREATE INDEX "investment_valuation_asset_date_idx" ON "investment_valuation" USING btree ("asset_id","valuation_date","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "statement_attachment_statement_unique" ON "statement_attachment" USING btree ("statement_id");--> statement-breakpoint
CREATE INDEX "statement_user_month_idx" ON "statement" USING btree ("user_id","reference_month");--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_category_user_name_unique" ON "transaction_category" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE INDEX "transaction_category_user_archived_idx" ON "transaction_category" USING btree ("user_id","archived_at");--> statement-breakpoint
CREATE INDEX "transaction_user_date_idx" ON "transaction" USING btree ("user_id","transaction_date");--> statement-breakpoint
CREATE INDEX "transaction_user_account_idx" ON "transaction" USING btree ("user_id","account_id");--> statement-breakpoint
CREATE INDEX "transaction_user_card_idx" ON "transaction" USING btree ("user_id","credit_card_id");--> statement-breakpoint
CREATE INDEX "transaction_import_batch_idx" ON "transaction" USING btree ("import_batch_id");--> statement-breakpoint
CREATE INDEX "transaction_user_dedupe_idx" ON "transaction" USING btree ("user_id","dedupe_hash");--> statement-breakpoint
CREATE INDEX "transaction_user_external_idx" ON "transaction" USING btree ("user_id","external_id");