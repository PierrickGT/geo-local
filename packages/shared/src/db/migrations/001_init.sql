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
  error_msg   text,
  decoded_ops jsonb
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

-- ---------------------------------------------------------------------------
-- Seed system entities (from @geoprotocol/geo-sdk SystemIds)
-- These are well-known entities that exist in the Geo network but are never
-- synced via edits, so we seed them here to keep the DB self-consistent.
-- ---------------------------------------------------------------------------

INSERT INTO entities (id) VALUES
  ('e7d737c536764c609fa16aa64a8c90ad'),  -- Type
  ('a35e058b52d148d2b02d773933d90b7e'),  -- Data type
  ('5338cc2897044e96b5477dfc58da6fc7'),  -- Renderable type
  ('9edb6fcce4544aa5861139d7f024c010'),  -- Text
  ('808a04ceb21c4d888ad12e240613e5ca'),  -- Property
  ('7aa4792eeacd41868272fa7fc18298ac'),  -- Boolean
  ('149fd752d9d04f80820d1d942eea7841'),  -- Integer
  ('9b597aaec31c46c88565a370da0c2a65'),  -- Float
  ('a3288c22a0564f6fb409fbcccb2c118c'),  -- Decimal
  ('e661d10292794449a22367dbae1be05a'),  -- Date
  ('ad75102b03c04d59903813ede9482742'),  -- Time
  ('167664f668f840e1976b20bd16ed8d47'),  -- Datetime
  ('caf4dd12ba4844b99171aff6c1313b50'),  -- Schedule
  ('66b433247667496899b48a89bd1de22b'),  -- Bytes
  ('f3f790c4c74e4d23a0a91e8ef84e30d9'),  -- Image
  ('283127c96142468492ed90b0ebc7f29a'),  -- URL
  ('df250d17e364413d97792ddaae841e34'),  -- Point
  ('4b6d9fc1fbfe474c861c83398e1b50d9'),  -- Relation
  -- Property entities (already used as property_id in triples throughout the system)
  ('a126ca530c8e48d5b88882c734c38935'),  -- Name
  ('9b1f76ff9711404c861e59dc3fa7d037'),  -- Description
  ('8f151ba4de204e3c9cb499ddf96f48f1'),  -- Types
  ('6d29d57849bb4959baf72cc696b1671a'),  -- Data type (property)
  ('01412f8381894ab1836565c7fd358cc1'),  -- Properties
  ('a99f9ce12ffa4dac8c61f6310d46064a'),  -- Collection item
  ('362c1dbddc6444bba3c4652f38a642d7'),  -- Space
  -- Property-schema entities (metadata properties on Property/Relation types)
  ('2316bbe1c76f463583f23e03b4f1fe46'),  -- Renderable type (property)
  ('34f535072e6b42c5a84443981a77cfa2'),  -- Cover
  ('9eea393f17dd4971a62ea603e8bfec20'),  -- To entity types
  ('d2c1a10114e3464a8272f4e75b0f1407'),  -- Is type property
  ('f394b9b4420d4ab4bceb81ded11df4d5'),  -- Relation entity types
  ('c321a10651d846bf98a9ad68a33658f7'),  -- Related properties
  -- Additional data types
  ('f732849378ba4577a33fac5f1c964f18'),  -- Embedding
  -- Content types and properties
  ('e0fcc66c9e8643f480802469d8a1a93a'),  -- Tag (type)
  ('257090341ba5406f94e4d4af90042fba')   -- Tags (property)
ON CONFLICT DO NOTHING;

-- English language ID (from @geoprotocol/grc-20 languages.english())
-- derived_uuid("grc20:genesis:language:en") = 090adac0fca4822e8e719263e67620ec
-- Base64 of the 16-byte ID: CQrawPykgi6OcZJj5nYg7A==

