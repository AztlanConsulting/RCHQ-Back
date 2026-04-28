-- AlterTable
ALTER TABLE "employee" ADD COLUMN     "end_date" DATE;

-- CreateTable
CREATE TABLE "blacklist" (
    "blacklist_id" UUID NOT NULL,
    "curp" VARCHAR(18) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "surname" VARCHAR(50) NOT NULL,
    "reason" VARCHAR(250) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "blacklist_pk" PRIMARY KEY ("blacklist_id")
);
