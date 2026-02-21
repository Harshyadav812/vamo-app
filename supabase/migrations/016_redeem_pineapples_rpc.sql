-- 016: redeem_pineapples RPC and balance_after

ALTER TABLE public.reward_ledger ADD COLUMN IF NOT EXISTS balance_after integer;

CREATE OR REPLACE FUNCTION redeem_pineapples(
  p_user_id uuid,
  p_amount int,
  p_idempotency_key text
) RETURNS json AS $$
DECLARE
  v_current_balance int;
  v_new_balance int;
  v_redemption_id uuid;
BEGIN
  -- 1. Lock the profile row for update
  SELECT pineapple_balance INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  v_new_balance := v_current_balance - p_amount;

  -- 2. Update balance
  UPDATE public.profiles
  SET pineapple_balance = v_new_balance
  WHERE id = p_user_id;

  -- 3. Create redemption record
  INSERT INTO public.redemptions (user_id, amount, status)
  VALUES (p_user_id, p_amount, 'pending')
  RETURNING id INTO v_redemption_id;

  -- 4. Insert ledger entry
  BEGIN
    INSERT INTO public.reward_ledger (
      user_id, event_type, amount, idempotency_key, balance_after
    ) VALUES (
      p_user_id, 'reward_redeemed', -p_amount, p_idempotency_key, v_new_balance
    );
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'Duplicate idempotency key';
  END;

  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'redemption_id', v_redemption_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
