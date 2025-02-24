-- Function to increment user balance
CREATE OR REPLACE FUNCTION increment_balance(user_id bigint, amount bigint)
RETURNS bigint
LANGUAGE sql
AS $$
  UPDATE users
  SET balance = balance + amount
  WHERE user_id = increment_balance.user_id
  RETURNING balance;
$$; 