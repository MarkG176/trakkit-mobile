
-- Clean up duplicate survey responses for agent 7a247be3-d97e-4d51-bdcc-b30a7433e41f on 2026-03-19
-- Keep only the earliest record from each submission cluster (within 10 seconds)
-- Cluster 1 (completed_at ~06:18:24): keep e347da65, delete b687efb8, 80d9e17d
-- Cluster 2 (completed_at ~06:18:49): keep f8e80265, delete dd1467eb, efadf66e, b196a535
DELETE FROM survey_responses
WHERE id IN (
  'b687efb8-5ca0-44d0-b58a-648a53a3a3ba',
  '80d9e17d-532a-47c7-8c77-fe2fa73a79db',
  'dd1467eb-4b22-49fe-baa6-6c2ab4c7bc8c',
  'efadf66e-70ac-42a4-bd4e-f5d3cec6ea09',
  'b196a535-f7df-4026-873a-f71670192e7c'
);
