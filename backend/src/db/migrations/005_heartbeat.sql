UPDATE servers SET status = 'inactive' 
WHERE last_seen_at < NOW() - INTERVAL '5 minutes' AND status = 'active'