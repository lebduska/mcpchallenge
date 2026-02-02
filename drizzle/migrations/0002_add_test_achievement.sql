-- Test migration for CI/CD pipeline verification
INSERT OR IGNORE INTO achievements (id, name, description, icon, category, points, rarity)
VALUES ('pipeline-test', 'Pipeline Pioneer', 'Verified the CI/CD migration pipeline works', '🔧', 'special', 10, 'common');
