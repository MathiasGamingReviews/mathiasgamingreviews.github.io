-- Mathias Gaming Reviews database layout.
-- The site reads public/data/mgr.db directly in the browser (sql.js).
-- Dates are stored as text in the form YYYY-MM-DD.

CREATE TABLE platform (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE                -- e.g. 'PC', 'Nintendo Switch'
);

CREATE TABLE game (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo TEXT NOT NULL                       -- image path under public/, e.g. 'logos/minecraft.svg'
);

CREATE TABLE review (
  id          INTEGER PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,        -- web address of the review: /reviews/<slug>
  game_id     INTEGER NOT NULL REFERENCES game (id),
  platform_id INTEGER NOT NULL REFERENCES platform (id),
  stars       INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  review_date TEXT NOT NULL,
  body        TEXT NOT NULL                -- paragraphs separated by a blank line
);

CREATE TABLE news (
  id        INTEGER PRIMARY KEY,
  title     TEXT NOT NULL,
  body      TEXT NOT NULL,                 -- paragraphs separated by a blank line
  news_date TEXT NOT NULL
);

CREATE INDEX review_date_idx ON review (review_date);
CREATE INDEX news_date_idx ON news (news_date);
