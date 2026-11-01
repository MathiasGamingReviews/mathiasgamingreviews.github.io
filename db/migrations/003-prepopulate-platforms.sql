-- Platform is a fixed list (lookup table): the edit pages offer these in a drop-down
-- and do not create new ones. To add a platform later, add a new migration like this one.
-- Only names that are not in the table yet are added, so existing reviews keep their platform.
-- The first five keep ids 1-5 in a new database (db/sample-data.sql relies on that).

INSERT INTO platform (name)
SELECT name FROM (
            SELECT 1 AS n, 'PC' AS name
  UNION ALL SELECT 2, 'PlayStation 5'
  UNION ALL SELECT 3, 'Xbox Series X|S'
  UNION ALL SELECT 4, 'Nintendo Switch'
  UNION ALL SELECT 5, 'Mobile'
  UNION ALL SELECT 6, 'Nintendo Switch 2'
  UNION ALL SELECT 7, 'PlayStation 4'
  UNION ALL SELECT 8, 'Xbox One'
  UNION ALL SELECT 9, 'Steam Deck'
  UNION ALL SELECT 10, 'Mac'
  UNION ALL SELECT 11, 'Meta Quest (VR)'
  UNION ALL SELECT 12, 'Browser'
) AS list
WHERE NOT EXISTS (SELECT 1 FROM platform p WHERE p.name = list.name COLLATE NOCASE)
ORDER BY n;
