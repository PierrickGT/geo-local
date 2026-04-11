-- edits: canonical event log of GRC-20 encoded edits
CREATE TABLE IF NOT EXISTS edits (
  id          char(32) PRIMARY KEY,
  space_id    char(32) NOT NULL,
  author      text NOT NULL DEFAULT '',
  name        text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'processing', 'applied', 'failed')),
  blob        bytea NOT NULL,
  op_count    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  applied_at  timestamptz,
  error_msg   text
);
CREATE INDEX IF NOT EXISTS idx_edits_status ON edits (status) WHERE status = 'pending';

-- entities: materialized graph entities
CREATE TABLE IF NOT EXISTS entities (
  id          char(32) PRIMARY KEY,
  space_id    char(32),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- triples: property values on entities
CREATE TABLE IF NOT EXISTS triples (
  entity_id   char(32) NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  property_id char(32) NOT NULL,
  value_type  text NOT NULL,
  value       jsonb NOT NULL,
  language    char(32) NOT NULL DEFAULT '',
  PRIMARY KEY (entity_id, property_id, language)
);
CREATE INDEX IF NOT EXISTS idx_triples_property ON triples (property_id);

-- relations: directed edges between entities
CREATE TABLE IF NOT EXISTS relations (
  id              char(32) PRIMARY KEY,
  relation_type   char(32) NOT NULL,
  from_id         char(32) NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  to_id           char(32) NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  position        text,
  from_space      char(32),
  from_version    char(32),
  to_space        char(32),
  to_version      char(32),
  entity_id       char(32),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_relations_from ON relations (from_id);
CREATE INDEX IF NOT EXISTS idx_relations_to ON relations (to_id);
CREATE INDEX IF NOT EXISTS idx_relations_type ON relations (relation_type);

-- value_refs: referenceable value slots
CREATE TABLE IF NOT EXISTS value_refs (
  id          char(32) PRIMARY KEY,
  entity_id   char(32) NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  property_id char(32) NOT NULL,
  language    char(32),
  space_id    char(32)
);
