-- ============================================================================
-- FRQNCY Social Platform Schema Migration
-- 001_social_schema.sql
-- ============================================================================

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- profiles (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    wallet_address TEXT UNIQUE,
    post_count INT DEFAULT 0,
    follower_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    karma INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- posts
CREATE TABLE public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) <= 2000),
    media_urls JSONB DEFAULT '[]'::jsonb,
    link_url TEXT,
    link_preview JSONB,
    project_tag TEXT,
    project_tier TEXT,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    bookmarks_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- follows
CREATE TABLE public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- friendships
CREATE TABLE public.friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')) DEFAULT 'pending',
    initiated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ,
    UNIQUE (user_a_id, user_b_id),
    CHECK (user_a_id < user_b_id)
);

-- likes
CREATE TABLE public.likes (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);

-- comments (with threaded replies via parent_id)
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) <= 1000),
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- bookmarks
CREATE TABLE public.bookmarks (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);

-- conversations
CREATE TABLE public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- conversation_members
CREATE TABLE public.conversation_members (
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ,
    PRIMARY KEY (conversation_id, user_id)
);

-- messages
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- notifications
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'friend_request', 'friend_accept', 'mention', 'message')),
    ref_type TEXT,
    ref_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================================
-- 2. INDEXES
-- ============================================================================

-- Feed: posts by author + recency
CREATE INDEX idx_posts_author_created ON public.posts (author_id, created_at DESC);

-- User posts
CREATE INDEX idx_posts_author ON public.posts (author_id);

-- Posts by project tag
CREATE INDEX idx_posts_project_tag ON public.posts (project_tag) WHERE project_tag IS NOT NULL;

-- Notifications: user's unread first, then by recency
CREATE INDEX idx_notifications_target ON public.notifications (target_user_id, is_read, created_at DESC);

-- Messages: conversation thread ordered by time
CREATE INDEX idx_messages_conversation ON public.messages (conversation_id, created_at DESC);

-- Follows reverse lookup (who follows a given user)
CREATE INDEX idx_follows_following ON public.follows (following_id);

-- Comments by post ordered by time
CREATE INDEX idx_comments_post ON public.comments (post_id, created_at ASC);

-- Comments threaded replies
CREATE INDEX idx_comments_parent ON public.comments (parent_id) WHERE parent_id IS NOT NULL;

-- Conversation members by user (find all conversations for a user)
CREATE INDEX idx_conversation_members_user ON public.conversation_members (user_id);

-- Friendships by each participant
CREATE INDEX idx_friendships_user_a ON public.friendships (user_a_id);
CREATE INDEX idx_friendships_user_b ON public.friendships (user_b_id);

-- Notifications actor lookup
CREATE INDEX idx_notifications_actor ON public.notifications (actor_id);

-- Posts recency (global feed)
CREATE INDEX idx_posts_created ON public.posts (created_at DESC);


-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- profiles
-- -------------------------------------------------------------------------
CREATE POLICY "profiles_select_all"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow the trigger to insert profiles on signup
CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- -------------------------------------------------------------------------
-- posts
-- -------------------------------------------------------------------------
CREATE POLICY "posts_select_all"
    ON public.posts FOR SELECT
    USING (true);

CREATE POLICY "posts_insert_own"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "posts_update_own"
    ON public.posts FOR UPDATE
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "posts_delete_own"
    ON public.posts FOR DELETE
    USING (auth.uid() = author_id);

-- -------------------------------------------------------------------------
-- follows
-- -------------------------------------------------------------------------
CREATE POLICY "follows_select_all"
    ON public.follows FOR SELECT
    USING (true);

CREATE POLICY "follows_insert_own"
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete_own"
    ON public.follows FOR DELETE
    USING (auth.uid() = follower_id);

-- -------------------------------------------------------------------------
-- friendships
-- -------------------------------------------------------------------------
CREATE POLICY "friendships_select_own"
    ON public.friendships FOR SELECT
    USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "friendships_insert_auth"
    ON public.friendships FOR INSERT
    WITH CHECK (auth.uid() = initiated_by);

CREATE POLICY "friendships_update_own"
    ON public.friendships FOR UPDATE
    USING (auth.uid() = user_a_id OR auth.uid() = user_b_id)
    WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- -------------------------------------------------------------------------
-- likes
-- -------------------------------------------------------------------------
CREATE POLICY "likes_select_all"
    ON public.likes FOR SELECT
    USING (true);

