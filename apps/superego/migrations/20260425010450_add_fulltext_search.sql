ALTER TABLE "Message"
    ADD COLUMN "searchTsv" tsvector
    GENERATED ALWAYS AS (to_tsvector('simple', coalesce("content", ''))) STORED;

CREATE INDEX "Message_searchTsv_idx"
    ON "Message" USING GIN ("searchTsv");

ALTER TABLE "Document"
    ADD COLUMN "searchTsv" tsvector
    GENERATED ALWAYS AS (to_tsvector('simple', coalesce("content", ''))) STORED;

CREATE INDEX "Document_searchTsv_idx"
    ON "Document" USING GIN ("searchTsv");
