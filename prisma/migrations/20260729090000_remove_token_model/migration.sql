-- Remove the stateful Token model (auth is now stateless JWT)
DROP TABLE IF EXISTS "tokens";
DROP TYPE IF EXISTS "TokenType";