CREATE POLICY "likes_insert_own"
    ON public.likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_own"
    ON public.likes FOR DELETE
    USING (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- comments
-- -------------------------------------------------------------------------
CREATE POLICY "comments_select_all"
    ON public.comments FOR SELECT
    USING (true);

CREATE POLICY "comments_insert_auth"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "comments_delete_own"
    ON public.comments FOR DELETE
    USING (auth.uid() = author_id);

-- -------------------------------------------------------------------------
-- bookmarks
-- -------------------------------------------------------------------------
CREATE POLICY "bookmarks_select_own"
    ON public.bookmarks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_insert_own"
    ON public.bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_delete_own"
    ON public.bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- conversations
-- -------------------------------------------------------------------------
CREATE POLICY "conversations_select_member"
    ON public.conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = id
              AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "conversations_insert_auth"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- -------------------------------------------------------------------------
-- conversation_members
-- -------------------------------------------------------------------------
CREATE POLICY "conversation_members_select_member"
    ON public.conversation_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = conversation_id
              AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "conversation_members_insert_auth"
    ON public.conversation_members FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- -------------------------------------------------------------------------
-- messages
-- -------------------------------------------------------------------------
CREATE POLICY "messages_select_member"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = messages.conversation_id
              AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "messages_insert_member"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = messages.conversation_id
              AND cm.user_id = auth.uid()
        )
    );

-- -------------------------------------------------------------------------
-- notifications
-- -------------------------------------------------------------------------
CREATE POLICY "notifications_select_own"
    ON public.notifications FOR SELECT
    USING (auth.uid() = target_user_id);

CREATE POLICY "notifications_update_own"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = target_user_id)
    WITH CHECK (auth.uid() = target_user_id);

CREATE POLICY "notifications_delete_own"
    ON public.notifications FOR DELETE
    USING (auth.uid() = target_user_id);

-- Allow system/triggers to insert notifications (service role bypasses RLS)
CREATE POLICY "notifications_insert_auth"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);


-- ============================================================================
-- 4. TRIGGER FUNCTIONS
-- ============================================================================

-- -------------------------------------------------------------------------
-- updated_at auto-timestamp
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_friendships_updated_at
    BEFORE UPDATE ON public.friendships
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -------------------------------------------------------------------------
-- Auto-create profile on auth.users signup
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'username', 'user_' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data ->> 'display_name', COALESCE(NEW.raw_user_meta_data ->> 'username', 'New User')),
        COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------------------
-- Likes counter
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts
        SET likes_count = likes_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER on_like_insert
    AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.handle_likes_count();

CREATE TRIGGER on_like_delete
    AFTER DELETE ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.handle_likes_count();

-- -------------------------------------------------------------------------
-- Comments counter
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER on_comment_insert
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_comments_count();

CREATE TRIGGER on_comment_delete
    AFTER DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_comments_count();

-- -------------------------------------------------------------------------
-- Bookmarks counter
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_bookmarks_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts
        SET bookmarks_count = bookmarks_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts
        SET bookmarks_count = GREATEST(bookmarks_count - 1, 0)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER on_bookmark_insert
    AFTER INSERT ON public.bookmarks
    FOR EACH ROW EXECUTE FUNCTION public.handle_bookmarks_count();

CREATE TRIGGER on_bookmark_delete
    AFTER DELETE ON public.bookmarks
    FOR EACH ROW EXECUTE FUNCTION public.handle_bookmarks_count();

-- -------------------------------------------------------------------------
-- Follows counters (follower_count + following_count)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_follows_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles
        SET following_count = following_count + 1
        WHERE id = NEW.follower_id;

        UPDATE public.profiles
        SET follower_count = follower_count + 1
        WHERE id = NEW.following_id;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles
        SET following_count = GREATEST(following_count - 1, 0)
        WHERE id = OLD.follower_id;

        UPDATE public.profiles
        SET follower_count = GREATEST(follower_count - 1, 0)
        WHERE id = OLD.following_id;

        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER on_follow_insert
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.handle_follows_count();

CREATE TRIGGER on_follow_delete
    AFTER DELETE ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.handle_follows_count();

-- -------------------------------------------------------------------------
-- Post count on profiles
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_post_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles
        SET post_count = post_count + 1
        WHERE id = NEW.author_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles
        SET post_count = GREATEST(post_count - 1, 0)
        WHERE id = OLD.author_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER on_post_insert
    AFTER INSERT ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_post_count();

CREATE TRIGGER on_post_delete
    AFTER DELETE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_post_count();
