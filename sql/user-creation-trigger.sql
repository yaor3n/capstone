CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (user_id, username, email, role, pfp_url, google_id, approved, created_at)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username', NEW.email, 'student', NULL, NEW.raw_user_meta_data ->> 'google_id', TRUE, NEW.created_at);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_user();