-- NAME property ID: a126ca530c8e48d5b88882c734c38935
INSERT INTO triples (entity_id, property_id, value_type, value, language) VALUES
  ('e7d737c536764c609fa16aa64a8c90ad', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Type","language":"CQrawPykgi6OcZJj5nYg7A=="}',           '090adac0fca4822e8e719263e67620ec'),
  ('a35e058b52d148d2b02d773933d90b7e', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Data type","language":"CQrawPykgi6OcZJj5nYg7A=="}',      '090adac0fca4822e8e719263e67620ec'),
  ('5338cc2897044e96b5477dfc58da6fc7', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Renderable type","language":"CQrawPykgi6OcZJj5nYg7A=="}', '090adac0fca4822e8e719263e67620ec'),
  ('9edb6fcce4544aa5861139d7f024c010', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Text","language":"CQrawPykgi6OcZJj5nYg7A=="}',           '090adac0fca4822e8e719263e67620ec'),
  ('808a04ceb21c4d888ad12e240613e5ca', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Property","language":"CQrawPykgi6OcZJj5nYg7A=="}',     '090adac0fca4822e8e719263e67620ec'),
  ('7aa4792eeacd41868272fa7fc18298ac', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Checkbox","language":"CQrawPykgi6OcZJj5nYg7A=="}',      '090adac0fca4822e8e719263e67620ec'),
  ('149fd752d9d04f80820d1d942eea7841', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Integer","language":"CQrawPykgi6OcZJj5nYg7A=="}',      '090adac0fca4822e8e719263e67620ec'),
  ('9b597aaec31c46c88565a370da0c2a65', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Float","language":"CQrawPykgi6OcZJj5nYg7A=="}',        '090adac0fca4822e8e719263e67620ec'),
  ('a3288c22a0564f6fb409fbcccb2c118c', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Decimal","language":"CQrawPykgi6OcZJj5nYg7A=="}',      '090adac0fca4822e8e719263e67620ec'),
  ('e661d10292794449a22367dbae1be05a', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Date","language":"CQrawPykgi6OcZJj5nYg7A=="}',         '090adac0fca4822e8e719263e67620ec'),
  ('ad75102b03c04d59903813ede9482742', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Time","language":"CQrawPykgi6OcZJj5nYg7A=="}',         '090adac0fca4822e8e719263e67620ec'),
  ('167664f668f840e1976b20bd16ed8d47', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Datetime","language":"CQrawPykgi6OcZJj5nYg7A=="}',     '090adac0fca4822e8e719263e67620ec'),
  ('caf4dd12ba4844b99171aff6c1313b50', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Schedule","language":"CQrawPykgi6OcZJj5nYg7A=="}',     '090adac0fca4822e8e719263e67620ec'),
  ('66b433247667496899b48a89bd1de22b', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Bytes","language":"CQrawPykgi6OcZJj5nYg7A=="}',        '090adac0fca4822e8e719263e67620ec'),
  ('f3f790c4c74e4d23a0a91e8ef84e30d9', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Image","language":"CQrawPykgi6OcZJj5nYg7A=="}',        '090adac0fca4822e8e719263e67620ec'),
  ('283127c96142468492ed90b0ebc7f29a', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"URL","language":"CQrawPykgi6OcZJj5nYg7A=="}',          '090adac0fca4822e8e719263e67620ec'),
  ('df250d17e364413d97792ddaae841e34', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Point","language":"CQrawPykgi6OcZJj5nYg7A=="}',        '090adac0fca4822e8e719263e67620ec'),
  ('4b6d9fc1fbfe474c861c83398e1b50d9', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Relation","language":"CQrawPykgi6OcZJj5nYg7A=="}',     '090adac0fca4822e8e719263e67620ec'),
  ('a126ca530c8e48d5b88882c734c38935', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Name","language":"CQrawPykgi6OcZJj5nYg7A=="}',           '090adac0fca4822e8e719263e67620ec'),
  ('9b1f76ff9711404c861e59dc3fa7d037', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Description","language":"CQrawPykgi6OcZJj5nYg7A=="}',    '090adac0fca4822e8e719263e67620ec'),
  ('8f151ba4de204e3c9cb499ddf96f48f1', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Types","language":"CQrawPykgi6OcZJj5nYg7A=="}',          '090adac0fca4822e8e719263e67620ec'),
  ('6d29d57849bb4959baf72cc696b1671a', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Data type","language":"CQrawPykgi6OcZJj5nYg7A=="}',      '090adac0fca4822e8e719263e67620ec'),
  ('01412f8381894ab1836565c7fd358cc1', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Properties","language":"CQrawPykgi6OcZJj5nYg7A=="}',     '090adac0fca4822e8e719263e67620ec'),
  ('a99f9ce12ffa4dac8c61f6310d46064a', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Collection item","language":"CQrawPykgi6OcZJj5nYg7A=="}', '090adac0fca4822e8e719263e67620ec'),
  ('362c1dbddc6444bba3c4652f38a642d7', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Space","language":"CQrawPykgi6OcZJj5nYg7A=="}',           '090adac0fca4822e8e719263e67620ec'),
  -- Property-schema entities
  ('2316bbe1c76f463583f23e03b4f1fe46', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Renderable type","language":"CQrawPykgi6OcZJj5nYg7A=="}', '090adac0fca4822e8e719263e67620ec'),
  ('34f535072e6b42c5a84443981a77cfa2', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Cover","language":"CQrawPykgi6OcZJj5nYg7A=="}',           '090adac0fca4822e8e719263e67620ec'),
  ('9eea393f17dd4971a62ea603e8bfec20', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"To entity types","language":"CQrawPykgi6OcZJj5nYg7A=="}', '090adac0fca4822e8e719263e67620ec'),
  ('d2c1a10114e3464a8272f4e75b0f1407', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Is type property","language":"CQrawPykgi6OcZJj5nYg7A=="}', '090adac0fca4822e8e719263e67620ec'),
  ('f394b9b4420d4ab4bceb81ded11df4d5', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Relation entity types","language":"CQrawPykgi6OcZJj5nYg7A=="}', '090adac0fca4822e8e719263e67620ec'),
  ('c321a10651d846bf98a9ad68a33658f7', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Related properties","language":"CQrawPykgi6OcZJj5nYg7A=="}', '090adac0fca4822e8e719263e67620ec'),
  ('f732849378ba4577a33fac5f1c964f18', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Embedding","language":"CQrawPykgi6OcZJj5nYg7A=="}',     '090adac0fca4822e8e719263e67620ec'),
  -- Content types and properties
  ('e0fcc66c9e8643f480802469d8a1a93a', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Tag","language":"CQrawPykgi6OcZJj5nYg7A=="}',            '090adac0fca4822e8e719263e67620ec'),
  ('257090341ba5406f94e4d4af90042fba', 'a126ca530c8e48d5b88882c734c38935', 'text', '{"value":"Tags","language":"CQrawPykgi6OcZJj5nYg7A=="}',           '090adac0fca4822e8e719263e67620ec')
ON CONFLICT DO NOTHING;

-- DESCRIPTION property ID: 9b1f76ff9711404c861e59dc3fa7d037
INSERT INTO triples (entity_id, property_id, value_type, value, language) VALUES
  ('149fd752d9d04f80820d1d942eea7841', '9b1f76ff9711404c861e59dc3fa7d037', 'text', '{"value":"64-bit signed integer","language":"CQrawPykgi6OcZJj5nYg7A=="}',                '090adac0fca4822e8e719263e67620ec'),
  ('a3288c22a0564f6fb409fbcccb2c118c', '9b1f76ff9711404c861e59dc3fa7d037', 'text', '{"value":"Arbitrary-precision decimal","language":"CQrawPykgi6OcZJj5nYg7A=="}',                '090adac0fca4822e8e719263e67620ec'),
  ('e661d10292794449a22367dbae1be05a', '9b1f76ff9711404c861e59dc3fa7d037', 'text', '{"value":"ISO 8601 date (year, year-month, or year-month-day)","language":"CQrawPykgi6OcZJj5nYg7A=="}', '090adac0fca4822e8e719263e67620ec'),
  ('ad75102b03c04d59903813ede9482742', '9b1f76ff9711404c861e59dc3fa7d037', 'text', '{"value":"ISO 8601 time with timezone","language":"CQrawPykgi6OcZJj5nYg7A=="}',                '090adac0fca4822e8e719263e67620ec'),
  ('caf4dd12ba4844b99171aff6c1313b50', '9b1f76ff9711404c861e59dc3fa7d037', 'text', '{"value":"RFC 5545 schedule or availability","language":"CQrawPykgi6OcZJj5nYg7A=="}',             '090adac0fca4822e8e719263e67620ec'),
  ('66b433247667496899b48a89bd1de22b', '9b1f76ff9711404c861e59dc3fa7d037', 'text', '{"value":"Opaque byte array","language":"CQrawPykgi6OcZJj5nYg7A=="}',                             '090adac0fca4822e8e719263e67620ec'),
  -- Property-schema entities
  ('9eea393f17dd4971a62ea603e8bfec20', '9b1f76ff9711404c861e59dc3fa7d037', 'text', '{"value":"Defines the entity type options for a relation''s to entity","language":"CQrawPykgi6OcZJj5nYg7A=="}',     '090adac0fca4822e8e719263e67620ec'),
  ('f394b9b4420d4ab4bceb81ded11df4d5', '9b1f76ff9711404c861e59dc3fa7d037', 'text', '{"value":"Defines the entity type options for a relation''s relation entity","language":"CQrawPykgi6OcZJj5nYg7A=="}', '090adac0fca4822e8e719263e67620ec'),
  ('c321a10651d846bf98a9ad68a33658f7', '9b1f76ff9711404c861e59dc3fa7d037', 'text', '{"value":"Related properties may share a relation entity when created between the same two entities","language":"CQrawPykgi6OcZJj5nYg7A=="}', '090adac0fca4822e8e719263e67620ec'),
  ('f732849378ba4577a33fac5f1c964f18', '9b1f76ff9711404c861e59dc3fa7d037', 'text', '{"value":"Dense vector","language":"CQrawPykgi6OcZJj5nYg7A=="}', '090adac0fca4822e8e719263e67620ec')
ON CONFLICT DO NOTHING;

-- TYPE relations for data type entities
-- relation_type = TYPES_PROPERTY_ID (8f151ba4de204e3c9cb499ddf96f48f1)
-- Each data type entity points to both the "Type" entity and the "Data type" entity
-- Relation IDs use a reserved sequential namespace (00...0001–0028) that won't collide with GRC-20 hashes
INSERT INTO relations (id, relation_type, from_id, to_id) VALUES
  -- → Type (e7d737c536764c609fa16aa64a8c90ad)
  ('00000000000000000000000000000001', '8f151ba4de204e3c9cb499ddf96f48f1', '9edb6fcce4544aa5861139d7f024c010', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Text
  ('00000000000000000000000000000002', '8f151ba4de204e3c9cb499ddf96f48f1', '7aa4792eeacd41868272fa7fc18298ac', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Boolean
  ('00000000000000000000000000000003', '8f151ba4de204e3c9cb499ddf96f48f1', '149fd752d9d04f80820d1d942eea7841', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Integer
  ('00000000000000000000000000000004', '8f151ba4de204e3c9cb499ddf96f48f1', '9b597aaec31c46c88565a370da0c2a65', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Float
  ('00000000000000000000000000000005', '8f151ba4de204e3c9cb499ddf96f48f1', 'a3288c22a0564f6fb409fbcccb2c118c', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Decimal
  ('00000000000000000000000000000006', '8f151ba4de204e3c9cb499ddf96f48f1', 'e661d10292794449a22367dbae1be05a', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Date
  ('00000000000000000000000000000007', '8f151ba4de204e3c9cb499ddf96f48f1', 'ad75102b03c04d59903813ede9482742', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Time
  ('00000000000000000000000000000008', '8f151ba4de204e3c9cb499ddf96f48f1', '167664f668f840e1976b20bd16ed8d47', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Datetime
  ('00000000000000000000000000000009', '8f151ba4de204e3c9cb499ddf96f48f1', 'caf4dd12ba4844b99171aff6c1313b50', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Schedule
  ('00000000000000000000000000000010', '8f151ba4de204e3c9cb499ddf96f48f1', '66b433247667496899b48a89bd1de22b', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Bytes
  ('00000000000000000000000000000013', '8f151ba4de204e3c9cb499ddf96f48f1', 'df250d17e364413d97792ddaae841e34', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Point
  ('00000000000000000000000000000014', '8f151ba4de204e3c9cb499ddf96f48f1', '4b6d9fc1fbfe474c861c83398e1b50d9', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Relation
  -- → Data type (a35e058b52d148d2b02d773933d90b7e)
  ('00000000000000000000000000000015', '8f151ba4de204e3c9cb499ddf96f48f1', '9edb6fcce4544aa5861139d7f024c010', 'a35e058b52d148d2b02d773933d90b7e'),  -- Text
  ('00000000000000000000000000000016', '8f151ba4de204e3c9cb499ddf96f48f1', '7aa4792eeacd41868272fa7fc18298ac', 'a35e058b52d148d2b02d773933d90b7e'),  -- Boolean
  ('00000000000000000000000000000017', '8f151ba4de204e3c9cb499ddf96f48f1', '149fd752d9d04f80820d1d942eea7841', 'a35e058b52d148d2b02d773933d90b7e'),  -- Integer
  ('00000000000000000000000000000018', '8f151ba4de204e3c9cb499ddf96f48f1', '9b597aaec31c46c88565a370da0c2a65', 'a35e058b52d148d2b02d773933d90b7e'),  -- Float
  ('00000000000000000000000000000019', '8f151ba4de204e3c9cb499ddf96f48f1', 'a3288c22a0564f6fb409fbcccb2c118c', 'a35e058b52d148d2b02d773933d90b7e'),  -- Decimal
  ('00000000000000000000000000000020', '8f151ba4de204e3c9cb499ddf96f48f1', 'e661d10292794449a22367dbae1be05a', 'a35e058b52d148d2b02d773933d90b7e'),  -- Date
  ('00000000000000000000000000000021', '8f151ba4de204e3c9cb499ddf96f48f1', 'ad75102b03c04d59903813ede9482742', 'a35e058b52d148d2b02d773933d90b7e'),  -- Time
  ('00000000000000000000000000000022', '8f151ba4de204e3c9cb499ddf96f48f1', '167664f668f840e1976b20bd16ed8d47', 'a35e058b52d148d2b02d773933d90b7e'),  -- Datetime
  ('00000000000000000000000000000023', '8f151ba4de204e3c9cb499ddf96f48f1', 'caf4dd12ba4844b99171aff6c1313b50', 'a35e058b52d148d2b02d773933d90b7e'),  -- Schedule
  ('00000000000000000000000000000024', '8f151ba4de204e3c9cb499ddf96f48f1', '66b433247667496899b48a89bd1de22b', 'a35e058b52d148d2b02d773933d90b7e'),  -- Bytes
  ('00000000000000000000000000000027', '8f151ba4de204e3c9cb499ddf96f48f1', 'df250d17e364413d97792ddaae841e34', 'a35e058b52d148d2b02d773933d90b7e'),  -- Point
  ('00000000000000000000000000000028', '8f151ba4de204e3c9cb499ddf96f48f1', '4b6d9fc1fbfe474c861c83398e1b50d9', 'a35e058b52d148d2b02d773933d90b7e'),  -- Relation
  -- → Renderable type (5338cc2897044e96b5477dfc58da6fc7)
  ('00000000000000000000000000000029', '8f151ba4de204e3c9cb499ddf96f48f1', 'f3f790c4c74e4d23a0a91e8ef84e30d9', '5338cc2897044e96b5477dfc58da6fc7'),  -- Image
  ('00000000000000000000000000000030', '8f151ba4de204e3c9cb499ddf96f48f1', '283127c96142468492ed90b0ebc7f29a', '5338cc2897044e96b5477dfc58da6fc7'),  -- URL
  -- Property entities → Property (808a04ceb21c4d888ad12e240613e5ca)
  ('00000000000000000000000000000031', '8f151ba4de204e3c9cb499ddf96f48f1', 'a126ca530c8e48d5b88882c734c38935', '808a04ceb21c4d888ad12e240613e5ca'),  -- Name
  ('00000000000000000000000000000032', '8f151ba4de204e3c9cb499ddf96f48f1', '9b1f76ff9711404c861e59dc3fa7d037', '808a04ceb21c4d888ad12e240613e5ca'),  -- Description
  ('00000000000000000000000000000033', '8f151ba4de204e3c9cb499ddf96f48f1', '8f151ba4de204e3c9cb499ddf96f48f1', '808a04ceb21c4d888ad12e240613e5ca'),  -- Types
  ('00000000000000000000000000000034', '8f151ba4de204e3c9cb499ddf96f48f1', '6d29d57849bb4959baf72cc696b1671a', '808a04ceb21c4d888ad12e240613e5ca'),  -- Data type (property)
  ('00000000000000000000000000000035', '8f151ba4de204e3c9cb499ddf96f48f1', '01412f8381894ab1836565c7fd358cc1', '808a04ceb21c4d888ad12e240613e5ca'),  -- Properties
  ('00000000000000000000000000000036', '8f151ba4de204e3c9cb499ddf96f48f1', 'a99f9ce12ffa4dac8c61f6310d46064a', '808a04ceb21c4d888ad12e240613e5ca'),  -- Collection item
  -- Relation-type property entities → Relation (4b6d9fc1fbfe474c861c83398e1b50d9)
  ('00000000000000000000000000000037', '8f151ba4de204e3c9cb499ddf96f48f1', '8f151ba4de204e3c9cb499ddf96f48f1', '4b6d9fc1fbfe474c861c83398e1b50d9'),  -- Types
  ('00000000000000000000000000000038', '8f151ba4de204e3c9cb499ddf96f48f1', '6d29d57849bb4959baf72cc696b1671a', '4b6d9fc1fbfe474c861c83398e1b50d9'),  -- Data type (property)
  ('00000000000000000000000000000039', '8f151ba4de204e3c9cb499ddf96f48f1', '01412f8381894ab1836565c7fd358cc1', '4b6d9fc1fbfe474c861c83398e1b50d9'),  -- Properties
  ('00000000000000000000000000000040', '8f151ba4de204e3c9cb499ddf96f48f1', 'a99f9ce12ffa4dac8c61f6310d46064a', '4b6d9fc1fbfe474c861c83398e1b50d9'),  -- Collection item
  -- Space → Type (e7d737c536764c609fa16aa64a8c90ad)
  ('00000000000000000000000000000041', '8f151ba4de204e3c9cb499ddf96f48f1', '362c1dbddc6444bba3c4652f38a642d7', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Space
  -- Embedding → Type + Data type
  ('00000000000000000000000000000042', '8f151ba4de204e3c9cb499ddf96f48f1', 'f732849378ba4577a33fac5f1c964f18', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Embedding → Type
  ('00000000000000000000000000000043', '8f151ba4de204e3c9cb499ddf96f48f1', 'f732849378ba4577a33fac5f1c964f18', 'a35e058b52d148d2b02d773933d90b7e'),  -- Embedding → Data type
  -- Property-schema entities → Property (808a04ceb21c4d888ad12e240613e5ca) + Type
  ('00000000000000000000000000000044', '8f151ba4de204e3c9cb499ddf96f48f1', '2316bbe1c76f463583f23e03b4f1fe46', '808a04ceb21c4d888ad12e240613e5ca'),  -- Renderable type → Property
  ('00000000000000000000000000000045', '8f151ba4de204e3c9cb499ddf96f48f1', '34f535072e6b42c5a84443981a77cfa2', '808a04ceb21c4d888ad12e240613e5ca'),  -- Cover → Property
  ('00000000000000000000000000000046', '8f151ba4de204e3c9cb499ddf96f48f1', '2316bbe1c76f463583f23e03b4f1fe46', '4b6d9fc1fbfe474c861c83398e1b50d9'),  -- Renderable type → Relation
  ('00000000000000000000000000000047', '8f151ba4de204e3c9cb499ddf96f48f1', '2316bbe1c76f463583f23e03b4f1fe46', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Renderable type → Type
  ('00000000000000000000000000000048', '8f151ba4de204e3c9cb499ddf96f48f1', '34f535072e6b42c5a84443981a77cfa2', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Cover → Type
  -- Cover → Image (renderable type relation via Renderable type property)
  ('00000000000000000000000000000057', '2316bbe1c76f463583f23e03b4f1fe46', '34f535072e6b42c5a84443981a77cfa2', 'f3f790c4c74e4d23a0a91e8ef84e30d9'),  -- Cover → Image
  -- Tag → Type
  ('00000000000000000000000000000058', '8f151ba4de204e3c9cb499ddf96f48f1', 'e0fcc66c9e8643f480802469d8a1a93a', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Tag → Type
  -- Tags → Property + Relation + Type
  ('00000000000000000000000000000059', '8f151ba4de204e3c9cb499ddf96f48f1', '257090341ba5406f94e4d4af90042fba', '808a04ceb21c4d888ad12e240613e5ca'),  -- Tags → Property
  ('00000000000000000000000000000060', '8f151ba4de204e3c9cb499ddf96f48f1', '257090341ba5406f94e4d4af90042fba', '4b6d9fc1fbfe474c861c83398e1b50d9'),  -- Tags → Relation
  ('00000000000000000000000000000061', '8f151ba4de204e3c9cb499ddf96f48f1', '257090341ba5406f94e4d4af90042fba', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Tags → Type
  -- Tags → Tag (to entity types relation)
  ('00000000000000000000000000000062', '9eea393f17dd4971a62ea603e8bfec20', '257090341ba5406f94e4d4af90042fba', 'e0fcc66c9e8643f480802469d8a1a93a'),  -- Tags → Tag
  -- Relation-schema entities → Relation (4b6d9fc1fbfe474c861c83398e1b50d9) + Type
  ('00000000000000000000000000000049', '8f151ba4de204e3c9cb499ddf96f48f1', '9eea393f17dd4971a62ea603e8bfec20', '4b6d9fc1fbfe474c861c83398e1b50d9'),  -- To entity types → Relation
  ('00000000000000000000000000000050', '8f151ba4de204e3c9cb499ddf96f48f1', '9eea393f17dd4971a62ea603e8bfec20', 'e7d737c536764c609fa16aa64a8c90ad'),  -- To entity types → Type
  ('00000000000000000000000000000051', '8f151ba4de204e3c9cb499ddf96f48f1', 'd2c1a10114e3464a8272f4e75b0f1407', '808a04ceb21c4d888ad12e240613e5ca'),  -- Is type property → Property
  ('00000000000000000000000000000052', '8f151ba4de204e3c9cb499ddf96f48f1', 'd2c1a10114e3464a8272f4e75b0f1407', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Is type property → Type
  ('00000000000000000000000000000053', '8f151ba4de204e3c9cb499ddf96f48f1', 'f394b9b4420d4ab4bceb81ded11df4d5', '4b6d9fc1fbfe474c861c83398e1b50d9'),  -- Relation entity types → Relation
  ('00000000000000000000000000000054', '8f151ba4de204e3c9cb499ddf96f48f1', 'f394b9b4420d4ab4bceb81ded11df4d5', 'e7d737c536764c609fa16aa64a8c90ad'),  -- Relation entity types → Type
  ('00000000000000000000000000000055', '8f151ba4de204e3c9cb499ddf96f48f1', 'c321a10651d846bf98a9ad68a33658f7', '4b6d9fc1fbfe474c861c83398e1b50d9'),  -- Related properties → Relation
  ('00000000000000000000000000000056', '8f151ba4de204e3c9cb499ddf96f48f1', 'c321a10651d846bf98a9ad68a33658f7', 'e7d737c536764c609fa16aa64a8c90ad')   -- Related properties → Type
ON CONFLICT DO NOTHING;
