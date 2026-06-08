--
-- PostgreSQL database dump
--

\restrict b6fFdpecjXY7eoTOnHSYoE1ZFNicdZxBkOH7FY6bDLjSJsGuhgbeuILlkPQF7a7

-- Dumped from database version 17.9 (Debian 17.9-1.pgdg12+1)
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: saleday_user
--

-- *not* creating schema, since initdb creates it



--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--



--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--



SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.activity_logs (
    id integer NOT NULL,
    event_type text NOT NULL,
    user_id integer,
    user_name text,
    target_user_id integer,
    target_product_id integer,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    target_user_name text
);



--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: saleday_user
--

CREATE SEQUENCE templesale.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saleday_user
--

ALTER SEQUENCE templesale.activity_logs_id_seq OWNED BY templesale.activity_logs.id;


--
-- Name: admin_visitor_self_signatures; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.admin_visitor_self_signatures (
    id bigint NOT NULL,
    admin_email text NOT NULL,
    signature_key text NOT NULL,
    device_type text DEFAULT ''::text NOT NULL,
    device_model text DEFAULT ''::text NOT NULL,
    os_name text DEFAULT ''::text NOT NULL,
    os_version text DEFAULT ''::text NOT NULL,
    created_at bigint DEFAULT ((EXTRACT(epoch FROM now()))::bigint * 1000) NOT NULL,
    last_seen_at bigint DEFAULT ((EXTRACT(epoch FROM now()))::bigint * 1000) NOT NULL
);



--
-- Name: admin_visitor_self_signatures_id_seq; Type: SEQUENCE; Schema: public; Owner: saleday_user
--

CREATE SEQUENCE templesale.admin_visitor_self_signatures_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: admin_visitor_self_signatures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saleday_user
--

ALTER SEQUENCE templesale.admin_visitor_self_signatures_id_seq OWNED BY templesale.admin_visitor_self_signatures.id;


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.favorites (
    id integer NOT NULL,
    user_id integer NOT NULL,
    product_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);



--
-- Name: favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: saleday_user
--

CREATE SEQUENCE templesale.favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saleday_user
--

ALTER SEQUENCE templesale.favorites_id_seq OWNED BY templesale.favorites.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.messages (
    id integer NOT NULL,
    sender_id integer,
    receiver_id integer,
    product_id integer,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    is_read boolean DEFAULT false
);



--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: saleday_user
--

CREATE SEQUENCE templesale.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saleday_user
--

ALTER SEQUENCE templesale.messages_id_seq OWNED BY templesale.messages.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.orders (
    id integer NOT NULL,
    product_id integer NOT NULL,
    seller_id integer NOT NULL,
    buyer_id integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    confirmed_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone,
    total numeric(10,2)
);



--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: saleday_user
--

CREATE SEQUENCE templesale.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saleday_user
--

ALTER SEQUENCE templesale.orders_id_seq OWNED BY templesale.orders.id;


--
-- Name: product_cart_notifications; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.product_cart_notifications (
    id integer NOT NULL,
    owner_user_id integer NOT NULL,
    actor_user_id integer,
    actor_name text DEFAULT ''::text NOT NULL,
    product_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);



--
-- Name: product_cart_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: saleday_user
--

CREATE SEQUENCE templesale.product_cart_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: product_cart_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saleday_user
--

ALTER SEQUENCE templesale.product_cart_notifications_id_seq OWNED BY templesale.product_cart_notifications.id;


--
-- Name: product_comments; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.product_comments (
    id integer NOT NULL,
    product_id integer NOT NULL,
    user_id integer NOT NULL,
    parent_comment_id integer,
    rating integer,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT product_comments_rating_range CHECK (((rating IS NULL) OR ((rating >= 1) AND (rating <= 5))))
);



--
-- Name: product_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: saleday_user
--

CREATE SEQUENCE templesale.product_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: product_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saleday_user
--

ALTER SEQUENCE templesale.product_comments_id_seq OWNED BY templesale.product_comments.id;


--
-- Name: product_likes; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.product_likes (
    user_id bigint NOT NULL,
    product_id bigint NOT NULL,
    created_at bigint DEFAULT (EXTRACT(epoch FROM now()))::bigint NOT NULL
);



--
-- Name: product_questions; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.product_questions (
    id integer NOT NULL,
    product_id integer NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    response_content text,
    response_user_id integer,
    response_created_at timestamp without time zone
);



--
-- Name: product_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: saleday_user
--

CREATE SEQUENCE templesale.product_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: product_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saleday_user
--

ALTER SEQUENCE templesale.product_questions_id_seq OWNED BY templesale.product_questions.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.products (
    id integer NOT NULL,
    user_id integer,
    title character varying(150) DEFAULT ''::character varying NOT NULL,
    description text,
    price numeric(10,2),
    category character varying(50),
    city character varying(50),
    image_url text,
    created_at timestamp without time zone DEFAULT now(),
    lat double precision,
    lng double precision,
    country character varying(2),
    state character varying(80),
    neighborhood character varying(120),
    street character varying(160),
    zip character varying(20),
    status text DEFAULT 'active'::text NOT NULL,
    brand text,
    model text,
    color text,
    year integer,
    is_free boolean DEFAULT false NOT NULL,
    district text,
    pickup_only boolean DEFAULT false NOT NULL,
    image_urls text,
    views_count integer DEFAULT 0 NOT NULL,
    clicks_count integer DEFAULT 0 NOT NULL,
    favorites_count integer DEFAULT 0 NOT NULL,
    rank numeric DEFAULT 0 NOT NULL,
    clicks integer,
    likes integer,
    last_viewed_at timestamp with time zone,
    last_clicked_at timestamp with time zone,
    manual_rank_position integer,
    manual_rank_started_at timestamp with time zone,
    manual_rank_expires_at timestamp with time zone,
    manual_rank_plan text,
    property_type text,
    surface_area text,
    bedrooms text,
    bathrooms text,
    parking text,
    condo_fee text,
    rent_type text,
    hidden_by_seller boolean DEFAULT false NOT NULL,
    service_type text,
    service_duration text,
    service_rate text,
    service_location text,
    job_title text,
    job_type text,
    job_salary text,
    job_requirements text,
    links jsonb,
    image_kinds text,
    floorplan_urls text,
    latitude double precision,
    longitude double precision,
    name text,
    image text,
    images text DEFAULT '[]'::text,
    details text DEFAULT '{}'::text,
    quantity integer DEFAULT 1 NOT NULL,
    price_negotiable boolean DEFAULT false NOT NULL,
    slug text,
    click_count integer DEFAULT 0 NOT NULL,
    CONSTRAINT chk_products_lat CHECK (((lat IS NULL) OR ((lat >= ('-90'::integer)::double precision) AND (lat <= (90)::double precision)))),
    CONSTRAINT chk_products_lng CHECK (((lng IS NULL) OR ((lng >= ('-180'::integer)::double precision) AND (lng <= (180)::double precision)))),
    CONSTRAINT products_status_check CHECK ((status = ANY (ARRAY['active'::text, 'sold'::text, 'inactive'::text]))),
    CONSTRAINT products_year_check_basic CHECK (((year IS NULL) OR ((year >= 1900) AND (year <= ((EXTRACT(year FROM now()))::integer + 1)))))
);



--
-- Name: products_backup; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.products_backup (
    id integer,
    user_id integer,
    title character varying(150),
    description text,
    price numeric(10,2),
    category character varying(50),
    city character varying(50),
    image_url text,
    created_at timestamp without time zone,
    lat double precision,
    lng double precision,
    country character varying(2),
    state character varying(80),
    neighborhood character varying(120),
    street character varying(160),
    zip character varying(20),
    status text
);



--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: saleday_user
--

CREATE SEQUENCE templesale.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saleday_user
--

ALTER SEQUENCE templesale.products_id_seq OWNED BY templesale.products.id;


--
-- Name: remember_tokens; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.remember_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- Name: remember_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: saleday_user
--

CREATE SEQUENCE templesale.remember_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: remember_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saleday_user
--

ALTER SEQUENCE templesale.remember_tokens_id_seq OWNED BY templesale.remember_tokens.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.reviews (
    id integer NOT NULL,
    reviewee_id integer NOT NULL,
    reviewer_id integer NOT NULL,
    stars integer NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    order_id integer,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_stars_check CHECK (((stars >= 1) AND (stars <= 5)))
);



--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: saleday_user
--

CREATE SEQUENCE templesale.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saleday_user
--

ALTER SEQUENCE templesale.reviews_id_seq OWNED BY templesale.reviews.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.sessions (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    token_hash text NOT NULL,
    expires_at bigint NOT NULL,
    created_at bigint DEFAULT (EXTRACT(epoch FROM now()))::bigint NOT NULL
);



--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: saleday_user
--

CREATE SEQUENCE templesale.sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saleday_user
--

ALTER SEQUENCE templesale.sessions_id_seq OWNED BY templesale.sessions.id;


--
-- Name: site_daily_visitors; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.site_daily_visitors (
    id bigint NOT NULL,
    visit_date text NOT NULL,
    visitor_key text NOT NULL,
    ip text DEFAULT ''::text NOT NULL,
    user_agent text DEFAULT ''::text NOT NULL,
    entry_path text DEFAULT '/'::text NOT NULL,
    referrer text DEFAULT ''::text NOT NULL,
    referrer_host text DEFAULT ''::text NOT NULL,
    country text DEFAULT ''::text NOT NULL,
    region text DEFAULT ''::text NOT NULL,
    city text DEFAULT ''::text NOT NULL,
    first_seen_at bigint DEFAULT ((EXTRACT(epoch FROM now()))::bigint * 1000) NOT NULL,
    last_seen_at bigint DEFAULT ((EXTRACT(epoch FROM now()))::bigint * 1000) NOT NULL,
    visits integer DEFAULT 1 NOT NULL
);



--
-- Name: site_daily_visitors_id_seq; Type: SEQUENCE; Schema: public; Owner: saleday_user
--

CREATE SEQUENCE templesale.site_daily_visitors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: site_daily_visitors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saleday_user
--

ALTER SEQUENCE templesale.site_daily_visitors_id_seq OWNED BY templesale.site_daily_visitors.id;


--
-- Name: support_conversations; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.support_conversations (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    subject text,
    status character varying(32) DEFAULT 'open'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_last_seen_message_id bigint
);



--
-- Name: support_conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: saleday_user
--

CREATE SEQUENCE templesale.support_conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: support_conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saleday_user
--

ALTER SEQUENCE templesale.support_conversations_id_seq OWNED BY templesale.support_conversations.id;


--
-- Name: support_messages; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.support_messages (
    id bigint NOT NULL,
    conversation_id bigint NOT NULL,
    sender_type character varying(16) NOT NULL,
    sender_id integer,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT support_messages_sender_type_check CHECK (((sender_type)::text = ANY (ARRAY[('user'::character varying)::text, ('admin'::character varying)::text])))
);



--
-- Name: support_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: saleday_user
--

CREATE SEQUENCE templesale.support_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: support_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saleday_user
--

ALTER SEQUENCE templesale.support_messages_id_seq OWNED BY templesale.support_messages.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.users (
    id integer NOT NULL,
    username character varying(100) DEFAULT ''::character varying NOT NULL,
    email character varying(150) NOT NULL,
    phone character varying(20),
    country character varying(50),
    state character varying(50),
    city character varying(50),
    district character varying(50),
    street character varying(100),
    zip character varying(20),
    password character varying(255) DEFAULT ''::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    profile_image_url text,
    rating_avg numeric(3,2) DEFAULT 0,
    rating_count integer DEFAULT 0,
    accepted_privacy_at timestamp with time zone,
    accepted_terms_at timestamp with time zone,
    accepted_community_at timestamp with time zone,
    accepted_version text,
    accepted_legal_payload jsonb,
    accepted_ip inet,
    accepted_user_agent text,
    accepted_terms_version text,
    accepted_privacy_version text,
    accepted_community_version text,
    is_banned boolean DEFAULT false NOT NULL,
    ban_reason text,
    auth0_sub text,
    company_name text,
    company_description text,
    company_address text,
    company_city text,
    company_state text,
    company_country text,
    company_lat double precision,
    company_lng double precision,
    cover_image_url text,
    cover_theme text,
    profile_frame text,
    neighborhood text DEFAULT ''::text NOT NULL,
    whatsapp_country_iso text DEFAULT 'IT'::text NOT NULL,
    whatsapp_number text DEFAULT ''::text NOT NULL,
    name text,
    password_hash text,
    password_salt text,
    avatar_url text DEFAULT ''::text NOT NULL,
    preferred_locale text,
    new_product_defaults text DEFAULT '{}'::text NOT NULL,
    location_latitude double precision,
    location_longitude double precision
);



--
-- Name: users_backup; Type: TABLE; Schema: public; Owner: saleday_user
--

CREATE TABLE templesale.users_backup (
    id integer,
    username character varying(100),
    email character varying(150),
    phone character varying(20),
    country character varying(50),
    state character varying(50),
    city character varying(50),
    district character varying(50),
    street character varying(100),
    zip character varying(20),
    password character varying(255),
    created_at timestamp without time zone
);



--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: saleday_user
--

CREATE SEQUENCE templesale.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saleday_user
--

ALTER SEQUENCE templesale.users_id_seq OWNED BY templesale.users.id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.activity_logs ALTER COLUMN id SET DEFAULT nextval('templesale.activity_logs_id_seq'::regclass);


--
-- Name: admin_visitor_self_signatures id; Type: DEFAULT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.admin_visitor_self_signatures ALTER COLUMN id SET DEFAULT nextval('templesale.admin_visitor_self_signatures_id_seq'::regclass);


--
-- Name: favorites id; Type: DEFAULT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.favorites ALTER COLUMN id SET DEFAULT nextval('templesale.favorites_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.messages ALTER COLUMN id SET DEFAULT nextval('templesale.messages_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.orders ALTER COLUMN id SET DEFAULT nextval('templesale.orders_id_seq'::regclass);


--
-- Name: product_cart_notifications id; Type: DEFAULT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_cart_notifications ALTER COLUMN id SET DEFAULT nextval('templesale.product_cart_notifications_id_seq'::regclass);


--
-- Name: product_comments id; Type: DEFAULT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_comments ALTER COLUMN id SET DEFAULT nextval('templesale.product_comments_id_seq'::regclass);


--
-- Name: product_questions id; Type: DEFAULT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_questions ALTER COLUMN id SET DEFAULT nextval('templesale.product_questions_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.products ALTER COLUMN id SET DEFAULT nextval('templesale.products_id_seq'::regclass);


--
-- Name: remember_tokens id; Type: DEFAULT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.remember_tokens ALTER COLUMN id SET DEFAULT nextval('templesale.remember_tokens_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.reviews ALTER COLUMN id SET DEFAULT nextval('templesale.reviews_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.sessions ALTER COLUMN id SET DEFAULT nextval('templesale.sessions_id_seq'::regclass);


--
-- Name: site_daily_visitors id; Type: DEFAULT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.site_daily_visitors ALTER COLUMN id SET DEFAULT nextval('templesale.site_daily_visitors_id_seq'::regclass);


--
-- Name: support_conversations id; Type: DEFAULT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.support_conversations ALTER COLUMN id SET DEFAULT nextval('templesale.support_conversations_id_seq'::regclass);


--
-- Name: support_messages id; Type: DEFAULT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.support_messages ALTER COLUMN id SET DEFAULT nextval('templesale.support_messages_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.users ALTER COLUMN id SET DEFAULT nextval('templesale.users_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.activity_logs (id, event_type, user_id, user_name, target_user_id, target_product_id, description, metadata, created_at, target_user_name) FROM stdin;
1	message_sent	20	\N	9	112	Mensagem enviada no chat do produto	{"content": "ww"}	2025-11-24 15:59:42.016323	\N
2	message_sent	20	\N	9	112	Mensagem enviada no chat do produto	{"content": "que voce que ninguim deve saber disso"}	2025-11-24 16:00:31.972677	\N
3	message_sent	20	\N	9	112	Mensagem no chat do produto 112	{"content": "dd", "productId": 112}	2025-11-24 16:03:03.449373	\N
4	message_sent	20	\N	9	112	Mensagem no chat do produto 112	{"content": "www", "productId": 112}	2025-11-24 16:20:01.511826	cristiane tebaldi
5	message_sent	20	\N	9	112	Mensagem no chat do produto 112	{"content": "wfec", "productId": 112}	2025-11-24 16:21:05.52422	cristiane tebaldi
6	message_sent	20	\N	21	\N	Mensagem enviada via chat direto	{"content": "sdfgh"}	2025-11-24 16:22:14.578094	zukin bergh
7	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "dwdw", "productId": 94}	2025-11-24 16:23:06.48965	Guilherme Tebaldi
8	message_sent	22	\N	20	112	Mensagem no chat do produto 112	{"content": "ww", "productId": 112}	2025-11-24 16:23:42.122451	cristiane tebaldi
9	product_sold	20	cristiane tebaldi	21	112	Produto computador vendido para zukin bergh	{"buyer_email": "zu@hotmail.com", "confirmed_at": "2025-11-24T15:24:29.705Z"}	2025-11-24 16:24:29.708831	\N
10	message_sent	20	\N	22	112	Mensagem no chat do produto 112	{"content": "e seu", "productId": 112}	2025-11-24 16:25:24.535908	cristiane tebaldi
11	message_sent	20	\N	9	101	Mensagem no chat do produto 101	{"content": "xix", "productId": 101}	2025-11-24 16:41:14.045712	Guilherme Tebaldi
12	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "xa"}	2025-11-24 16:41:17.546213	Guilherme Tebaldi
13	message_sent	20	\N	21	112	Mensagem no chat do produto 112	{"content": "teste", "productId": 112}	2025-11-24 20:54:29.431386	cristiane tebaldi
14	product_sold	20	cristiane tebaldi	24	114	Produto bomba vendido para jose carmo	{"buyer_email": "jose@carmo.com", "confirmed_at": "2025-11-24T20:15:34.138Z"}	2025-11-24 21:15:34.147771	\N
15	message_sent	24	\N	20	114	Mensagem no chat do produto 114	{"content": "ola", "productId": 114}	2025-11-24 21:17:48.165182	cristiane tebaldi
16	message_sent	20	\N	24	114	Mensagem no chat do produto 114	{"content": "ded", "productId": 114}	2025-11-24 21:18:30.032309	cristiane tebaldi
17	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-11-24 21:19:42.631339	cristiane tebaldi
18	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "dwdw", "productId": 94}	2025-11-24 21:19:57.721796	Guilherme Tebaldi
19	product_sold	9	Guilherme Tebaldi	20	102	Produto ww vendido para cristiane tebaldi	{"buyer_email": "cris@tebaldi.com", "confirmed_at": "2025-11-24T20:20:45.326Z"}	2025-11-24 21:20:45.32993	\N
20	message_sent	9	\N	20	102	Mensagem no chat do produto 102	{"content": "vefe", "productId": 102}	2025-11-24 21:20:54.559362	Guilherme Tebaldi
21	message_sent	9	\N	20	102	Mensagem no chat do produto 102	{"content": "dwdw", "productId": 102}	2025-11-24 21:21:22.232815	Guilherme Tebaldi
22	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "wdw", "productId": 113}	2025-11-24 21:22:51.100122	Guilherme Tebaldi
23	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "teste", "productId": 113}	2025-11-24 21:23:11.337473	Guilherme Tebaldi
24	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dw", "productId": 113}	2025-11-24 21:23:41.135275	Guilherme Tebaldi
25	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "quero", "productId": 113}	2025-11-24 21:30:13.592467	Guilherme Tebaldi
26	message_sent	9	\N	24	113	Mensagem no chat do produto 113	{"content": "o que?", "productId": 113}	2025-11-24 21:30:33.555554	Guilherme Tebaldi
27	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__OFFER__{\\"amount\\":1,\\"currency\\":\\"BRL\\",\\"productId\\":113,\\"productTitle\\":\\"Alface\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-24T20:31:41.966Z\\"}", "productId": 113}	2025-11-24 21:31:41.979761	Guilherme Tebaldi
28	message_sent	25	\N	9	97	Mensagem no chat do produto 97	{"content": "wdwdw", "productId": 97}	2025-11-24 21:32:32.113157	Guilherme Tebaldi
29	message_sent	9	\N	25	97	Mensagem no chat do produto 97	{"content": "wdwddw", "productId": 97}	2025-11-24 21:32:46.143884	Guilherme Tebaldi
30	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "wdwd", "productId": 97}	2025-11-24 21:33:41.801487	Guilherme Tebaldi
31	message_sent	9	\N	20	113	Mensagem no chat do produto 113	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":231,\\"status\\":\\"declined\\",\\"offer\\":{\\"amount\\":1,\\"currency\\":\\"BRL\\",\\"productId\\":113,\\"productTitle\\":\\"Alface\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-24T20:31:41.966Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-11-24T20:36:14.411Z\\"}", "productId": 113}	2025-11-24 21:36:14.444776	Guilherme Tebaldi
32	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "wdwd", "productId": 97}	2025-11-24 21:36:56.846153	Guilherme Tebaldi
33	message_sent	24	\N	9	94	Mensagem no chat do produto 94	{"content": "wdd", "productId": 94}	2025-11-24 21:37:20.619803	Guilherme Tebaldi
34	message_sent	9	\N	24	94	Mensagem no chat do produto 94	{"content": "cwcw", "productId": 94}	2025-11-24 21:37:37.543732	Guilherme Tebaldi
35	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "quero savber", "productId": 113}	2025-11-24 21:40:49.579935	Guilherme Tebaldi
36	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "dwd", "productId": 94}	2025-11-24 21:46:01.003005	Guilherme Tebaldi
37	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "dw", "productId": 94}	2025-11-24 21:46:07.741761	Guilherme Tebaldi
38	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "wd", "productId": 94}	2025-11-24 21:48:21.170247	Guilherme Tebaldi
39	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "www", "productId": 94}	2025-11-24 21:48:41.080312	Guilherme Tebaldi
40	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "dwd", "productId": 94}	2025-11-24 21:48:46.029563	Guilherme Tebaldi
41	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "wdww", "productId": 113}	2025-11-24 21:49:10.528375	Guilherme Tebaldi
42	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "w", "productId": 113}	2025-11-24 21:51:14.075316	Guilherme Tebaldi
43	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dwwd", "productId": 113}	2025-11-24 21:58:23.387092	Guilherme Tebaldi
44	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dw", "productId": 113}	2025-11-24 21:58:40.627846	Guilherme Tebaldi
45	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dwdw", "productId": 113}	2025-11-24 21:58:59.792155	Guilherme Tebaldi
46	message_sent	9	\N	20	113	Mensagem no chat do produto 113	{"content": "vvdvdv", "productId": 113}	2025-11-24 21:59:29.085691	Guilherme Tebaldi
47	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "dwdwd", "productId": 94}	2025-11-24 22:03:16.217823	Guilherme Tebaldi
48	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "w", "productId": 94}	2025-11-24 22:04:50.475079	Guilherme Tebaldi
49	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "w", "productId": 94}	2025-11-24 22:04:54.435782	Guilherme Tebaldi
50	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "ww", "productId": 94}	2025-11-24 22:06:23.233092	Guilherme Tebaldi
51	message_sent	9	\N	20	94	Mensagem no chat do produto 94	{"content": "www", "productId": 94}	2025-11-24 22:06:47.317104	Guilherme Tebaldi
52	message_sent	24	\N	9	94	Mensagem no chat do produto 94	{"content": "ww", "productId": 94}	2025-11-24 22:09:52.205594	Guilherme Tebaldi
53	message_sent	9	\N	24	94	Mensagem no chat do produto 94	{"content": "aofea sim", "productId": 94}	2025-11-24 22:10:38.447642	Guilherme Tebaldi
54	message_sent	24	\N	9	94	Mensagem no chat do produto 94	{"content": "voce sacou", "productId": 94}	2025-11-24 22:10:52.138592	Guilherme Tebaldi
55	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "entao", "productId": 113}	2025-11-24 22:11:17.033814	Guilherme Tebaldi
56	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "dwdw", "productId": 94}	2025-11-24 22:19:09.443161	Guilherme Tebaldi
57	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dwdwd"}	2025-11-24 22:20:33.954505	cristiane tebaldi
58	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dw"}	2025-11-25 11:01:49.70272	cristiane tebaldi
59	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "wcwc", "productId": 113}	2025-11-25 11:03:33.471861	Guilherme Tebaldi
60	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dw", "productId": 113}	2025-11-25 11:06:03.229235	Guilherme Tebaldi
61	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dw", "productId": 113}	2025-11-25 11:07:34.837544	Guilherme Tebaldi
62	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dw", "productId": 113}	2025-11-25 11:07:42.911455	Guilherme Tebaldi
63	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dw", "productId": 113}	2025-11-25 11:07:46.599331	Guilherme Tebaldi
64	message_sent	9	\N	20	113	Mensagem no chat do produto 113	{"content": "ded", "productId": 113}	2025-11-25 11:08:09.582345	Guilherme Tebaldi
65	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dw", "productId": 113}	2025-11-25 11:09:26.637678	Guilherme Tebaldi
66	message_sent	9	\N	20	113	Mensagem no chat do produto 113	{"content": "dw", "productId": 113}	2025-11-25 11:09:29.850741	Guilherme Tebaldi
67	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dwdw", "productId": 113}	2025-11-25 11:09:33.893249	Guilherme Tebaldi
68	message_sent	23	\N	9	113	Mensagem no chat do produto 113	{"content": "ola", "productId": 113}	2025-11-25 11:09:54.649596	Guilherme Tebaldi
69	message_sent	9	\N	23	113	Mensagem no chat do produto 113	{"content": "wdw", "productId": 113}	2025-11-25 11:10:08.415079	Guilherme Tebaldi
70	message_sent	9	\N	23	113	Mensagem no chat do produto 113	{"content": "wd", "productId": 113}	2025-11-25 11:10:35.349051	Guilherme Tebaldi
71	message_sent	23	\N	9	113	Mensagem no chat do produto 113	{"content": "did", "productId": 113}	2025-11-25 11:10:38.580233	Guilherme Tebaldi
72	message_sent	9	\N	23	113	Mensagem no chat do produto 113	{"content": "dw", "productId": 113}	2025-11-25 11:10:51.535001	Guilherme Tebaldi
73	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "dwdw", "productId": 97}	2025-11-25 11:12:40.435981	Guilherme Tebaldi
74	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "vvr", "productId": 97}	2025-11-25 11:12:52.382328	Guilherme Tebaldi
75	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "dwd", "productId": 97}	2025-11-25 11:20:42.524393	Guilherme Tebaldi
76	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "dwd", "productId": 97}	2025-11-25 11:20:48.619004	Guilherme Tebaldi
77	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "dw", "productId": 97}	2025-11-25 11:22:27.623474	Guilherme Tebaldi
78	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "dw", "productId": 97}	2025-11-25 11:23:10.280843	Guilherme Tebaldi
79	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066194018}", "productId": 97}	2025-11-25 11:23:14.054579	Guilherme Tebaldi
80	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "dw", "productId": 97}	2025-11-25 11:23:14.080097	Guilherme Tebaldi
81	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "__saleday_product_context__:{\\"productId\\":94,\\"title\\":\\"ertyujk\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"price\\":\\"R$ 456,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1764066211054}", "productId": 94}	2025-11-25 11:23:31.074155	Guilherme Tebaldi
82	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "wddw", "productId": 94}	2025-11-25 11:23:31.100894	Guilherme Tebaldi
83	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "efiefo", "productId": 97}	2025-11-25 11:23:43.91256	Guilherme Tebaldi
84	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "__saleday_product_context__:{\\"productId\\":94,\\"title\\":\\"ertyujk\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"price\\":\\"R$ 456,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1764066270500}", "productId": 94}	2025-11-25 11:24:30.513196	Guilherme Tebaldi
85	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "oi", "productId": 94}	2025-11-25 11:24:30.576552	Guilherme Tebaldi
86	message_sent	9	\N	20	94	Mensagem no chat do produto 94	{"content": "__saleday_product_context__:{\\"productId\\":94,\\"title\\":\\"ertyujk\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"price\\":\\"R$ 456,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1764066288293}", "productId": 94}	2025-11-25 11:24:48.312537	Guilherme Tebaldi
87	message_sent	9	\N	20	94	Mensagem no chat do produto 94	{"content": "ola tufo bem", "productId": 94}	2025-11-25 11:24:48.370779	Guilherme Tebaldi
88	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 11:25:06.751821	Guilherme Tebaldi
89	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "ola \\\\", "productId": 113}	2025-11-25 11:25:06.801022	Guilherme Tebaldi
90	message_sent	9	\N	20	94	Mensagem no chat do produto 94	{"content": "grg", "productId": 94}	2025-11-25 11:25:14.960341	Guilherme Tebaldi
91	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dwd", "productId": 113}	2025-11-25 11:25:20.981927	Guilherme Tebaldi
92	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "__saleday_product_context__:{\\"productId\\":94,\\"title\\":\\"ertyujk\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"price\\":\\"R$ 456,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1764066329911}", "productId": 94}	2025-11-25 11:25:29.949283	Guilherme Tebaldi
93	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "dwed", "productId": 94}	2025-11-25 11:25:29.968338	Guilherme Tebaldi
94	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "dwd", "productId": 94}	2025-11-25 11:25:33.376254	Guilherme Tebaldi
95	message_sent	9	\N	20	94	Mensagem no chat do produto 94	{"content": "dw", "productId": 94}	2025-11-25 11:25:35.610466	Guilherme Tebaldi
96	message_sent	9	\N	20	94	Mensagem no chat do produto 94	{"content": "dwd", "productId": 94}	2025-11-25 11:25:38.803951	Guilherme Tebaldi
97	message_sent	20	\N	9	110	Mensagem no chat do produto 110	{"content": "__saleday_product_context__:{\\"productId\\":110,\\"title\\":\\"cris\\",\\"image\\":\\"\\",\\"price\\":null,\\"location\\":\\"BR\\",\\"timestamp\\":1764066356096}", "productId": 110}	2025-11-25 11:25:56.109118	Guilherme Tebaldi
98	message_sent	20	\N	9	110	Mensagem no chat do produto 110	{"content": "wjbduwb", "productId": 110}	2025-11-25 11:25:56.11613	Guilherme Tebaldi
99	message_sent	9	\N	20	94	Mensagem no chat do produto 94	{"content": "grg", "productId": 94}	2025-11-25 11:26:00.808968	Guilherme Tebaldi
100	message_sent	9	\N	20	94	Mensagem no chat do produto 94	{"content": "grg", "productId": 94}	2025-11-25 11:26:04.3152	Guilherme Tebaldi
101	message_sent	20	\N	9	110	Mensagem no chat do produto 110	{"content": "fefe", "productId": 110}	2025-11-25 11:26:07.662804	Guilherme Tebaldi
102	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "dwd"}	2025-11-25 11:26:19.781562	Guilherme Tebaldi
103	message_sent	23	\N	9	94	Mensagem no chat do produto 94	{"content": "__saleday_product_context__:{\\"productId\\":94,\\"title\\":\\"ertyujk\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"price\\":\\"R$ 456,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1764066403071}", "productId": 94}	2025-11-25 11:26:43.093653	Guilherme Tebaldi
104	message_sent	23	\N	9	94	Mensagem no chat do produto 94	{"content": "did", "productId": 94}	2025-11-25 11:26:43.110029	Guilherme Tebaldi
105	message_sent	9	\N	23	94	Mensagem no chat do produto 94	{"content": "dwd", "productId": 94}	2025-11-25 11:26:58.462696	Guilherme Tebaldi
106	message_sent	9	\N	24	113	Mensagem no chat do produto 113	{"content": "cece", "productId": 113}	2025-11-25 11:27:18.707843	Guilherme Tebaldi
107	message_sent	24	\N	9	94	Mensagem no chat do produto 94	{"content": "__saleday_product_context__:{\\"productId\\":94,\\"title\\":\\"ertyujk\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"price\\":\\"R$ 456,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1764066451737}", "productId": 94}	2025-11-25 11:27:31.754792	Guilherme Tebaldi
108	message_sent	24	\N	9	94	Mensagem no chat do produto 94	{"content": "dwdw", "productId": 94}	2025-11-25 11:27:31.791232	Guilherme Tebaldi
109	message_sent	25	\N	9	94	Mensagem no chat do produto 94	{"content": "__saleday_product_context__:{\\"productId\\":94,\\"title\\":\\"ertyujk\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"price\\":\\"R$ 456,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1764066920731}", "productId": 94}	2025-11-25 11:35:20.742746	Guilherme Tebaldi
110	message_sent	25	\N	9	94	Mensagem no chat do produto 94	{"content": "dwdw", "productId": 94}	2025-11-25 11:35:20.771364	Guilherme Tebaldi
111	message_sent	25	\N	17	93	Mensagem no chat do produto 93	{"content": "__saleday_product_context__:{\\"productId\\":93,\\"title\\":\\"ghb\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762033708795-128196531.png\\",\\"price\\":\\"R$ 64,00\\",\\"location\\":\\"São Paulo, SP, BR\\",\\"timestamp\\":1764066969128}", "productId": 93}	2025-11-25 11:36:09.139727	Evangelista Moraes Tebaldi
112	message_sent	25	\N	17	93	Mensagem no chat do produto 93	{"content": "// frontend/src/pages/Messages.jsx // Página de mensagens entre compradores e vendedores. import { useEffect, useMemo, useRef, useState, useContext, useCallback } from 'react'; import { useSearchParams } from 'react-router-dom'; import { toast } from 'react-hot-toast'; import api from '../api/api.js'; import { AuthContext } from '../context/AuthContext.jsx'; import {   formatOfferAmount,   parseOfferMessage,   parseOfferResponse,   OFFER_RESPONSE_PREFIX } from '../utils/offers.js'; import { parseImageList, toAbsoluteImageUrl } from '../utils/images.js'; import formatProductPrice from '../utils/currency.js';  const sortConversationsByDate = (list) =>   [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());  const getInitial = (value) => {   if (!value) return 'S';   const first = value.trim().charAt(0);   return first ? first.toUpperCase() : 'S'; };  const LONG_PRESS_DELAY = 550;  const getCoordinatesFromEvent = (event) => {   if (!event) return { x: 0, y: 0 };   const touch = event.touches?.[0] || event.changedTouches?.[0];   if (touch) {     return { x: touch.clientX, y: touch.clientY };   }   return { x: event.clientX ?? 0, y: event.clientY ?? 0 }; };  const getConversationCounterpartId = (conversation, currentUserId) => {   if (!conversation || !currentUserId) return null;   return conversation.sender_id === currentUserId     ? conversation.receiver_id     : conversation.sender_id; };  const getConversationKey = (conversation, currentUserId) => {   const counterpartId = getConversationCounterpartId(conversation, currentUserId);   if (!counterpartId) {     return `conv-${conversation?.id ?? 'unknown'}`;   }   const normalizedCurrent = Number(currentUserId);   const normalizedCounterpart = Number(counterpartId);   if (!Number.isFinite(normalizedCurrent) || !Number.isFinite(normalizedCounterpart)) {     return `conv-${counterpartId}`;   }   const [first, second] = [normalizedCurrent, normalizedCounterpart].sort((a, b) => a - b);   return `conv-${first}-${second}`; };  const PRODUCT_CONTEXT_PREFIX = '__saleday_product_context__:';  const getMessageCacheKey = (message) => {   if (!message) return 'msg-unknown';   if (message.id) return `msg-${message.id}`;   if (message.message_id) return `msg-${message.message_id}`;   return `msg-${message.created_at || message.updated_at || Date.now()}`; };  const buildProductContextPayload = (productId, meta = {}, productInfo = null) => {   const title =     (productInfo?.title || meta.title || `Produto #${productId}`)?.trim() ||     `Produto #${productId}`;   const images = parseImageList(productInfo?.image_urls);   const image =     meta.image ||     images?.[0] ||     toAbsoluteImageUrl(productInfo?.image_url) ||     '';   const contextCountry = productInfo?.country || productInfo?.product_country || null;   const price =     meta.price ||     (productInfo?.price != null && contextCountry       ? formatProductPrice(productInfo.price, contextCountry)       : null);   const location =     meta.location ||     [productInfo?.city, productInfo?.state, productInfo?.country]       .filter(Boolean)       .join(', ') ||     null;    return {     productId,     title,     image,     price,     location,     timestamp: Date.now()   }; };  const parseProductContextFromMessage = (message) => {   if (!message || typeof message.content !== 'string') return null;   if (!message.content.startsWith(PRODUCT_CONTEXT_PREFIX)) return null;   const payload = message.content.slice(PRODUCT_CONTEXT_PREFIX.length);   try {     const parsed = JSON.parse(payload);     return {       ...parsed,       productId: parsed.productId ?? message.product_id ?? null,       timestamp:         parsed.timestamp ||         new Date(message.created_at || message.updated_at || Date.now()).getTime()     };   } catch {     return null;   } };  export default function Messages() {   const { token, user } = useContext(AuthContext);   const [conversations, setConversations] = useState([]);   const [messages, setMessages] = useState([]);   const [selectedProduct, setSelectedProduct] = useState(null);   const [selectedMeta, setSelectedMeta] = useState({ title: '', seller: '', counterpart: '', avatar: '' });   const [selectedProductInfo, setSelectedProductInfo] = useState(null);   const [counterpartId, setCounterpartId] = useState(null);   const [newMsg, setNewMsg] = useState('');   const [sending, setSending] = useState(false);   const [respondingOfferId, setRespondingOfferId] = useState(null);   const [sidebarOpen, setSidebarOpen] = useState(false);   const [deletingMessageId, setDeletingMessageId] = useState(null);   const [deletingConversationKey, setDeletingConversationKey] = useState(null);   const [contextMenu, setContextMenu] = useState(null);   const [searchParams] = useSearchParams();   const sendSoundRef = useRef(null);   const receiveSoundRef = useRef(null);   const pendingContextRef = useRef(null);   const lastMessageCountRef = useRef(null);   const pollingRef = useRef(null);   const conversationsRef = useRef([]);   const lastQueryProductRef = useRef(null);   const messagesEndRef = useRef(null);   const longPressTimerRef = useRef(null);   const lastNotificationTokenRef = useRef(null);   const forcedChatRef = useRef(null);   const userId = user?.id;   const userDisplayName = user?.username || user?.name || 'Usuário SaleDay';   const userAvatar = user?.profile_image_url ?? '';   const userInitial = useMemo(     () => getInitial(user?.username || user?.email || userDisplayName),     [user?.username, user?.email, userDisplayName]   );    useEffect(() => {     if (!receiveSoundRef.current) {       const receiveAudio = new Audio('/sounds/mensagem2.mp3');       receiveAudio.volume = 0.35;       receiveSoundRef.current = receiveAudio;     }     if (!sendSoundRef.current) {       const sendAudio = new Audio('/sounds/mensgem.mp3');       sendAudio.volume = 0.35;       sendSoundRef.current = sendAudio;     }   }, []);    useEffect(() => {     if (typeof window === 'undefined') return undefined;     const raw = window.sessionStorage.getItem('saleday:forced-chat');     if (!raw) return undefined;     try {       forcedChatRef.current = JSON.parse(raw);     } catch {       forcedChatRef.current = null;     }     window.sessionStorage.removeItem('saleday:forced-chat');     return undefined;   }, []);    const loadConversations = useCallback(async () => {     if (!token) return;     try {       const response = await api.get('/messages', {         headers: { Authorization: `Bearer ${token}` }       });       const data = Array.isArray(response.data?.data) ? response.data.data.slice() : [];       setConversations(sortConversationsByDate(data));     } catch (err) {       console.error(err);     }   }, [token]);    useEffect(() => {     loadConversations();   }, [loadConversations]);     useEffect(() => {     if (!token) return undefined;     const timer = setInterval(() => {       loadConversations();     }, 5000);     return () => clearInterval(timer);   }, [token, loadConversations]);    useEffect(() => {     conversationsRef.current = conversations;   }, [conversations]);    const determineCounterpart = useCallback(     (data, fallback) => {       if (data.length > 0) {         const lastMessage = data[data.length - 1];         return lastMessage.sender_id === userId ? lastMessage.receiver_id : lastMessage.sender_id;       }       if (fallback) {         return fallback.sender_id === userId ? fallback.receiver_id : fallback.sender_id;       }       return null;     },     [userId]   );    const resolveCounterpartProfile = useCallback(     (data, conversation, explicitCounterpartId = null) => {       const counterpart = explicitCounterpartId ?? determineCounterpart(data, conversation);       if (counterpart) {         const fromMessages = [...data].reverse().find(           (msg) => msg.sender_id === counterpart || msg.receiver_id === counterpart         );         if (fromMessages) {           const isSender = fromMessages.sender_id === counterpart;           return {             id: counterpart,             name: (isSender ? fromMessages.sender_name : fromMessages.receiver_name) || null,             avatar: (isSender ? fromMessages.sender_avatar : fromMessages.receiver_avatar) || null           };         }       }        if (conversation) {         const isSender = userId && conversation.sender_id === userId;         return {           id: isSender ? conversation.receiver_id : conversation.sender_id,           name: isSender             ? conversation.receiver_name || conversation.seller_name || null             : conversation.sender_name || conversation.seller_name || null,           avatar: isSender ? conversation.receiver_avatar || null : conversation.sender_avatar || null         };       }        return { id: counterpart || null, name: null, avatar: null };     },     [determineCounterpart, userId]   );    const fetchMessages = useCallback(     async ({       counterpartId: targetCounterpartId,       productId: contextProductId = null,       playSound = false,       conversation = null,       fallbackCounterpartName = '',       fallbackProductTitle = ''     } = {}) => {       if (!token || !targetCounterpartId) return [];       const normalizedCounterpart =         Number.isFinite(Number(targetCounterpartId)) && Number(targetCounterpartId) > 0           ? Number(targetCounterpartId)           : null;       if (!normalizedCounterpart) return [];       try {         const suffix =           contextProductId && Number.isFinite(Number(contextProductId))             ? `?productId=${Number(contextProductId)}`             : '';         const response = await api.get(`/messages/seller/${normalizedCounterpart}${suffix}`, {           headers: { Authorization: `Bearer ${token}` }         });         const data = response.data?.data ?? [];         const profile = resolveCounterpartProfile(data, conversation, normalizedCounterpart);          if (           playSound &&           receiveSoundRef.current &&           lastMessageCountRef.current !== null &&           data.length > lastMessageCountRef.current         ) {           receiveSoundRef.current.currentTime = 0;           receiveSoundRef.current.play().catch(() => {});         }          setMessages(data);          if (data.length > 0) {           const meta = data[data.length - 1];           setSelectedMeta({             title:               meta.product_title ||               fallbackProductTitle ||               meta.content ||               'Conversa privada',             seller: meta.seller_name || profile.name || '',             counterpart: profile.name || meta.seller_name || '',             avatar: profile.avatar || ''           });         } else if (conversation) {           setSelectedMeta({             title: conversation.product_title || fallbackProductTitle || 'Conversa privada',             seller: conversation.seller_name,             counterpart: profile.name || conversation.seller_name || '',             avatar: profile.avatar || ''           });         } else {           const fallbackTitle =             fallbackProductTitle ||             (fallbackCounterpartName ? `Conversa com ${fallbackCounterpartName}` : 'Conversa direta');           setSelectedMeta((prev) => ({             title: prev.title || fallbackTitle,             seller: prev.seller || fallbackCounterpartName || '',             counterpart: prev.counterpart || fallbackCounterpartName || '',             avatar: prev.avatar || ''           }));         }          setCounterpartId(normalizedCounterpart);         lastMessageCountRef.current = data.length;         return data;       } catch (err) {         console.error(err);         return [];       }     },     [token, resolveCounterpartProfile]   );    const parseProductIdValue = (value) => {     if (value === null || value === undefined) return null;     const parsed = Number(value);     return Number.isFinite(parsed) ? parsed : null;   };    const openChat = useCallback(     async (       productId,       conversation,       {         fallbackCounterpartId = null,         fallbackCounterpartName = '',         fallbackProductTitle = '',         queueProductContext = false,         contextMeta = {}       } = {}     ) => {       const parsedProductId = parseProductIdValue(productId);       const hasProduct = parsedProductId !== null;       const conversationCounterpart = determineCounterpart([], conversation);       const fallbackCounterpartNumeric =         fallbackCounterpartId !== null && fallbackCounterpartId !== undefined           ? Number(fallbackCounterpartId)           : null;       const resolvedCounterpart =         Number.isFinite(Number(conversationCounterpart)) && conversationCounterpart           ? Number(conversationCounterpart)           : Number.isFinite(fallbackCounterpartNumeric)             ? fallbackCounterpartNumeric             : null;       if (!resolvedCounterpart) return;        setSelectedProductInfo(null);       setSelectedProduct(hasProduct ? parsedProductId : null);       lastMessageCountRef.current = null; // reset so initial load doesn't play sound       await fetchMessages({         counterpartId: resolvedCounterpart,         productId: hasProduct ? parsedProductId : null,         playSound: false,         conversation,         fallbackCounterpartName,         fallbackProductTitle: hasProduct ? fallbackProductTitle : ''       });        setConversations((prev) =>         sortConversationsByDate(           prev.map((conv) => {             const convCounterpart = getConversationCounterpartId(conv, userId);             if (convCounterpart && Number(convCounterpart) === resolvedCounterpart) {               return { ...conv, is_read: true };             }             return conv;           })         )       );        pendingContextRef.current = null;       const resolvedContextMeta = { ...(contextMeta || {}) };       if (fallbackProductTitle && !resolvedContextMeta.title) {         resolvedContextMeta.title = fallbackProductTitle;       }        let fetchedProductData = null;       if (hasProduct) {         if (queueProductContext) {           pendingContextRef.current = {             productId: parsedProductId,             contextMeta: resolvedContextMeta           };         }         try {           const response = await api.get(`/products/${parsedProductId}`);           fetchedProductData = response.data?.data ?? null;           setSelectedProductInfo(fetchedProductData);         } catch {           setSelectedProductInfo(null);         }       } else {         setSelectedProductInfo(null);       }     },     [fetchMessages, determineCounterpart, userId]   );    useEffect(() => {     const forced = forcedChatRef.current;     if (!forced) return;     const parsedProductId = Number(forced.productId);     if (!Number.isFinite(parsedProductId)) return;     openChat(parsedProductId, null, {       fallbackCounterpartId:         forced.counterpartId !== undefined && forced.counterpartId !== null           ? Number(forced.counterpartId)           : null,       fallbackCounterpartName: forced.counterpartName || '',       fallbackProductTitle: forced.productTitle || '',       queueProductContext: true,       contextMeta: {         image: forced.productImage,         price: forced.productPrice,         location: forced.productLocation,         title: forced.productTitle       }     });     forcedChatRef.current = null;   }, [openChat]);    // open chat from query param when conversations fetched   useEffect(() => {     const pid = searchParams.get('product');     const sellerParam = searchParams.get('seller');     const productTitleParam = (searchParams.get('productTitle') || '').trim();     const notificationToken = searchParams.get('notificationToken') || null;     if (!pid && !sellerParam) {       lastQueryProductRef.current = null;       lastNotificationTokenRef.current = null;       return;     }     const numericId = pid ? Number(pid) : NaN;     const hasProductParam = Number.isFinite(numericId);     const sameProduct = hasProductParam && lastQueryProductRef.current === numericId;     if (sameProduct) {       if (!notificationToken) return;       if (lastNotificationTokenRef.current === notificationToken) return;     }     lastQueryProductRef.current = hasProductParam ? numericId : null;     lastNotificationTokenRef.current = notificationToken;     const buyerParam = searchParams.get('buyer');     const parsedSeller = sellerParam ? Number(sellerParam) : null;     const parsedBuyer = buyerParam ? Number(buyerParam) : null;     const fallbackCounterpartId =       Number.isFinite(parsedSeller) ? parsedSeller : Number.isFinite(parsedBuyer) ? parsedBuyer : null;     const existingConversation =       Number.isFinite(fallbackCounterpartId) && userId         ? conversationsRef.current.find(             (c) => Number(getConversationCounterpartId(c, userId)) === fallbackCounterpartId           )         : null;     const fallbackCounterpartName =       searchParams.get('buyerName') || searchParams.get('sellerName') || '';      openChat(hasProductParam ? numericId : null, existingConversation, {       fallbackCounterpartId,       fallbackCounterpartName,       fallbackProductTitle: productTitleParam,       queueProductContext: hasProductParam,       contextMeta: {         image: searchParams.get('productImage') || undefined,         price: searchParams.get('productPrice') || undefined,         location: searchParams.get('productLocation') || undefined,         title: productTitleParam || undefined       }     });     setSidebarOpen(false);   }, [searchParams, openChat, userId]);    // polling active conversation   useEffect(() => {     if (!counterpartId) return undefined;      const poll = async () => {       const conversation =         conversationsRef.current.find((conv) => {           const convCounterpart = getConversationCounterpartId(conv, userId);           return Number(convCounterpart) === Number(counterpartId);         }) ?? null;       await fetchMessages({         counterpartId,         productId: selectedProduct,         playSound: true,         conversation,         fallbackCounterpartId: counterpartId,         fallbackCounterpartName: selectedMeta.counterpart || selectedMeta.seller || ''       });     };      poll();     pollingRef.current = setInterval(poll, 5000);     return () => {       if (pollingRef.current) clearInterval(pollingRef.current);     };   }, [     counterpartId,     selectedProduct,     fetchMessages,     selectedMeta.counterpart,     selectedMeta.seller,     userId   ]);    const sendProductContextMessage = useCallback(     async (receiverId) => {       if (!token || !selectedProduct || !receiverId) return false;       const pending = pendingContextRef.current;       if (!pending) return false;       const normalizedPending = Number(pending.productId);       const currentProduct = Number(selectedProduct);       if (         !Number.isFinite(normalizedPending) ||         !Number.isFinite(currentProduct) ||         normalizedPending !== currentProduct       ) {         return false;       }       const payload = buildProductContextPayload(normalizedPending, pending.contextMeta, selectedProductInfo);       try {         await api.post(           '/messages',           {             product_id: normalizedPending,             content: `${PRODUCT_CONTEXT_PREFIX}${JSON.stringify(payload)}`,             receiver_id: receiverId           },           { headers: { Authorization: `Bearer ${token}` } }         );         pendingContextRef.current = null;         return true;       } catch (error) {         console.error('Falha ao enviar contexto do produto', error);         return false;       }     },     [selectedProduct, selectedProductInfo, token]   );    const handleSend = useCallback(     async (event) => {       event.preventDefault();       const isProductChat = Number.isFinite(selectedProduct);       if (!newMsg.trim() || !counterpartId || !token || sending) {         return;       }       setSending(true);       const conversation =         conversationsRef.current.find((c) => {           const convCounterpart = getConversationCounterpartId(c, userId);           return (             convCounterpart !== null &&             counterpartId !== null &&             Number(convCounterpart) === Number(counterpartId)           );         }) ?? null;       const targetId =         isProductChat && selectedProduct           ? counterpartId ?? determineCounterpart(messages, conversation)           : counterpartId;        if (!targetId) {         setSending(false);         toast.error('Não foi possível identificar o destinatário da mensagem.');         return;       }        try {         if (isProductChat) {           await sendProductContextMessage(targetId);           await api.post(             '/messages',             {               product_id: selectedProduct,               content: newMsg.trim(),               receiver_id: targetId             },             { headers: { Authorization: `Bearer ${token}` } }           );         } else {           await api.post(             `/messages/seller/${targetId}`,             { content: newMsg.trim() },             { headers: { Authorization: `Bearer ${token}` } }           );         }         setNewMsg('');         if (sendSoundRef.current) {           sendSoundRef.current.currentTime = 0;           sendSoundRef.current.play().catch(() => {});         }         lastMessageCountRef.current = null; // avoid skipping play on new incoming         await fetchMessages({           counterpartId: targetId,           productId: isProductChat ? selectedProduct : null,           playSound: false,           conversation         });         await loadConversations();       } catch (err) {         console.error(err);         toast.error('Não foi possível enviar a mensagem. Tente novamente.');       } finally {         setSending(false);       }     },     [       newMsg,       selectedProduct,       token,       counterpartId,       sending,       fetchMessages,       loadConversations,       determineCounterpart,       conversationsRef,       messages     ]   );    const handleDeleteMessage = useCallback(     async (messageId) => {       if (!token || !messageId) return;       if (typeof window !== 'undefined') {         const confirmed = window.confirm('Apagar mensagem!');         if (!confirmed) return;       }       setDeletingMessageId(messageId);       try {         await api.delete(`/messages/${messageId}`, {           headers: { Authorization: `Bearer ${token}` }         });         setMessages((prev) => prev.filter((msg) => msg.id !== messageId));         toast.success('Mensagem apagada.');         await loadConversations();       } catch (err) {         console.error(err);         toast.error('Não foi possível apagar a mensagem.');       } finally {         setDeletingMessageId(null);       }     },     [token, loadConversations]   );    const closeContextMenu = useCallback(() => {     setContextMenu(null);   }, []);    const cancelLongPress = useCallback(() => {     if (longPressTimerRef.current) {       clearTimeout(longPressTimerRef.current);       longPressTimerRef.current = null;     }   }, []);    const openContextMenu = useCallback((event, payload) => {     if (event) {       event.preventDefault();       event.stopPropagation?.();     }     const coords = getCoordinatesFromEvent(event);     setContextMenu({ ...payload, ...coords });   }, []);    const startLongPress = useCallback(     (event, payload) => {       if (!event) return;       if (event.touches && event.touches.length > 1) return;       cancelLongPress();       const coords = getCoordinatesFromEvent(event);       longPressTimerRef.current = setTimeout(() => {         setContextMenu({ ...payload, ...coords });       }, LONG_PRESS_DELAY);     },     [cancelLongPress]   );    useEffect(     () => () => {       cancelLongPress();     },     [cancelLongPress]   );    useEffect(() => {     const handleEscape = (event) => {       if (event.key === 'Escape') closeContextMenu();     };     const handleClose = () => closeContextMenu();     window.addEventListener('keydown', handleEscape);     window.addEventListener('resize', handleClose);     window.addEventListener('scroll', handleClose, true);     return () => {       window.removeEventListener('keydown', handleEscape);       window.removeEventListener('resize', handleClose);       window.removeEventListener('scroll', handleClose, true);     };   }, [closeContextMenu]);    useEffect(() => {     if (!messagesEndRef.current) return;     messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });   }, [messages]);    useEffect(() => {     if (!selectedProductInfo) return;     const isProductOwner =       selectedProductInfo.user_id && selectedProductInfo.user_id === userId;     const fallbackCounterpartName = !isProductOwner ? selectedProductInfo.seller_name || '' : '';     const fallbackAvatar = !isProductOwner ? selectedProductInfo.seller_avatar || '' : '';     setSelectedMeta((prev) => ({       title: prev.title || selectedProductInfo.title || '',       seller: prev.seller || selectedProductInfo.seller_name || '',       counterpart: prev.counterpart || fallbackCounterpartName || '',       avatar: prev.avatar || fallbackAvatar     }));     if (       !counterpartId &&       selectedProductInfo.user_id &&       !isProductOwner     ) {       setCounterpartId(selectedProductInfo.user_id);     }   }, [selectedProductInfo, counterpartId, userId]);    const isSeller = Boolean(selectedProductInfo?.user_id && selectedProductInfo.user_id === userId);   const productSold = selectedProductInfo?.status === 'sold';   const hasActiveConversation = Boolean(counterpartId);   const headerPartnerName = selectedMeta.counterpart || selectedMeta.seller || 'Vendedor SaleDay';   const headerSubtitle = selectedProduct ? 'Produto em foco abaixo' : 'Mensagens privadas';   const sortedMessages = useMemo(() => {     return [...messages].sort(       (a, b) =>         (new Date(a.created_at || a.updated_at || 0).getTime() || 0) -         (new Date(b.created_at || b.updated_at || 0).getTime() || 0)     );   }, [messages]);    const contextEntriesMap = useMemo(() => {     const map = new Map();     sortedMessages.forEach((msg) => {       const context = parseProductContextFromMessage(msg);       if (!context) return;       const key = getMessageCacheKey(msg);       map.set(key, {         ...context,         id: context.id || `ctx-${key}`,         image: context.image || '',         price: context.price || null,         location: context.location || ''       });     });     return map;   }, [sortedMessages]);    const mergedFeedItems = useMemo(() => {     const items = [];     for (const msg of sortedMessages) {       const key = getMessageCacheKey(msg);       if (contextEntriesMap.has(key)) {         items.push({ type: 'context', context: contextEntriesMap.get(key) });         continue;       }       items.push({ type: 'message', message: msg });     }     return items;   }, [sortedMessages, contextEntriesMap]);    const offerResponses = useMemo(() => {     if (!messages.length) return {};     return messages.reduce((acc, msg) => {       const response = parseOfferResponse(msg.content);       if (response?.targetMessageId) {         acc[response.targetMessageId] = response;       }       return acc;     }, {});   }, [messages]);    const respondToOffer = useCallback(     async (offerMessage, decision) => {       if (!token || !selectedProduct || !isSeller || !userId) return;       const offerData = parseOfferMessage(offerMessage.content);       if (!offerData) return;       const receiverId =         offerMessage.sender_id === userId ? offerMessage.receiver_id : offerMessage.sender_id;        setRespondingOfferId(offerMessage.id);       try {         if (decision === 'accept' && selectedProductInfo?.status !== 'sold') {           await api.put(             `/products/${selectedProduct}/status`,             { status: 'sold' },             { headers: { Authorization: `Bearer ${token}` } }           );           setSelectedProductInfo((prev) =>             prev ? { ...prev, status: 'sold' } : { status: 'sold', user_id: userId }           );         }          const responsePayload = {           targetMessageId: offerMessage.id,           status: decision === 'accept' ? 'accepted' : 'declined',           offer: offerData,           responderId: userId,           responderName: userDisplayName,           createdAt: new Date().toISOString()         };          await api.post(           '/messages',           {             product_id: selectedProduct,             content: `${OFFER_RESPONSE_PREFIX}${JSON.stringify(responsePayload)}`,             receiver_id: receiverId           },           { headers: { Authorization: `Bearer ${token}` } }         );          toast.success(           decision === 'accept'             ? 'Oferta aceita! Produto marcado como vendido.'             : 'Oferta recusada.'         );         await fetchMessages({           counterpartId: receiverId,           productId: selectedProduct,           playSound: false         });         await loadConversations();       } catch (err) {         console.error(err);         toast.error('Não foi possível responder à oferta. Tente novamente.');       } finally {         setRespondingOfferId(null);       }     },     [       token,       selectedProduct,       isSeller,       selectedProductInfo?.status,       userId,       userDisplayName,       fetchMessages,       loadConversations     ]   );    const handleDeleteConversation = useCallback(     async (conversation) => {       if (!token || !conversation || !userId) return;       const conversationCounterpartId = getConversationCounterpartId(conversation, userId);       if (!conversationCounterpartId) return;       if (typeof window !== 'undefined') {         const confirmed = window.confirm('Apagar conversa!');         if (!confirmed) return;       }       const convKey = getConversationKey(conversation, userId);       setDeletingConversationKey(convKey);       try {         await api.delete(           `/messages/conversation/${conversation.product_id}/${conversationCounterpartId}`,           {             headers: { Authorization: `Bearer ${token}` }           }         );         setConversations((prev) =>           prev.filter((item) => getConversationKey(item, userId) !== convKey)         );         if (           counterpartId !== null &&           Number(conversationCounterpartId) === Number(counterpartId)         ) {           setSelectedProduct(null);           setMessages([]);           setSelectedProductInfo(null);           setCounterpartId(null);         }         toast.success('Conversa apagada.');         await loadConversations();       } catch (err) {         console.error(err);         toast.error('Não foi possível apagar a conversa.');       } finally {         setDeletingConversationKey(null);       }     },     [token, userId, selectedProduct, loadConversations]   );    const handleConversationClick = useCallback(     (conversation) => {       if (!conversation) return;       openChat(conversation.product_id, conversation, {         fallbackProductTitle: conversation.product_title || ''       });       setSidebarOpen(false);       closeContextMenu();     },     [openChat, closeContextMenu]   );    const headerOffset = 'var(--home-header-height, 64px)';   const viewportHeight = `calc(100vh - ${headerOffset})`;    const renderConversationList = () => (     <div className=\\"flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-xl\\">       <div className=\\"flex items-center justify-between border-b bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-white\\">         <span className=\\"text-lg font-semibold\\">Conversas</span>         <button           type=\\"button\\"           className=\\"inline-flex items-center rounded-full border border-white/40 px-3 py-1 text-xs font-semibold lg:hidden\\"           onClick={() => setSidebarOpen(false)}         >           Fechar         </button>       </div>       <div className=\\"flex-1 overflow-y-auto p-3 space-y-2\\">         {conversations.length === 0 && (           <p className=\\"mt-10 text-center text-gray-400\\">Nenhuma conversa</p>         )}           {conversations.map((c) => {             const previewOffer = parseOfferMessage(c.content);             const previewResponse = parseOfferResponse(c.content);             let previewText = c.content;             const conversationCounterpartId = getConversationCounterpartId(c, userId);             const normalizedConversationCounterpart =               conversationCounterpartId !== null && conversationCounterpartId !== undefined                 ? Number(conversationCounterpartId)                 : NaN;             const normalizedCounterpart =               counterpartId !== null && counterpartId !== undefined ? Number(counterpartId) : NaN;             const isActive =               Number.isFinite(normalizedConversationCounterpart) &&               Number.isFinite(normalizedCounterpart) &&               normalizedConversationCounterpart === normalizedCounterpart;             const isUnread = Boolean(userId && c.receiver_id === userId && c.is_read === false);             const isSender = userId && c.sender_id === userId;             const counterpartName = isSender               ? c.receiver_name || c.seller_name               : c.sender_name || c.seller_name;           const counterpartAvatar = isSender ? c.receiver_avatar : c.sender_avatar;           const counterpartInitial = getInitial(counterpartName || 'SaleDay');           const conversationTitle =             c.product_title || (!c.product_id ? 'Conversa direta' : `Produto #${c.product_id}`);            if (previewOffer) {             previewText = `Oferta: ${formatOfferAmount(previewOffer.amount, previewOffer.currency)}`;           } else if (previewResponse) {             previewText =               previewResponse.status === 'accepted'                 ? 'Oferta aceita! Venda confirmada.'                 : 'Oferta recusada.';           }              return (               <button                 key={getConversationKey(c, userId)}               onClick={() => handleConversationClick(c)}               onContextMenu={(event) =>                 openContextMenu(event, { type: 'conversation', conversation: c })               }               onTouchStart={(event) =>                 startLongPress(event, { type: 'conversation', conversation: c })               }               onTouchEnd={cancelLongPress}               onTouchMove={cancelLongPress}               onTouchCancel={cancelLongPress}               disabled={                 Boolean(deletingConversationKey) &&                 getConversationKey(c, userId) === deletingConversationKey               }               className={`relative w-full rounded-xl border p-3 text-left transition ${                 isActive                   ? 'bg-blue-100 border-blue-400 ring-1 ring-blue-200'                   : isUnread                   ? 'bg-emerald-50 border-emerald-400 hover:bg-emerald-100'                   : 'bg-gray-50 border-transparent hover:bg-gray-100'               } ${                 Boolean(deletingConversationKey) &&                 getConversationKey(c, userId) === deletingConversationKey                   ? 'opacity-60'                   : ''               }`}             >               {isUnread && (                 <span className=\\"absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse\\" />               )}               <div className=\\"flex items-center gap-3\\">                 <div className=\\"flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 font-semibold text-blue-600\\">                   {counterpartAvatar ? (                     <img src={counterpartAvatar} alt={counterpartName || 'Usuário SaleDay'} className=\\"h-full w-full rounded-2xl object-cover\\" />                   ) : (                     counterpartInitial                   )}                 </div>                 <div className=\\"min-w-0\\">                   <p className=\\"truncate font-semibold text-gray-900\\">                     {conversationTitle}                   </p>                   <p className=\\"truncate text-xs text-gray-500\\">                     {counterpartName || 'Usuário SaleDay'}                   </p>                   <p className=\\"truncate text-sm text-gray-700\\">{previewText}</p>                 </div>               </div>             </button>           );         })}       </div>     </div>   );     return (     <>     <div       className=\\"bg-slate-100 overflow-hidden\\"       style={{ paddingTop: headerOffset, height: viewportHeight }}     >       <div className=\\"mx-auto flex h-full max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row\\">          <aside className=\\"hidden h-[calc(100vh-var(--home-header-height,64px)-2rem)] w-full max-w-xs lg:block\\">           {renderConversationList()}         </aside>          <div className=\\"flex h-[calc(100vh-var(--home-header-height,64px)-2rem)] flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-xl\\">           {hasActiveConversation ? (             <>               <header className=\\"flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4\\">                 <div className=\\"flex min-w-0 items-center gap-3\\">                   <div className=\\"flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-lg font-semibold text-slate-700\\">                     {selectedMeta.avatar ? (                       <img src={selectedMeta.avatar} alt={selectedMeta.counterpart || selectedMeta.seller || 'Usuário SaleDay'} className=\\"h-full w-full rounded-2xl object-cover\\" />                     ) : (                       getInitial(selectedMeta.counterpart || selectedMeta.seller || 'SaleDay')                     )}                   </div>                   <div className=\\"min-w-0\\">                     <h2 className=\\"truncate text-xl font-semibold text-gray-800\\">{headerPartnerName}</h2>                     <p className=\\"truncate text-sm text-gray-500\\">{headerSubtitle}</p>                   </div>                 </div>                 <div className=\\"flex items-center gap-3\\">                   {productSold && (                     <span className=\\"rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700\\">                       Produto vendido                     </span>                   )}                   <button                     type=\\"button\\"                     className=\\"inline-flex items-center rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 lg:hidden\\"                     onClick={() => setSidebarOpen(true)}                   >                     Conversas                   </button>                 </div>               </header>                <div className=\\"flex-1 overflow-y-auto bg-slate-50 px-4 py-5\\">                 <div className=\\"messages-thread mx-auto flex max-w-3xl flex-col gap-3 pb-8\\">                   {mergedFeedItems.map((item) => {                     if (item.type === 'context') {                       const context = item.context;                       return (                         <div                           key={context.id}                           className=\\"messages-thread__row flex flex-col gap-2 border border-dashed border-slate-200 bg-white/80 p-4\\"                         >                           <p className=\\"text-xs font-semibold uppercase tracking-wide text-gray-500\\">                             Produto em foco                           </p>                           <div className=\\"flex items-center gap-3\\">                             <div className=\\"h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-gray-100\\">                               {context.image ? (                                 <img                                   src={context.image}                                   alt={context.title || 'Produto em foco'}                                   className=\\"h-full w-full object-cover\\"                                 />                               ) : (                                 <span className=\\"flex h-full w-full items-center justify-center text-xs text-gray-400\\">                                   Sem imagem                                 </span>                               )}                             </div>                             <div>                               <p className=\\"text-sm font-semibold text-gray-900\\">                                 {context.title || 'Produto em foco'}                               </p>                               {context.price && (                                 <p className=\\"text-xs font-medium text-emerald-600\\">                                   {context.price}                                 </p>                               )}                               {context.location && (                                 <p className=\\"text-xs text-gray-500\\">{context.location}</p>                               )}                             </div>                           </div>                         </div>                       );                     }                      const m = item.message;                     const offerData = parseOfferMessage(m.content);                     const offerResponse = parseOfferResponse(m.content);                     if (offerResponse) {                       return null;                     }                      const isSender = m.sender_id === userId;                     const senderName = isSender                       ? userDisplayName                       : m.sender_name || selectedMeta.counterpart || selectedMeta.seller || 'Usuário SaleDay';                     const senderAvatar = isSender                       ? userAvatar                       : m.sender_avatar || selectedMeta.avatar || null;                     const senderInitial = isSender ? userInitial : getInitial(senderName);                      const leftAvatar = !isSender ? (                       <div className=\\"messages-thread__avatar flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 overflow-hidden\\">                         {senderAvatar ? (                           <img                             src={senderAvatar}                             alt={senderName}                             loading=\\"lazy\\"                             className=\\"h-full w-full object-cover\\"                           />                         ) : (                           <span>{senderInitial}</span>                         )}                       </div>                     ) : null;                      const rightAvatar = isSender ? (                       <div className=\\"messages-thread__avatar messages-thread__avatar--self flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 overflow-hidden\\">                         {userAvatar ? (                           <img                             src={userAvatar}                             alt={userDisplayName}                             loading=\\"lazy\\"                             className=\\"h-full w-full object-cover\\"                           />                         ) : (                           <span>{userInitial}</span>                         )}                       </div>                     ) : null;                      if (offerData) {                       const response = offerResponses[m.id];                       const awaitingSellerAction = !response && isSeller && !isSender && !productSold;                       const awaitingBuyer = !response && isSender;                       const responseStatus = response?.status;                       const isAccepted = responseStatus === 'accepted';                        return (                         <div                           key={m.id}                           className={`messages-thread__row flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}                         >                           {leftAvatar}                           <div                             className={`messages-offer max-w-[95%] sm:max-w-[75%] ${                               isSender ? 'messages-offer--self' : 'messages-offer--other'                             }`}                           >                             <div className=\\"flex items-center justify-between gap-3\\">                               <p className=\\"text-xs uppercase tracking-wide font-semibold\\">Proposta enviada</p>                               <span className=\\"text-sm font-semibold\\">                                 {formatOfferAmount(offerData.amount, offerData.currency)}                               </span>                             </div>                              {offerData.message && (                               <p className=\\"mt-2 text-sm\\">{offerData.message}</p>                             )}                              <div className=\\"mt-3 flex flex-col gap-2\\">                               {responseStatus && (                                 <span                                   className={`inline-flex items-center justify-start gap-2 rounded-full px-3 py-1 text-xs font-semibold ${                                     isAccepted ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'                                   }`}                                 >                                   {isAccepted ? 'Oferta aceita! Venda confirmada.' : 'Oferta recusada.'}                                 </span>                               )}                                {awaitingSellerAction && (                                 <div className=\\"flex flex-wrap items-center gap-2\\">                                   <button                                     type=\\"button\\"                                     onClick={() => respondToOffer(m, 'accept')}                                     disabled={respondingOfferId === m.id}                                     className=\\"rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60\\"                                   >                                     {respondingOfferId === m.id ? 'Confirmando...' : 'Aceitar'}                                   </button>                                   <button                                     type=\\"button\\"                                     onClick={() => respondToOffer(m, 'decline')}                                     disabled={respondingOfferId === m.id}                                     className=\\"rounded-full bg-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-300 disabled:opacity-60\\"                                   >                                     {respondingOfferId === m.id ? 'Atualizando...' : 'Não aceitar'}                                   </button>                                 </div>                               )}                                {awaitingBuyer && (                                 <span className=\\"text-xs font-medium\\">Aguardando resposta do vendedor...</span>                               )}                             </div>                           </div>                           {rightAvatar}                         </div>                       );                     }                      return (                       <div                         key={m.id}                         className={`messages-thread__row flex items-end gap-2 ${                           isSender ? 'justify-end' : 'justify-start'                         }`}                         onContextMenu={(event) =>                           openContextMenu(event, { type: 'message', messageId: m.id })                         }                         onTouchStart={(event) =>                           startLongPress(event, { type: 'message', messageId: m.id })                         }                         onTouchEnd={cancelLongPress}                         onTouchMove={cancelLongPress}                         onTouchCancel={cancelLongPress}                       >                         {leftAvatar}                         <div                           className={`flex max-w-[85%] sm:max-w-[70%] flex-col gap-1 ${                             isSender ? 'items-end' : 'items-start'                           }`}                         >                           <div                             className={`messages-bubble w-full ${                               isSender ? 'messages-bubble--self' : 'messages-bubble--other'                             }`}                           >                             {m.content}                           </div>                         </div>                         {rightAvatar}                       </div>                     );                   })}                   <span ref={messagesEndRef} />                  </div>               </div>              <form               onSubmit={handleSend}               className=\\"p-4 bg-white border-t shadow flex flex-col sm:flex-row sm:items-center gap-3\\"             >               <input                 className=\\"w-full sm:flex-1 border rounded-full px-4 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-400\\"                 value={newMsg}                 onChange={(e) => setNewMsg(e.target.value)}                 placeholder=\\"Digite sua mensagem...\\"                 disabled={sending}               />               <button                 type=\\"submit\\"                 className=\\"bg-blue-600 text-white px-5 py-3 sm:py-2 rounded-full hover:bg-blue-700 transition disabled:opacity-60\\"                 disabled={sending || !newMsg.trim()}               >                 {sending ? 'Enviando...' : 'Enviar'}               </button>             </form>           </>         ) : (           <div className=\\"flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center text-gray-500\\">                   <p className=\\"text-lg\\">Conversar privada</p>             <button               type=\\"button\\"               className=\\"inline-flex items-center rounded-full border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 lg:hidden\\"               onClick={() => setSidebarOpen(true)}             >               Abrir conversas             </button>           </div>         )}       </div>     </div>      {sidebarOpen && (       <div className=\\"fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden\\" onClick={() => setSidebarOpen(false)}>         <div           className=\\"absolute inset-x-4 top-[calc(var(--home-header-height,64px)+1rem)] h-[calc(100vh-var(--home-header-height,64px)-2rem)]\\"           onClick={(e) => e.stopPropagation()}         >           {renderConversationList()}         </div>       </div>     )}      {contextMenu && (       <div         className=\\"fixed inset-0 z-50\\"         onClick={closeContextMenu}         onContextMenu={(event) => {           event.preventDefault();           closeContextMenu();         }}       >         <div           className=\\"absolute w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl\\"           style={{             top:               typeof window !== 'undefined'                 ? Math.min(contextMenu.y, window.innerHeight - 80)                 : contextMenu.y,             left:               typeof window !== 'undefined'                 ? Math.min(contextMenu.x, window.innerWidth - 200)                 : contextMenu.x           }}           onClick={(event) => event.stopPropagation()}         >           {contextMenu.type === 'message' && (             <button               type=\\"button\\"               onClick={() => {                 closeContextMenu();                 handleDeleteMessage(contextMenu.messageId);               }}               className=\\"flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50\\"               disabled={deletingMessageId === contextMenu.messageId}             >               <span>                 {deletingMessageId === contextMenu.messageId ? 'Removendo...' : 'Apagar mensagem!'}               </span>             </button>           )}           {contextMenu.type === 'conversation' && contextMenu.conversation && (             <button               type=\\"button\\"               onClick={() => {                 closeContextMenu();                 handleDeleteConversation(contextMenu.conversation);               }}               className=\\"flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50\\"               disabled={                 Boolean(deletingConversationKey) &&                 getConversationKey(contextMenu.conversation, userId) === deletingConversationKey               }             >               <span>                 {Boolean(deletingConversationKey) &&                 getConversationKey(contextMenu.conversation, userId) === deletingConversationKey                   ? 'Removendo...'                   : 'Apagar conversa!'}               </span>             </button>           )}         </div>       </div>     )}   </div>   </>   ); }", "productId": 93}	2025-11-25 11:36:09.185153	Evangelista Moraes Tebaldi
113	message_sent	25	\N	17	93	Mensagem no chat do produto 93	{"content": "fe", "productId": 93}	2025-11-25 11:36:23.864269	Evangelista Moraes Tebaldi
114	message_sent	25	\N	9	94	Mensagem no chat do produto 94	{"content": "rir", "productId": 94}	2025-11-25 11:36:37.223276	Guilherme Tebaldi
115	message_sent	25	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764067029582}", "productId": 113}	2025-11-25 11:37:09.599182	Guilherme Tebaldi
116	message_sent	25	\N	9	113	Mensagem no chat do produto 113	{"content": "did", "productId": 113}	2025-11-25 11:37:09.61475	Guilherme Tebaldi
117	message_sent	24	\N	17	93	Mensagem no chat do produto 93	{"content": "__saleday_product_context__:{\\"productId\\":93,\\"title\\":\\"ghb\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762033708795-128196531.png\\",\\"price\\":\\"R$ 64,00\\",\\"location\\":\\"São Paulo, SP, BR\\",\\"timestamp\\":1764067169086}", "productId": 93}	2025-11-25 11:39:44.151274	Evangelista Moraes Tebaldi
118	message_sent	24	\N	17	93	Mensagem no chat do produto 93	{"content": "cece", "productId": 93}	2025-11-25 11:39:44.167958	Evangelista Moraes Tebaldi
119	message_sent	24	\N	9	94	Mensagem no chat do produto 94	{"content": "eww", "productId": 94}	2025-11-25 11:39:56.25245	Guilherme Tebaldi
120	message_sent	24	\N	9	110	Mensagem no chat do produto 110	{"content": "__saleday_product_context__:{\\"productId\\":110,\\"title\\":\\"cris\\",\\"image\\":\\"\\",\\"price\\":null,\\"location\\":\\"BR\\",\\"timestamp\\":1764067202173}", "productId": 110}	2025-11-25 11:40:08.111573	Guilherme Tebaldi
121	message_sent	24	\N	9	110	Mensagem no chat do produto 110	{"content": "e esse?", "productId": 110}	2025-11-25 11:40:08.12868	Guilherme Tebaldi
122	message_sent	9	\N	24	110	Mensagem no chat do produto 110	{"content": "que?", "productId": 110}	2025-11-25 11:40:26.310555	Guilherme Tebaldi
123	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dw"}	2025-11-25 11:40:40.330648	cristiane tebaldi
124	message_sent	9	\N	25	113	Mensagem no chat do produto 113	{"content": "ccc", "productId": 113}	2025-11-25 11:41:48.353788	Guilherme Tebaldi
125	message_sent	25	\N	9	\N	Mensagem enviada via chat direto	{"content": "jn"}	2025-11-25 11:42:27.051015	Guilherme Tebaldi
126	message_sent	24	\N	9	110	Mensagem no chat do produto 110	{"content": "vv", "productId": 110}	2025-11-25 11:51:20.743637	Guilherme Tebaldi
127	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "csc"}	2025-11-25 11:52:12.767959	Guilherme Tebaldi
128	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "w"}	2025-11-25 11:52:52.017345	Guilherme Tebaldi
129	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "w"}	2025-11-25 11:53:05.227628	Guilherme Tebaldi
130	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "w"}	2025-11-25 11:53:13.069192	Guilherme Tebaldi
131	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dw"}	2025-11-25 11:53:29.187103	cristiane tebaldi
132	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dw"}	2025-11-25 11:55:11.671693	cristiane tebaldi
133	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "eve"}	2025-11-25 11:56:01.373804	cristiane tebaldi
134	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "dwd"}	2025-11-25 11:56:10.572343	Guilherme Tebaldi
135	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dw"}	2025-11-25 11:56:14.673991	cristiane tebaldi
136	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dwdwd"}	2025-11-25 11:56:18.130891	cristiane tebaldi
137	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dwdw"}	2025-11-25 11:56:21.245904	cristiane tebaldi
138	message_sent	20	\N	9	103	Mensagem no chat do produto 103	{"content": "__saleday_product_context__:{\\"productId\\":103,\\"title\\":\\"3\\",\\"image\\":\\"\\",\\"price\\":\\"R$ 0,12\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068197348}", "productId": 103}	2025-11-25 11:56:41.528081	Guilherme Tebaldi
139	message_sent	20	\N	9	103	Mensagem no chat do produto 103	{"content": "ccsc", "productId": 103}	2025-11-25 11:56:41.547134	Guilherme Tebaldi
140	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "cec"}	2025-11-25 11:56:45.377047	cristiane tebaldi
141	message_sent	20	\N	9	103	Mensagem no chat do produto 103	{"content": "xsx", "productId": 103}	2025-11-25 11:56:50.595258	Guilherme Tebaldi
142	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "__OFFER__{\\"amount\\":1,\\"currency\\":\\"BRL\\",\\"productId\\":94,\\"productTitle\\":\\"ertyujk\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-25T10:57:09.010Z\\"}", "productId": 94}	2025-11-25 11:57:09.028479	Guilherme Tebaldi
143	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "__OFFER__{\\"amount\\":111,\\"currency\\":\\"BRL\\",\\"productId\\":94,\\"productTitle\\":\\"ertyujk\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-25T11:02:07.251Z\\"}", "productId": 94}	2025-11-25 12:02:07.28302	Guilherme Tebaldi
144	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "__OFFER__{\\"amount\\":11,\\"currency\\":\\"BRL\\",\\"productId\\":94,\\"productTitle\\":\\"ertyujk\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-25T11:02:31.391Z\\"}", "productId": 94}	2025-11-25 12:02:31.40618	Guilherme Tebaldi
145	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "__saleday_product_context__:{\\"productId\\":94,\\"title\\":\\"ertyujk\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"price\\":\\"R$ 456,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1764068573653}", "productId": 94}	2025-11-25 12:02:53.685732	Guilherme Tebaldi
146	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "__OFFER__{\\"amount\\":1,\\"currency\\":\\"BRL\\",\\"productId\\":94,\\"productTitle\\":\\"ertyujk\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-25T11:02:53.653Z\\"}", "productId": 94}	2025-11-25 12:02:53.706778	Guilherme Tebaldi
147	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "wdsd", "productId": 94}	2025-11-25 12:03:06.753212	Guilherme Tebaldi
148	message_sent	20	\N	9	110	Mensagem no chat do produto 110	{"content": "w", "productId": 110}	2025-11-25 12:04:39.920353	Guilherme Tebaldi
149	message_sent	20	\N	17	93	Mensagem no chat do produto 93	{"content": "__saleday_product_context__:{\\"productId\\":93,\\"title\\":\\"ghb\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762033708795-128196531.png\\",\\"price\\":\\"R$ 64,00\\",\\"location\\":\\"São Paulo, SP, BR\\",\\"timestamp\\":1764068727535}", "productId": 93}	2025-11-25 12:05:29.781787	Evangelista Moraes Tebaldi
150	message_sent	20	\N	17	93	Mensagem no chat do produto 93	{"content": "ww", "productId": 93}	2025-11-25 12:05:29.818376	Evangelista Moraes Tebaldi
558	message_sent	23	\N	9	\N	Mensagem enviada via chat direto	{"content": "ee"}	2025-11-25 14:17:07.997166	Guilherme Tebaldi
151	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "www", "productId": 94}	2025-11-25 12:05:37.237565	Guilherme Tebaldi
152	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068749049}", "productId": 97}	2025-11-25 12:05:51.522097	Guilherme Tebaldi
153	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "www", "productId": 97}	2025-11-25 12:05:51.54187	Guilherme Tebaldi
154	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:06:05.04153	Guilherme Tebaldi
155	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__OFFER__{\\"amount\\":1221,\\"currency\\":\\"BRL\\",\\"productId\\":97,\\"productTitle\\":\\"ww\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-25T11:06:05.028Z\\"}", "productId": 97}	2025-11-25 12:06:05.080134	Guilherme Tebaldi
156	message_sent	20	\N	17	93	Mensagem no chat do produto 93	{"content": "dv", "productId": 93}	2025-11-25 12:06:16.001928	Evangelista Moraes Tebaldi
157	message_sent	20	\N	17	93	Mensagem no chat do produto 93	{"content": "__saleday_product_context__:{\\"productId\\":93,\\"title\\":\\"ghb\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762033708795-128196531.png\\",\\"price\\":\\"R$ 64,00\\",\\"location\\":\\"São Paulo, SP, BR\\",\\"timestamp\\":1764068781011}", "productId": 93}	2025-11-25 12:06:21.024466	Evangelista Moraes Tebaldi
158	message_sent	20	\N	17	93	Mensagem no chat do produto 93	{"content": "__OFFER__{\\"amount\\":11,\\"currency\\":\\"BRL\\",\\"productId\\":93,\\"productTitle\\":\\"ghb\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1762033708795-128196531.png\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-25T11:06:21.011Z\\"}", "productId": 93}	2025-11-25 12:06:21.043766	Evangelista Moraes Tebaldi
159	product_sold	9	Guilherme Tebaldi	24	110	Produto cris vendido para jose carmo	{"buyer_email": "jose@carmo.com", "confirmed_at": "2025-11-25T11:08:05.874Z"}	2025-11-25 12:08:05.878826	\N
160	product_sold	9	Guilherme Tebaldi	25	99	Produto w vendido para mila califa	{"buyer_email": "mila@califa.com", "confirmed_at": "2025-11-25T11:12:40.001Z"}	2025-11-25 12:12:40.010076	\N
161	message_sent	20	\N	24	114	Mensagem no chat do produto 114	{"content": "__saleday_product_context__:{\\"productId\\":114,\\"title\\":\\"bomba\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763906903104-534517488.avif\\",\\"price\\":\\"Valor a combinar\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764069526964}", "productId": 114}	2025-11-25 12:18:53.413594	cristiane tebaldi
162	message_sent	20	\N	24	114	Mensagem no chat do produto 114	{"content": "yvyv", "productId": 114}	2025-11-25 12:18:53.477987	cristiane tebaldi
163	message_sent	20	\N	24	114	Mensagem no chat do produto 114	{"content": "k", "productId": 114}	2025-11-25 12:19:20.066706	cristiane tebaldi
164	message_sent	25	\N	9	94	Mensagem no chat do produto 94	{"content": "dwdw", "productId": 94}	2025-11-25 12:22:48.222829	Guilherme Tebaldi
165	message_sent	23	\N	9	94	Mensagem no chat do produto 94	{"content": "wd", "productId": 94}	2025-11-25 12:23:06.816751	Guilherme Tebaldi
166	message_sent	23	\N	9	94	Mensagem no chat do produto 94	{"content": "dwdw", "productId": 94}	2025-11-25 12:23:16.075634	Guilherme Tebaldi
167	message_sent	23	\N	9	94	Mensagem no chat do produto 94	{"content": "ww", "productId": 94}	2025-11-25 12:23:40.957748	Guilherme Tebaldi
168	message_sent	23	\N	9	94	Mensagem no chat do produto 94	{"content": "www", "productId": 94}	2025-11-25 12:23:52.36733	Guilherme Tebaldi
169	message_sent	25	\N	9	94	Mensagem no chat do produto 94	{"content": "www", "productId": 94}	2025-11-25 12:23:56.013176	Guilherme Tebaldi
170	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":359,\\"status\\":\\"declined\\",\\"offer\\":{\\"amount\\":1221,\\"currency\\":\\"BRL\\",\\"productId\\":97,\\"productTitle\\":\\"ww\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-25T11:06:05.028Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-11-25T11:26:14.664Z\\"}", "productId": 97}	2025-11-25 12:26:14.689892	Guilherme Tebaldi
171	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "__saleday_product_context__:{\\"productId\\":94,\\"title\\":\\"ertyujk\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"price\\":\\"R$ 456,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1764070007921}", "productId": 94}	2025-11-25 12:26:47.940758	Guilherme Tebaldi
172	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "__OFFER__{\\"amount\\":112,\\"currency\\":\\"BRL\\",\\"productId\\":94,\\"productTitle\\":\\"ertyujk\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-25T11:26:47.920Z\\"}", "productId": 94}	2025-11-25 12:26:47.965006	Guilherme Tebaldi
173	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "ee", "productId": 94}	2025-11-25 12:31:37.156481	Guilherme Tebaldi
174	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "__saleday_product_context__:{\\"productId\\":94,\\"title\\":\\"ertyujk\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"price\\":\\"R$ 456,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1764070316676}", "productId": 94}	2025-11-25 12:31:56.697531	Guilherme Tebaldi
175	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "__OFFER__{\\"amount\\":11,\\"currency\\":\\"BRL\\",\\"productId\\":94,\\"productTitle\\":\\"ertyujk\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-25T11:31:56.676Z\\"}", "productId": 94}	2025-11-25 12:31:56.733806	Guilherme Tebaldi
176	message_sent	9	\N	20	94	Mensagem no chat do produto 94	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":346,\\"status\\":\\"declined\\",\\"offer\\":{\\"amount\\":1,\\"currency\\":\\"BRL\\",\\"productId\\":94,\\"productTitle\\":\\"ertyujk\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-25T10:57:09.010Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-11-25T11:32:22.065Z\\"}", "productId": 94}	2025-11-25 12:32:22.089418	Guilherme Tebaldi
342	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "w", "productId": 97}	2025-11-25 13:12:34.866309	Guilherme Tebaldi
177	message_sent	9	\N	20	94	Mensagem no chat do produto 94	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":374,\\"status\\":\\"declined\\",\\"offer\\":{\\"amount\\":112,\\"currency\\":\\"BRL\\",\\"productId\\":94,\\"productTitle\\":\\"ertyujk\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-25T11:26:47.920Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-11-25T11:32:23.332Z\\"}", "productId": 94}	2025-11-25 12:32:23.347718	Guilherme Tebaldi
178	message_sent	9	\N	20	94	Mensagem no chat do produto 94	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":377,\\"status\\":\\"declined\\",\\"offer\\":{\\"amount\\":11,\\"currency\\":\\"BRL\\",\\"productId\\":94,\\"productTitle\\":\\"ertyujk\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-25T11:31:56.676Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-11-25T11:32:24.332Z\\"}", "productId": 94}	2025-11-25 12:32:24.349205	Guilherme Tebaldi
179	message_sent	9	\N	20	94	Mensagem no chat do produto 94	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":347,\\"status\\":\\"declined\\",\\"offer\\":{\\"amount\\":111,\\"currency\\":\\"BRL\\",\\"productId\\":94,\\"productTitle\\":\\"ertyujk\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-25T11:02:07.251Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-11-25T11:32:29.482Z\\"}", "productId": 94}	2025-11-25 12:32:29.510571	Guilherme Tebaldi
180	message_sent	9	\N	20	94	Mensagem no chat do produto 94	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":350,\\"status\\":\\"accepted\\",\\"offer\\":{\\"amount\\":1,\\"currency\\":\\"BRL\\",\\"productId\\":94,\\"productTitle\\":\\"ertyujk\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-25T11:02:53.653Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-11-25T11:32:35.300Z\\"}", "productId": 94}	2025-11-25 12:32:35.309318	Guilherme Tebaldi
181	message_sent	20	\N	9	94	Mensagem no chat do produto 94	{"content": "odwdw", "productId": 94}	2025-11-25 12:32:49.565254	Guilherme Tebaldi
182	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dwdwd", "productId": 113}	2025-11-25 12:34:44.990037	Guilherme Tebaldi
183	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:35:12.938146	Guilherme Tebaldi
184	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "ww", "productId": 113}	2025-11-25 12:35:12.955051	Guilherme Tebaldi
185	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "ww", "productId": 113}	2025-11-25 12:36:04.764579	Guilherme Tebaldi
186	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 12:43:47.411845	Guilherme Tebaldi
187	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 12:44:18.087926	Guilherme Tebaldi
188	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764071098953}", "productId": 97}	2025-11-25 12:45:02.12076	Guilherme Tebaldi
189	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "fefe", "productId": 97}	2025-11-25 12:45:02.137607	Guilherme Tebaldi
190	message_sent	20	\N	17	93	Mensagem no chat do produto 93	{"content": "ww", "productId": 93}	2025-11-25 12:48:38.761689	Evangelista Moraes Tebaldi
191	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "w", "productId": 97}	2025-11-25 12:49:06.240833	Guilherme Tebaldi
192	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 12:49:13.701303	Guilherme Tebaldi
193	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 12:49:25.18682	Guilherme Tebaldi
194	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "qw", "productId": 97}	2025-11-25 12:51:21.369437	Guilherme Tebaldi
195	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "w", "productId": 97}	2025-11-25 12:51:52.095795	Guilherme Tebaldi
196	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 12:52:26.787008	Guilherme Tebaldi
197	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "dwdw", "productId": 97}	2025-11-25 12:52:34.925964	Guilherme Tebaldi
198	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "did", "productId": 113}	2025-11-25 12:52:44.508772	Guilherme Tebaldi
199	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 12:52:57.427558	Guilherme Tebaldi
200	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "ww", "productId": 113}	2025-11-25 12:53:09.547372	Guilherme Tebaldi
201	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:55:48.936017	Guilherme Tebaldi
202	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "w", "productId": 97}	2025-11-25 12:55:48.943041	Guilherme Tebaldi
203	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:56:45.682135	Guilherme Tebaldi
204	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dd", "productId": 113}	2025-11-25 12:56:45.700427	Guilherme Tebaldi
205	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:56:50.26762	Guilherme Tebaldi
206	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "dwd", "productId": 97}	2025-11-25 12:56:50.288322	Guilherme Tebaldi
207	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:57:00.673942	Guilherme Tebaldi
208	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "dw", "productId": 97}	2025-11-25 12:57:00.69281	Guilherme Tebaldi
209	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:57:06.944908	Guilherme Tebaldi
210	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:57:07.087168	Guilherme Tebaldi
211	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:57:07.468813	Guilherme Tebaldi
212	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:57:11.887795	Guilherme Tebaldi
213	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:57:12.451167	Guilherme Tebaldi
214	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:57:13.769128	Guilherme Tebaldi
215	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:57:16.870907	Guilherme Tebaldi
216	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dwdwdd", "productId": 113}	2025-11-25 12:57:17.169017	Guilherme Tebaldi
217	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:57:17.227158	Guilherme Tebaldi
218	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:57:17.442827	Guilherme Tebaldi
219	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:57:18.737015	Guilherme Tebaldi
220	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dwd", "productId": 113}	2025-11-25 12:57:20.843235	Guilherme Tebaldi
221	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:57:20.905788	Guilherme Tebaldi
222	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:57:21.879819	Guilherme Tebaldi
223	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:57:22.539583	Guilherme Tebaldi
224	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:57:23.734296	Guilherme Tebaldi
225	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:57:26.865237	Guilherme Tebaldi
226	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:57:27.43823	Guilherme Tebaldi
227	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:57:28.730469	Guilherme Tebaldi
228	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:57:31.865598	Guilherme Tebaldi
372	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "csc", "productId": 97}	2025-11-25 13:19:24.371733	Guilherme Tebaldi
229	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:57:32.449093	Guilherme Tebaldi
230	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:57:33.736319	Guilherme Tebaldi
231	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:57:36.871339	Guilherme Tebaldi
232	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:57:37.476378	Guilherme Tebaldi
233	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:57:38.732652	Guilherme Tebaldi
234	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:57:41.860102	Guilherme Tebaldi
235	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:57:42.504876	Guilherme Tebaldi
236	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:57:43.730939	Guilherme Tebaldi
237	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:57:46.862804	Guilherme Tebaldi
238	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:57:47.454813	Guilherme Tebaldi
239	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:57:48.737567	Guilherme Tebaldi
240	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:57:51.869065	Guilherme Tebaldi
241	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:57:52.484867	Guilherme Tebaldi
242	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:57:53.727024	Guilherme Tebaldi
243	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:57:56.859362	Guilherme Tebaldi
244	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:57:57.520798	Guilherme Tebaldi
245	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:57:58.725836	Guilherme Tebaldi
246	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:58:01.861262	Guilherme Tebaldi
247	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:58:02.442536	Guilherme Tebaldi
248	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:58:03.735072	Guilherme Tebaldi
249	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:58:06.868881	Guilherme Tebaldi
250	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:58:07.504069	Guilherme Tebaldi
251	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:58:08.729134	Guilherme Tebaldi
252	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:58:11.863568	Guilherme Tebaldi
253	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:58:12.54367	Guilherme Tebaldi
254	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:58:13.731862	Guilherme Tebaldi
255	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:58:16.861072	Guilherme Tebaldi
256	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:58:17.487495	Guilherme Tebaldi
257	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:58:18.72543	Guilherme Tebaldi
258	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:58:21.849452	Guilherme Tebaldi
259	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:58:22.525261	Guilherme Tebaldi
260	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:58:23.7287	Guilherme Tebaldi
261	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:58:26.866893	Guilherme Tebaldi
262	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:58:27.47061	Guilherme Tebaldi
263	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:58:28.728427	Guilherme Tebaldi
264	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:58:31.865166	Guilherme Tebaldi
265	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:58:32.509209	Guilherme Tebaldi
266	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:58:33.7283	Guilherme Tebaldi
267	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:58:36.864016	Guilherme Tebaldi
268	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:58:37.458356	Guilherme Tebaldi
269	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:58:38.728271	Guilherme Tebaldi
270	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:58:41.865703	Guilherme Tebaldi
271	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:58:42.491601	Guilherme Tebaldi
272	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:58:43.727766	Guilherme Tebaldi
273	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:58:46.862868	Guilherme Tebaldi
274	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:58:47.526277	Guilherme Tebaldi
275	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:58:48.721504	Guilherme Tebaldi
276	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:58:51.867369	Guilherme Tebaldi
277	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:58:52.448509	Guilherme Tebaldi
278	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:58:53.738173	Guilherme Tebaldi
279	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:58:56.87204	Guilherme Tebaldi
280	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:58:57.510586	Guilherme Tebaldi
281	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:58:58.746882	Guilherme Tebaldi
282	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:59:01.874477	Guilherme Tebaldi
283	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:59:02.569329	Guilherme Tebaldi
284	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:59:03.745466	Guilherme Tebaldi
285	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:59:06.876219	Guilherme Tebaldi
286	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:59:07.500154	Guilherme Tebaldi
287	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:59:08.734599	Guilherme Tebaldi
288	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:59:11.878768	Guilherme Tebaldi
289	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:59:12.53447	Guilherme Tebaldi
290	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:59:13.733432	Guilherme Tebaldi
291	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:59:16.874604	Guilherme Tebaldi
292	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:59:17.481056	Guilherme Tebaldi
293	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:59:18.733419	Guilherme Tebaldi
294	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:59:21.873171	Guilherme Tebaldi
295	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:59:22.456831	Guilherme Tebaldi
296	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:59:23.750919	Guilherme Tebaldi
297	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:59:26.89132	Guilherme Tebaldi
298	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:59:27.55802	Guilherme Tebaldi
299	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:59:28.747866	Guilherme Tebaldi
300	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:59:31.890235	Guilherme Tebaldi
301	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:59:32.500676	Guilherme Tebaldi
302	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:59:33.749373	Guilherme Tebaldi
303	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:59:36.886281	Guilherme Tebaldi
304	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:59:37.530773	Guilherme Tebaldi
305	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:59:38.76356	Guilherme Tebaldi
306	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:59:41.875846	Guilherme Tebaldi
307	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:59:42.486966	Guilherme Tebaldi
308	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:59:43.750056	Guilherme Tebaldi
309	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:59:46.944014	Guilherme Tebaldi
310	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:59:47.248016	Guilherme Tebaldi
311	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:59:47.26941	Guilherme Tebaldi
312	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:59:47.269497	Guilherme Tebaldi
313	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:59:52.219708	Guilherme Tebaldi
314	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:59:52.25327	Guilherme Tebaldi
315	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:59:52.299642	Guilherme Tebaldi
317	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 12:59:57.270416	Guilherme Tebaldi
316	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 12:59:57.27025	Guilherme Tebaldi
318	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 12:59:57.27616	Guilherme Tebaldi
319	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764068765028}", "productId": 97}	2025-11-25 13:00:02.273464	Guilherme Tebaldi
320	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764066306645}", "productId": 113}	2025-11-25 13:00:02.278292	Guilherme Tebaldi
321	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764070510519}", "productId": 113}	2025-11-25 13:00:02.396589	Guilherme Tebaldi
322	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dwdwdw", "productId": 113}	2025-11-25 13:00:18.124492	Guilherme Tebaldi
323	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "dwd", "productId": 97}	2025-11-25 13:00:27.368416	Guilherme Tebaldi
324	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dwdw", "productId": 113}	2025-11-25 13:00:37.3524	Guilherme Tebaldi
325	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "veve", "productId": 97}	2025-11-25 13:00:42.877253	Guilherme Tebaldi
326	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dwd", "productId": 113}	2025-11-25 13:00:45.742129	Guilherme Tebaldi
327	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "dwdwdw", "productId": 97}	2025-11-25 13:00:59.297543	Guilherme Tebaldi
328	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "www", "productId": 97}	2025-11-25 13:02:38.931008	Guilherme Tebaldi
329	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "ww", "productId": 113}	2025-11-25 13:02:48.726614	Guilherme Tebaldi
330	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:02:54.197776	Guilherme Tebaldi
331	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "w", "productId": 97}	2025-11-25 13:05:35.170531	Guilherme Tebaldi
332	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "w", "productId": 97}	2025-11-25 13:05:53.69456	Guilherme Tebaldi
333	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:06:18.820637	Guilherme Tebaldi
334	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:06:27.664275	Guilherme Tebaldi
335	message_sent	9	\N	17	93	Mensagem no chat do produto 93	{"content": "__saleday_product_context__:{\\"productId\\":93,\\"title\\":\\"ghb\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762033708795-128196531.png\\",\\"price\\":\\"R$ 64,00\\",\\"location\\":\\"São Paulo, SP, BR\\",\\"timestamp\\":1764072525832}", "productId": 93}	2025-11-25 13:08:45.884927	Evangelista Moraes Tebaldi
336	message_sent	9	\N	17	93	Mensagem no chat do produto 93	{"content": "__saleday_product_context__:{\\"productId\\":93,\\"title\\":\\"ghb\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762033708795-128196531.png\\",\\"price\\":\\"R$ 64,00\\",\\"location\\":\\"São Paulo, SP, BR\\",\\"timestamp\\":1764072525849}", "productId": 93}	2025-11-25 13:08:45.889292	Evangelista Moraes Tebaldi
337	message_sent	9	\N	17	93	Mensagem no chat do produto 93	{"content": "ee", "productId": 93}	2025-11-25 13:08:48.189099	Evangelista Moraes Tebaldi
338	message_sent	9	\N	17	93	Mensagem no chat do produto 93	{"content": "ww", "productId": 93}	2025-11-25 13:08:51.743752	Evangelista Moraes Tebaldi
339	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "dwdw", "productId": 97}	2025-11-25 13:09:24.124665	Guilherme Tebaldi
340	message_sent	20	\N	17	93	Mensagem no chat do produto 93	{"content": "__saleday_product_context__:{\\"productId\\":93,\\"title\\":\\"ghb\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762033708795-128196531.png\\",\\"price\\":\\"R$ 64,00\\",\\"location\\":\\"São Paulo, SP, BR\\",\\"timestamp\\":1764072745564}", "productId": 93}	2025-11-25 13:12:25.619665	Evangelista Moraes Tebaldi
341	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764072750657}", "productId": 97}	2025-11-25 13:12:30.78047	Guilherme Tebaldi
555	message_sent	9	\N	23	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-11-25 14:15:48.86811	caroline borges
343	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764072763629}", "productId": 97}	2025-11-25 13:12:43.724955	Guilherme Tebaldi
344	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:12:46.308342	Guilherme Tebaldi
345	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764072774886}", "productId": 113}	2025-11-25 13:12:54.981232	Guilherme Tebaldi
346	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "w", "productId": 113}	2025-11-25 13:12:57.66471	Guilherme Tebaldi
347	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:13:01.730393	Guilherme Tebaldi
348	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:13:20.857002	Guilherme Tebaldi
349	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "w", "productId": 113}	2025-11-25 13:13:29.538149	Guilherme Tebaldi
350	message_sent	20	\N	9	105	Mensagem no chat do produto 105	{"content": "__saleday_product_context__:{\\"productId\\":105,\\"title\\":\\"2\\",\\"image\\":\\"\\",\\"price\\":\\"R$ 2,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764072832382}", "productId": 105}	2025-11-25 13:13:52.46878	Guilherme Tebaldi
351	message_sent	20	\N	9	105	Mensagem no chat do produto 105	{"content": "__saleday_product_context__:{\\"productId\\":105,\\"title\\":\\"2\\",\\"image\\":\\"\\",\\"price\\":\\"R$ 2,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764072832382}", "productId": 105}	2025-11-25 13:13:52.474049	Guilherme Tebaldi
352	message_sent	20	\N	9	105	Mensagem no chat do produto 105	{"content": "w", "productId": 105}	2025-11-25 13:13:55.559332	Guilherme Tebaldi
353	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "w", "productId": 97}	2025-11-25 13:14:03.024331	Guilherme Tebaldi
354	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764072857654}", "productId": 97}	2025-11-25 13:14:17.732444	Guilherme Tebaldi
355	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764072857654}", "productId": 97}	2025-11-25 13:14:17.756654	Guilherme Tebaldi
356	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "w", "productId": 97}	2025-11-25 13:14:20.760531	Guilherme Tebaldi
357	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:14:31.788999	Guilherme Tebaldi
358	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764072894034}", "productId": 97}	2025-11-25 13:14:54.116835	Guilherme Tebaldi
359	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:14:57.47949	Guilherme Tebaldi
360	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:15:00.328977	Guilherme Tebaldi
361	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "w", "productId": 97}	2025-11-25 13:15:05.425158	Guilherme Tebaldi
362	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:15:14.62228	Guilherme Tebaldi
363	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764072918757}", "productId": 97}	2025-11-25 13:15:18.839676	Guilherme Tebaldi
364	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:15:21.864134	Guilherme Tebaldi
365	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150617}", "productId": 97}	2025-11-25 13:19:10.849985	Guilherme Tebaldi
366	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150646}", "productId": 97}	2025-11-25 13:19:10.941298	Guilherme Tebaldi
367	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150702}", "productId": 97}	2025-11-25 13:19:10.944896	Guilherme Tebaldi
368	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150805}", "productId": 97}	2025-11-25 13:19:10.948795	Guilherme Tebaldi
369	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150646}", "productId": 97}	2025-11-25 13:19:10.967275	Guilherme Tebaldi
370	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150646}", "productId": 97}	2025-11-25 13:19:23.296837	Guilherme Tebaldi
371	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150805}", "productId": 97}	2025-11-25 13:19:23.298042	Guilherme Tebaldi
373	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150646}", "productId": 97}	2025-11-25 13:19:24.467964	Guilherme Tebaldi
374	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "dwdw", "productId": 97}	2025-11-25 13:19:27.137142	Guilherme Tebaldi
375	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150646}", "productId": 97}	2025-11-25 13:19:27.225902	Guilherme Tebaldi
376	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150805}", "productId": 97}	2025-11-25 13:19:28.251969	Guilherme Tebaldi
377	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150646}", "productId": 97}	2025-11-25 13:19:28.257252	Guilherme Tebaldi
378	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150646}", "productId": 97}	2025-11-25 13:19:32.281758	Guilherme Tebaldi
379	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "efe", "productId": 97}	2025-11-25 13:19:32.315541	Guilherme Tebaldi
380	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150805}", "productId": 97}	2025-11-25 13:19:33.272047	Guilherme Tebaldi
381	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150646}", "productId": 97}	2025-11-25 13:19:33.272246	Guilherme Tebaldi
382	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150646}", "productId": 97}	2025-11-25 13:19:38.253472	Guilherme Tebaldi
383	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150805}", "productId": 97}	2025-11-25 13:19:38.277508	Guilherme Tebaldi
385	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150805}", "productId": 97}	2025-11-25 13:19:43.239639	Guilherme Tebaldi
384	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150646}", "productId": 97}	2025-11-25 13:19:43.239439	Guilherme Tebaldi
386	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150646}", "productId": 97}	2025-11-25 13:19:48.259455	Guilherme Tebaldi
387	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150805}", "productId": 97}	2025-11-25 13:19:48.271636	Guilherme Tebaldi
388	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150805}", "productId": 97}	2025-11-25 13:19:53.396816	Guilherme Tebaldi
389	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150646}", "productId": 97}	2025-11-25 13:19:53.397085	Guilherme Tebaldi
390	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150805}", "productId": 97}	2025-11-25 13:19:54.022693	Guilherme Tebaldi
391	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150646}", "productId": 97}	2025-11-25 13:19:54.065886	Guilherme Tebaldi
392	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:20:06.635634	Guilherme Tebaldi
393	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073150646}", "productId": 97}	2025-11-25 13:20:10.594519	Guilherme Tebaldi
394	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:20:10.618837	Guilherme Tebaldi
395	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:20:16.455257	Guilherme Tebaldi
396	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:20:20.449736	Guilherme Tebaldi
556	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "brbr"}	2025-11-25 14:16:41.693085	cristiane tebaldi
397	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073235008}", "productId": 97}	2025-11-25 13:20:35.088587	Guilherme Tebaldi
398	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073235008}", "productId": 97}	2025-11-25 13:20:35.092491	Guilherme Tebaldi
399	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "xcs", "productId": 97}	2025-11-25 13:20:38.838687	Guilherme Tebaldi
400	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073251757}", "productId": 113}	2025-11-25 13:20:51.811268	Guilherme Tebaldi
401	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073251757}", "productId": 113}	2025-11-25 13:20:51.834876	Guilherme Tebaldi
402	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "w", "productId": 113}	2025-11-25 13:21:16.86871	Guilherme Tebaldi
403	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073281627}", "productId": 113}	2025-11-25 13:21:21.694616	Guilherme Tebaldi
404	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073281627}", "productId": 113}	2025-11-25 13:21:21.722807	Guilherme Tebaldi
405	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073296231}", "productId": 113}	2025-11-25 13:21:36.332616	Guilherme Tebaldi
406	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073296231}", "productId": 113}	2025-11-25 13:21:36.342952	Guilherme Tebaldi
408	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073318674}", "productId": 97}	2025-11-25 13:21:58.771962	Guilherme Tebaldi
407	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073318674}", "productId": 97}	2025-11-25 13:21:58.771841	Guilherme Tebaldi
409	message_sent	23	\N	9	94	Mensagem no chat do produto 94	{"content": "__saleday_product_context__:{\\"productId\\":94,\\"title\\":\\"ertyujk\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"price\\":\\"R$ 456,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1764073410594}", "productId": 94}	2025-11-25 13:23:30.718612	Guilherme Tebaldi
410	message_sent	23	\N	9	94	Mensagem no chat do produto 94	{"content": "__saleday_product_context__:{\\"productId\\":94,\\"title\\":\\"ertyujk\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762282751078-971693098.png\\",\\"price\\":\\"R$ 456,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1764073410594}", "productId": 94}	2025-11-25 13:23:30.758637	Guilherme Tebaldi
411	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "w", "productId": 97}	2025-11-25 13:28:35.265026	Guilherme Tebaldi
412	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073716147}", "productId": 97}	2025-11-25 13:28:36.322433	Guilherme Tebaldi
413	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073716162}", "productId": 97}	2025-11-25 13:28:36.412204	Guilherme Tebaldi
414	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073716147}", "productId": 97}	2025-11-25 13:28:36.417101	Guilherme Tebaldi
415	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073716560}", "productId": 97}	2025-11-25 13:28:36.679872	Guilherme Tebaldi
416	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073716560}", "productId": 97}	2025-11-25 13:28:36.690804	Guilherme Tebaldi
417	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"\\",\\"price\\":null,\\"location\\":null,\\"timestamp\\":1764073725228}", "productId": 97}	2025-11-25 13:28:45.416134	Guilherme Tebaldi
418	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073725345}", "productId": 97}	2025-11-25 13:28:45.47708	Guilherme Tebaldi
419	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073725345}", "productId": 97}	2025-11-25 13:28:45.507457	Guilherme Tebaldi
420	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073725845}", "productId": 97}	2025-11-25 13:28:45.937717	Guilherme Tebaldi
421	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073725845}", "productId": 97}	2025-11-25 13:28:45.99348	Guilherme Tebaldi
422	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073749071}", "productId": 97}	2025-11-25 13:29:09.33757	Guilherme Tebaldi
423	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073749105}", "productId": 97}	2025-11-25 13:29:09.372851	Guilherme Tebaldi
424	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073749105}", "productId": 97}	2025-11-25 13:29:09.375545	Guilherme Tebaldi
425	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073749553}", "productId": 97}	2025-11-25 13:29:09.649195	Guilherme Tebaldi
426	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073749553}", "productId": 97}	2025-11-25 13:29:09.650752	Guilherme Tebaldi
427	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "sw", "productId": 97}	2025-11-25 13:29:16.055358	Guilherme Tebaldi
428	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "dwd", "productId": 97}	2025-11-25 13:29:20.670104	Guilherme Tebaldi
429	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073809056}", "productId": 97}	2025-11-25 13:30:09.171128	Guilherme Tebaldi
430	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073809056}", "productId": 97}	2025-11-25 13:30:09.178034	Guilherme Tebaldi
431	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:30:13.05423	Guilherme Tebaldi
432	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073809056}", "productId": 97}	2025-11-25 13:30:13.154682	Guilherme Tebaldi
433	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073809056}", "productId": 97}	2025-11-25 13:30:14.168192	Guilherme Tebaldi
434	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073809056}", "productId": 97}	2025-11-25 13:30:19.209031	Guilherme Tebaldi
435	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073820115}", "productId": 97}	2025-11-25 13:30:20.261877	Guilherme Tebaldi
436	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073820614}", "productId": 97}	2025-11-25 13:30:20.906435	Guilherme Tebaldi
437	message_sent	9	\N	24	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"\\",\\"price\\":null,\\"location\\":null,\\"timestamp\\":1764073830225}", "productId": 97}	2025-11-25 13:30:30.330697	Guilherme Tebaldi
438	message_sent	9	\N	24	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:30:41.313992	Guilherme Tebaldi
439	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:30:47.929857	Guilherme Tebaldi
440	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073852889}", "productId": 97}	2025-11-25 13:30:52.978496	Guilherme Tebaldi
441	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-11-25 13:31:34.104574	cristiane tebaldi
442	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073856971}", "productId": 97}	2025-11-25 13:31:38.149023	Guilherme Tebaldi
443	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:31:38.207827	Guilherme Tebaldi
444	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-11-25 13:31:43.30161	cristiane tebaldi
445	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "w", "productId": 97}	2025-11-25 13:31:47.118354	Guilherme Tebaldi
557	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "fefef"}	2025-11-25 14:17:00.311566	cristiane tebaldi
446	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073910045}", "productId": 97}	2025-11-25 13:31:53.308805	Guilherme Tebaldi
447	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "w", "productId": 97}	2025-11-25 13:31:53.327313	Guilherme Tebaldi
448	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "dwdw", "productId": 97}	2025-11-25 13:32:02.122438	Guilherme Tebaldi
449	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dwdw"}	2025-11-25 13:32:05.323184	cristiane tebaldi
450	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "dwdw", "productId": 97}	2025-11-25 13:32:08.627736	Guilherme Tebaldi
451	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dwdw"}	2025-11-25 13:32:11.35343	cristiane tebaldi
452	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "dwdw", "productId": 97}	2025-11-25 13:32:15.332132	Guilherme Tebaldi
453	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dwdwd"}	2025-11-25 13:32:18.274063	cristiane tebaldi
454	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "csc", "productId": 97}	2025-11-25 13:32:32.920167	Guilherme Tebaldi
455	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073960318}", "productId": 113}	2025-11-25 13:32:43.719969	Guilherme Tebaldi
456	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dwdw", "productId": 113}	2025-11-25 13:32:43.758162	Guilherme Tebaldi
457	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "efe"}	2025-11-25 13:32:48.666232	cristiane tebaldi
458	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "csc", "productId": 113}	2025-11-25 13:33:04.028054	Guilherme Tebaldi
459	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "ddwd", "productId": 113}	2025-11-25 13:33:21.933065	Guilherme Tebaldi
460	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dqd", "productId": 113}	2025-11-25 13:33:27.458306	Guilherme Tebaldi
461	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "xs", "productId": 113}	2025-11-25 13:34:13.929184	Guilherme Tebaldi
462	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "xs"}	2025-11-25 13:34:17.256877	cristiane tebaldi
463	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "w", "productId": 113}	2025-11-25 13:34:34.613205	Guilherme Tebaldi
464	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "w"}	2025-11-25 13:34:37.372247	cristiane tebaldi
465	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "e"}	2025-11-25 13:35:50.953183	cristiane tebaldi
466	message_sent	9	\N	17	93	Mensagem no chat do produto 93	{"content": "__saleday_product_context__:{\\"productId\\":93,\\"title\\":\\"ghb\\",\\"image\\":\\"http://localhost:5000/uploads/products/1762033708795-128196531.png\\",\\"price\\":\\"R$ 64,00\\",\\"location\\":\\"São Paulo, SP, BR\\",\\"timestamp\\":1764074160047}", "productId": 93}	2025-11-25 13:36:02.997074	Evangelista Moraes Tebaldi
467	message_sent	9	\N	17	93	Mensagem no chat do produto 93	{"content": "eeee", "productId": 93}	2025-11-25 13:36:03.019706	Evangelista Moraes Tebaldi
468	message_sent	9	\N	17	93	Mensagem no chat do produto 93	{"content": "eeee", "productId": 93}	2025-11-25 13:36:05.555302	Evangelista Moraes Tebaldi
469	message_sent	9	\N	17	93	Mensagem no chat do produto 93	{"content": "ee", "productId": 93}	2025-11-25 13:36:08.144301	Evangelista Moraes Tebaldi
470	message_sent	9	\N	17	93	Mensagem no chat do produto 93	{"content": "ee", "productId": 93}	2025-11-25 13:36:12.716379	Evangelista Moraes Tebaldi
471	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dwdw", "productId": 113}	2025-11-25 13:36:24.578979	Guilherme Tebaldi
472	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:36:53.246898	Guilherme Tebaldi
473	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:37:14.392637	Guilherme Tebaldi
474	message_sent	20	\N	9	103	Mensagem no chat do produto 103	{"content": "__saleday_product_context__:{\\"productId\\":103,\\"title\\":\\"3\\",\\"image\\":\\"\\",\\"price\\":\\"R$ 0,12\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764074241853}", "productId": 103}	2025-11-25 13:37:25.556859	Guilherme Tebaldi
475	message_sent	20	\N	9	103	Mensagem no chat do produto 103	{"content": "ww", "productId": 103}	2025-11-25 13:37:25.589702	Guilherme Tebaldi
476	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "ww", "productId": 113}	2025-11-25 13:37:54.019103	Guilherme Tebaldi
477	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "w", "productId": 113}	2025-11-25 13:43:49.085252	Guilherme Tebaldi
478	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-11-25 13:44:13.922906	cristiane tebaldi
479	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "ww", "productId": 113}	2025-11-25 13:44:17.542456	Guilherme Tebaldi
480	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "c"}	2025-11-25 13:44:36.888298	cristiane tebaldi
481	message_sent	9	\N	23	\N	Mensagem enviada via chat direto	{"content": "w"}	2025-11-25 13:45:24.760239	caroline borges
482	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073857673}", "productId": 97}	2025-11-25 13:45:35.723221	Guilherme Tebaldi
483	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "qq", "productId": 97}	2025-11-25 13:45:35.748452	Guilherme Tebaldi
484	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "qq", "productId": 97}	2025-11-25 13:45:40.291422	Guilherme Tebaldi
485	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "qq", "productId": 97}	2025-11-25 13:45:45.549531	Guilherme Tebaldi
486	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764074753376}", "productId": 113}	2025-11-25 13:45:55.430917	Guilherme Tebaldi
487	message_sent	24	\N	9	113	Mensagem no chat do produto 113	{"content": "qqq", "productId": 113}	2025-11-25 13:45:55.454766	Guilherme Tebaldi
488	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "q", "productId": 97}	2025-11-25 13:46:19.549274	Guilherme Tebaldi
489	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:49:21.948944	Guilherme Tebaldi
490	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073857673}", "productId": 97}	2025-11-25 13:51:12.916895	Guilherme Tebaldi
491	message_sent	24	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 13:51:12.938845	Guilherme Tebaldi
492	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073960318}", "productId": 113}	2025-11-25 13:51:31.514029	Guilherme Tebaldi
493	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dwdw", "productId": 113}	2025-11-25 13:51:31.531264	Guilherme Tebaldi
494	message_sent	9	\N	20	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073960318}", "productId": 113}	2025-11-25 13:51:40.597294	Guilherme Tebaldi
495	message_sent	9	\N	20	113	Mensagem no chat do produto 113	{"content": "wdw", "productId": 113}	2025-11-25 13:51:40.61174	Guilherme Tebaldi
496	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073960318}", "productId": 113}	2025-11-25 13:56:11.848467	Guilherme Tebaldi
497	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "w", "productId": 113}	2025-11-25 13:56:11.874505	Guilherme Tebaldi
498	message_sent	9	\N	20	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073960318}", "productId": 113}	2025-11-25 13:56:14.604949	Guilherme Tebaldi
499	message_sent	9	\N	20	113	Mensagem no chat do produto 113	{"content": "w", "productId": 113}	2025-11-25 13:56:14.625518	Guilherme Tebaldi
500	message_sent	9	\N	20	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073960318}", "productId": 113}	2025-11-25 13:56:25.13013	Guilherme Tebaldi
501	message_sent	9	\N	20	113	Mensagem no chat do produto 113	{"content": "w", "productId": 113}	2025-11-25 13:56:25.158303	Guilherme Tebaldi
502	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764073960318}", "productId": 113}	2025-11-25 13:56:28.485765	Guilherme Tebaldi
503	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "w", "productId": 113}	2025-11-25 13:56:28.496076	Guilherme Tebaldi
504	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "w", "productId": 113}	2025-11-25 13:56:32.649193	Guilherme Tebaldi
505	message_sent	9	\N	20	113	Mensagem no chat do produto 113	{"content": "w", "productId": 113}	2025-11-25 13:56:35.221581	Guilherme Tebaldi
506	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764075443646}", "productId": 113}	2025-11-25 13:57:32.196447	Guilherme Tebaldi
507	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "w", "productId": 113}	2025-11-25 13:57:32.22719	Guilherme Tebaldi
508	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764075453494}", "productId": 113}	2025-11-25 13:57:37.724349	Guilherme Tebaldi
509	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "w", "productId": 113}	2025-11-25 13:57:37.834793	Guilherme Tebaldi
510	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "w", "productId": 113}	2025-11-25 13:58:02.58851	Guilherme Tebaldi
511	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "w", "productId": 113}	2025-11-25 13:58:04.243071	Guilherme Tebaldi
512	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dw"}	2025-11-25 13:58:29.510094	cristiane tebaldi
513	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764075515869}", "productId": 97}	2025-11-25 13:58:39.939867	Guilherme Tebaldi
514	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "wd", "productId": 97}	2025-11-25 13:58:39.966385	Guilherme Tebaldi
515	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dw"}	2025-11-25 13:58:47.585565	cristiane tebaldi
516	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dwdw"}	2025-11-25 13:58:54.437999	cristiane tebaldi
517	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "dw", "productId": 97}	2025-11-25 13:59:01.656387	Guilherme Tebaldi
518	message_sent	20	\N	9	103	Mensagem no chat do produto 103	{"content": "__saleday_product_context__:{\\"productId\\":103,\\"title\\":\\"3\\",\\"image\\":\\"\\",\\"price\\":\\"R$ 0,12\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764075553182}", "productId": 103}	2025-11-25 13:59:16.489612	Guilherme Tebaldi
519	message_sent	20	\N	9	103	Mensagem no chat do produto 103	{"content": "dwdw", "productId": 103}	2025-11-25 13:59:16.50275	Guilherme Tebaldi
520	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dw"}	2025-11-25 13:59:20.439799	cristiane tebaldi
521	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dwde"}	2025-11-25 13:59:33.489322	cristiane tebaldi
522	message_sent	20	\N	9	103	Mensagem no chat do produto 103	{"content": "dwdw", "productId": 103}	2025-11-25 13:59:38.411231	Guilherme Tebaldi
523	message_sent	20	\N	9	103	Mensagem no chat do produto 103	{"content": "w", "productId": 103}	2025-11-25 13:59:49.640545	Guilherme Tebaldi
524	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764075599026}", "productId": 97}	2025-11-25 14:00:01.760602	Guilherme Tebaldi
525	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "dw", "productId": 97}	2025-11-25 14:00:01.804373	Guilherme Tebaldi
526	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dwdw"}	2025-11-25 14:00:09.020075	cristiane tebaldi
527	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dwd"}	2025-11-25 14:00:29.690503	cristiane tebaldi
528	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "www"}	2025-11-25 14:00:45.449731	cristiane tebaldi
529	message_sent	9	\N	24	\N	Mensagem enviada via chat direto	{"content": "w"}	2025-11-25 14:01:07.650291	jose carmo
530	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-11-25 14:01:19.553874	cristiane tebaldi
531	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 14:01:22.293142	Guilherme Tebaldi
532	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "ww", "productId": 97}	2025-11-25 14:01:51.251591	Guilherme Tebaldi
533	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "frf"}	2025-11-25 14:02:52.492408	cristiane tebaldi
534	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764075778006}", "productId": 97}	2025-11-25 14:02:58.027118	Guilherme Tebaldi
535	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__OFFER__{\\"amount\\":2121,\\"currency\\":\\"BRL\\",\\"productId\\":97,\\"productTitle\\":\\"ww\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-25T13:02:58.006Z\\"}", "productId": 97}	2025-11-25 14:02:58.046134	Guilherme Tebaldi
536	message_sent	9	\N	20	97	Mensagem no chat do produto 97	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":737,\\"status\\":\\"declined\\",\\"offer\\":{\\"amount\\":2121,\\"currency\\":\\"BRL\\",\\"productId\\":97,\\"productTitle\\":\\"ww\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-25T13:02:58.006Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-11-25T13:03:15.789Z\\"}", "productId": 97}	2025-11-25 14:03:15.826336	Guilherme Tebaldi
537	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "rrgrv"}	2025-11-25 14:03:19.339027	cristiane tebaldi
538	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764075804975}", "productId": 113}	2025-11-25 14:03:29.285865	Guilherme Tebaldi
539	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "feufneu", "productId": 113}	2025-11-25 14:03:29.304318	Guilherme Tebaldi
540	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "rgrfr"}	2025-11-25 14:03:38.582866	cristiane tebaldi
541	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dwd", "productId": 113}	2025-11-25 14:04:57.957248	Guilherme Tebaldi
542	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "erfenfr"}	2025-11-25 14:05:13.195479	cristiane tebaldi
543	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "dwdw"}	2025-11-25 14:05:30.22936	Guilherme Tebaldi
544	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dwdw"}	2025-11-25 14:05:34.090722	cristiane tebaldi
545	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "ii"}	2025-11-25 14:06:08.393555	Guilherme Tebaldi
546	message_sent	20	\N	9	106	Mensagem no chat do produto 106	{"content": "__saleday_product_context__:{\\"productId\\":106,\\"title\\":\\"rer\\",\\"image\\":\\"\\",\\"price\\":\\"US$ 2.31\\",\\"location\\":\\"US\\",\\"timestamp\\":1764075973480}", "productId": 106}	2025-11-25 14:06:15.886674	Guilherme Tebaldi
547	message_sent	20	\N	9	106	Mensagem no chat do produto 106	{"content": "vfv", "productId": 106}	2025-11-25 14:06:15.906159	Guilherme Tebaldi
548	message_sent	20	\N	9	106	Mensagem no chat do produto 106	{"content": "vfvf", "productId": 106}	2025-11-25 14:06:19.684826	Guilherme Tebaldi
549	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "ee"}	2025-11-25 14:06:26.698344	cristiane tebaldi
550	message_sent	9	\N	23	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-11-25 14:14:35.220183	caroline borges
551	message_sent	23	\N	9	94	Mensagem no chat do produto 94	{"content": "ww", "productId": 94}	2025-11-25 14:15:13.09544	Guilherme Tebaldi
552	message_sent	9	\N	23	\N	Mensagem enviada via chat direto	{"content": "www"}	2025-11-25 14:15:25.441876	caroline borges
553	message_sent	23	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764076542121}", "productId": 113}	2025-11-25 14:15:43.953643	Guilherme Tebaldi
554	message_sent	23	\N	9	113	Mensagem no chat do produto 113	{"content": "ww", "productId": 113}	2025-11-25 14:15:43.981043	Guilherme Tebaldi
559	message_sent	20	\N	9	106	Mensagem no chat do produto 106	{"content": "ee", "productId": 106}	2025-11-25 14:17:23.623476	Guilherme Tebaldi
560	message_sent	20	\N	9	106	Mensagem no chat do produto 106	{"content": "ee", "productId": 106}	2025-11-25 14:18:13.350903	Guilherme Tebaldi
561	message_sent	20	\N	17	93	Mensagem no chat do produto 93	{"content": "ww", "productId": 93}	2025-11-25 14:28:29.079256	Evangelista Moraes Tebaldi
562	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764077321562}", "productId": 113}	2025-11-25 14:28:46.928709	Guilherme Tebaldi
563	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "e", "productId": 113}	2025-11-25 14:28:46.944107	Guilherme Tebaldi
564	message_sent	20	\N	24	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-11-25 14:29:16.177745	jose carmo
565	message_sent	24	\N	20	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-11-25 14:29:27.525098	cristiane tebaldi
566	message_sent	9	\N	23	\N	Mensagem enviada via chat direto	{"content": "w"}	2025-11-25 14:33:29.987754	caroline borges
567	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "w"}	2025-11-25 14:33:42.945742	cristiane tebaldi
568	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "w"}	2025-11-25 14:33:53.424348	cristiane tebaldi
569	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "w"}	2025-11-25 14:35:02.630718	cristiane tebaldi
570	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-11-25 14:35:22.840005	cristiane tebaldi
571	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-11-25 14:35:27.247238	cristiane tebaldi
572	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "11"}	2025-11-25 14:35:32.275809	cristiane tebaldi
573	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "efe"}	2025-11-25 14:36:26.083108	cristiane tebaldi
574	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "fefefef"}	2025-11-25 14:36:34.885798	Guilherme Tebaldi
575	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "ki"}	2025-11-25 14:37:38.614265	cristiane tebaldi
576	product_sold	9	Guilherme Tebaldi	20	97	Produto ww vendido para cristiane tebaldi	{"buyer_email": "cris@tebaldi.com", "confirmed_at": "2025-11-25T13:44:27.193Z"}	2025-11-25 14:44:27.19735	\N
577	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "__saleday_product_context__:{\\"productId\\":97,\\"title\\":\\"ww\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763567966291-701880731.jpeg\\",\\"price\\":\\"R$ 199,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764078298259}", "productId": 97}	2025-11-25 14:45:07.666986	Guilherme Tebaldi
578	message_sent	20	\N	9	97	Mensagem no chat do produto 97	{"content": "nossaaa valeu brow", "productId": 97}	2025-11-25 14:45:07.682808	Guilherme Tebaldi
579	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dededde"}	2025-11-25 14:45:17.023923	cristiane tebaldi
580	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "ededefef"}	2025-11-25 14:45:19.017143	cristiane tebaldi
581	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764078325018}", "productId": 113}	2025-11-25 14:45:28.43841	Guilherme Tebaldi
582	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "cs", "productId": 113}	2025-11-25 14:45:28.457544	Guilherme Tebaldi
583	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "123", "productId": 113}	2025-11-25 14:49:33.629451	Guilherme Tebaldi
584	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "rgrgrg", "productId": 113}	2025-11-25 14:50:44.81589	Guilherme Tebaldi
585	message_sent	9	\N	25	\N	Mensagem enviada via chat direto	{"content": "cec"}	2025-11-25 14:52:42.104348	mila califa
586	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "cece"}	2025-11-25 14:52:45.352086	cristiane tebaldi
587	message_sent	9	\N	24	\N	Mensagem enviada via chat direto	{"content": "cdc"}	2025-11-25 14:52:51.254172	jose carmo
588	message_sent	21	\N	20	112	Mensagem no chat do produto 112	{"content": "__saleday_product_context__:{\\"productId\\":112,\\"title\\":\\"computador\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763890281260-72755676.webp\\",\\"price\\":\\"R$ 1.500,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1764079144796}", "productId": 112}	2025-11-25 14:59:10.885543	cristiane tebaldi
589	message_sent	21	\N	20	112	Mensagem no chat do produto 112	{"content": "dwdwd", "productId": 112}	2025-11-25 14:59:10.903511	cristiane tebaldi
590	message_sent	21	\N	9	\N	Mensagem enviada via chat direto	{"content": "dwd"}	2025-11-25 14:59:20.778666	Guilherme Tebaldi
591	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "eceec"}	2025-11-25 15:42:22.121162	Guilherme Tebaldi
592	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "eifje", "productId": 113}	2025-11-25 15:43:31.586198	Guilherme Tebaldi
593	message_sent	20	\N	9	105	Mensagem no chat do produto 105	{"content": "__saleday_product_context__:{\\"productId\\":105,\\"title\\":\\"2\\",\\"image\\":\\"\\",\\"price\\":\\"R$ 2,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764081816800}", "productId": 105}	2025-11-25 15:43:39.26544	Guilherme Tebaldi
594	message_sent	20	\N	9	105	Mensagem no chat do produto 105	{"content": "def", "productId": 105}	2025-11-25 15:43:39.273215	Guilherme Tebaldi
595	message_sent	20	\N	9	103	Mensagem no chat do produto 103	{"content": "__saleday_product_context__:{\\"productId\\":103,\\"title\\":\\"3\\",\\"image\\":\\"\\",\\"price\\":\\"R$ 0,12\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764081827119}", "productId": 103}	2025-11-25 15:43:48.985421	Guilherme Tebaldi
596	message_sent	20	\N	9	103	Mensagem no chat do produto 103	{"content": "dede", "productId": 103}	2025-11-25 15:43:48.995538	Guilherme Tebaldi
597	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764081978534}", "productId": 113}	2025-11-25 15:46:20.87293	Guilherme Tebaldi
598	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "cdcde", "productId": 113}	2025-11-25 15:46:20.879359	Guilherme Tebaldi
599	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "ww", "productId": 113}	2025-11-25 15:46:46.212468	Guilherme Tebaldi
600	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-11-25 15:47:03.391975	cristiane tebaldi
601	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "ww", "productId": 113}	2025-11-25 15:47:13.055914	Guilherme Tebaldi
602	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "vrvr", "productId": 113}	2025-11-25 15:47:59.180342	Guilherme Tebaldi
603	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "ee", "productId": 113}	2025-11-25 15:55:01.411254	Guilherme Tebaldi
604	message_sent	20	\N	9	104	Mensagem no chat do produto 104	{"content": "__saleday_product_context__:{\\"productId\\":104,\\"title\\":\\"not\\",\\"image\\":\\"\\",\\"price\\":\\"R$ 0,12\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764082510409}", "productId": 104}	2025-11-25 15:55:12.672358	Guilherme Tebaldi
605	message_sent	20	\N	9	104	Mensagem no chat do produto 104	{"content": "ee", "productId": 104}	2025-11-25 15:55:12.699791	Guilherme Tebaldi
606	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "ee"}	2025-11-25 15:55:19.528031	cristiane tebaldi
607	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "ee"}	2025-11-25 15:55:22.180715	cristiane tebaldi
608	message_sent	20	\N	9	104	Mensagem no chat do produto 104	{"content": "ee", "productId": 104}	2025-11-25 15:55:29.647339	Guilherme Tebaldi
609	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "__saleday_product_context__:{\\"productId\\":113,\\"title\\":\\"Alface\\",\\"image\\":\\"http://localhost:5000/uploads/products/1763900205760-186415735.jpeg\\",\\"price\\":\\"R$ 12,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764084655534}", "productId": 113}	2025-11-25 16:30:58.829647	Guilherme Tebaldi
610	message_sent	20	\N	9	113	Mensagem no chat do produto 113	{"content": "dfgbnm,", "productId": 113}	2025-11-25 16:30:58.83693	Guilherme Tebaldi
611	product_sold	9	Guilherme Tebaldi	20	113	Produto Alface vendido para cristiane tebaldi	{"buyer_email": "cris@tebaldi.com", "confirmed_at": "2025-11-30T09:52:31.571Z"}	2025-11-30 10:52:31.578228	\N
612	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "ghjkl;"}	2025-11-30 10:52:43.591434	cristiane tebaldi
613	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "sim"}	2025-11-30 10:53:44.571813	Guilherme Tebaldi
614	product_sold	9	Guilherme Tebaldi	20	103	Produto 3 vendido para cristiane tebaldi	{"buyer_email": "cris@tebaldi.com", "confirmed_at": "2025-11-30T10:22:11.637Z"}	2025-11-30 11:22:11.64406	\N
615	message_sent	20	\N	9	103	Mensagem no chat do produto 103	{"content": "__saleday_product_context__:{\\"productId\\":103,\\"title\\":\\"3\\",\\"image\\":\\"\\",\\"price\\":\\"R$ 0,12\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764498159728}", "productId": 103}	2025-11-30 11:22:42.989167	Guilherme Tebaldi
616	message_sent	20	\N	9	103	Mensagem no chat do produto 103	{"content": "efef", "productId": 103}	2025-11-30 11:22:42.996254	Guilherme Tebaldi
617	message_sent	20	\N	9	104	Mensagem no chat do produto 104	{"content": "__saleday_product_context__:{\\"productId\\":104,\\"title\\":\\"not\\",\\"image\\":\\"\\",\\"price\\":\\"R$ 0,12\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764500304400}", "productId": 104}	2025-11-30 11:58:24.413888	Guilherme Tebaldi
618	message_sent	20	\N	9	104	Mensagem no chat do produto 104	{"content": "__OFFER__{\\"amount\\":10,\\"currency\\":\\"BRL\\",\\"productId\\":104,\\"productTitle\\":\\"not\\",\\"productImage\\":null,\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":\\"SERIA LEGAL ME VENDER ASSIM\\",\\"createdAt\\":\\"2025-11-30T10:58:24.399Z\\"}", "productId": 104}	2025-11-30 11:58:24.458993	Guilherme Tebaldi
619	message_sent	9	\N	20	104	Mensagem no chat do produto 104	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":817,\\"status\\":\\"accepted\\",\\"offer\\":{\\"amount\\":10,\\"currency\\":\\"BRL\\",\\"productId\\":104,\\"productTitle\\":\\"not\\",\\"productImage\\":null,\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":\\"SERIA LEGAL ME VENDER ASSIM\\",\\"createdAt\\":\\"2025-11-30T10:58:24.399Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-11-30T10:59:14.570Z\\"}", "productId": 104}	2025-11-30 11:59:14.578571	Guilherme Tebaldi
620	message_sent	20	\N	9	104	Mensagem no chat do produto 104	{"content": "VALEI", "productId": 104}	2025-11-30 11:59:27.859092	Guilherme Tebaldi
621	message_sent	20	\N	9	108	Mensagem no chat do produto 108	{"content": "__saleday_product_context__:{\\"productId\\":108,\\"title\\":\\"ef\\",\\"image\\":\\"\\",\\"price\\":\\"R$ 1.900,33\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764500668512}", "productId": 108}	2025-11-30 12:04:28.528644	Guilherme Tebaldi
622	message_sent	20	\N	9	108	Mensagem no chat do produto 108	{"content": "__OFFER__{\\"amount\\":1.02,\\"currency\\":\\"BRL\\",\\"productId\\":108,\\"productTitle\\":\\"ef\\",\\"productImage\\":null,\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-30T11:04:28.512Z\\"}", "productId": 108}	2025-11-30 12:04:28.537683	Guilherme Tebaldi
623	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "sai fora"}	2025-11-30 12:14:25.641364	cristiane tebaldi
624	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dw"}	2025-11-30 12:15:01.822488	cristiane tebaldi
625	message_sent	20	\N	9	105	Mensagem no chat do produto 105	{"content": "__saleday_product_context__:{\\"productId\\":105,\\"title\\":\\"2\\",\\"image\\":\\"\\",\\"price\\":\\"R$ 2,22\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764501424078}", "productId": 105}	2025-11-30 12:17:04.107285	Guilherme Tebaldi
626	message_sent	20	\N	9	105	Mensagem no chat do produto 105	{"content": "__OFFER__{\\"amount\\":1.01,\\"currency\\":\\"BRL\\",\\"productId\\":105,\\"productTitle\\":\\"2\\",\\"productImage\\":null,\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-30T11:17:04.078Z\\"}", "productId": 105}	2025-11-30 12:17:04.118569	Guilherme Tebaldi
627	product_sold	9	Guilherme Tebaldi	20	105	Produto 2 vendido para cristiane tebaldi	{"buyer_email": "cris@tebaldi.com", "confirmed_at": "2025-11-30T11:17:24.001Z"}	2025-11-30 12:17:24.006625	\N
628	message_sent	9	\N	20	105	Mensagem no chat do produto 105	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":825,\\"status\\":\\"accepted\\",\\"offer\\":{\\"amount\\":1.01,\\"currency\\":\\"BRL\\",\\"productId\\":105,\\"productTitle\\":\\"2\\",\\"productImage\\":null,\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":null,\\"createdAt\\":\\"2025-11-30T11:17:04.078Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-11-30T11:17:23.973Z\\"}", "productId": 105}	2025-11-30 12:17:24.007953	Guilherme Tebaldi
629	message_sent	20	\N	9	105	Mensagem no chat do produto 105	{"content": "legas", "productId": 105}	2025-11-30 12:17:49.025981	Guilherme Tebaldi
630	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "nda"}	2025-11-30 12:18:22.856959	cristiane tebaldi
631	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "lega"}	2025-11-30 12:19:23.042135	Guilherme Tebaldi
632	message_sent	9	\N	20	116	Mensagem no chat do produto 116	{"content": "Ainda está disponível?", "productId": 116}	2025-11-30 12:25:02.410024	cristiane tebaldi
633	message_sent	9	\N	20	116	Mensagem no chat do produto 116	{"content": "__saleday_product_context__:{\\"productId\\":116,\\"title\\":\\"coisa boa\\",\\"image\\":\\"http://localhost:5000/uploads/products/1764501848028-657891328.png\\",\\"price\\":\\"R$ 100,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1764596851228}", "productId": 116}	2025-12-01 14:47:39.909756	cristiane tebaldi
634	message_sent	9	\N	20	116	Mensagem no chat do produto 116	{"content": "w", "productId": 116}	2025-12-01 14:47:39.942599	cristiane tebaldi
635	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-12-01 19:20:10.033221	Guilherme Tebaldi
636	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "deww"}	2025-12-01 19:20:27.111102	Guilherme Tebaldi
637	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "gcvv"}	2025-12-01 19:43:28.573715	Guilherme Tebaldi
638	message_sent	20	\N	9	108	Mensagem no chat do produto 108	{"content": "__saleday_product_context__:{\\"productId\\":108,\\"title\\":\\"pneu\\",\\"image\\":\\"http://localhost:5000/uploads/products/1764695945542-235029362.jpeg\\",\\"price\\":\\"R$ 1.900,33\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764708122148}", "productId": 108}	2025-12-02 21:42:08.360592	Guilherme Tebaldi
639	message_sent	20	\N	9	108	Mensagem no chat do produto 108	{"content": "wdwdwd", "productId": 108}	2025-12-02 21:42:08.366972	Guilherme Tebaldi
640	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dwdwd"}	2025-12-02 21:42:30.439215	cristiane tebaldi
641	product_sold	20	cristiane tebaldi	9	116	Produto produto de limpeza vendido para Guilherme Tebaldi	{"buyer_email": "tebaldiguilherme.roma@gmail.com", "confirmed_at": "2025-12-03T15:28:44.810Z"}	2025-12-03 16:28:44.817185	\N
642	message_sent	20	\N	9	108	Mensagem no chat do produto 108	{"content": "__saleday_product_context__:{\\"productId\\":108,\\"title\\":\\"pneu\\",\\"image\\":\\"http://localhost:5000/uploads/products/1764695945542-235029362.jpeg\\",\\"price\\":\\"R$ 1.900,33\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764797613362}", "productId": 108}	2025-12-03 22:33:33.387047	Guilherme Tebaldi
643	message_sent	20	\N	9	108	Mensagem no chat do produto 108	{"content": "__OFFER__{\\"amount\\":1.02,\\"currency\\":\\"BRL\\",\\"productId\\":108,\\"productTitle\\":\\"pneu\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1764695945542-235029362.jpeg\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":\\"jdbwejdw\\",\\"createdAt\\":\\"2025-12-03T21:33:33.362Z\\"}", "productId": 108}	2025-12-03 22:33:33.397176	Guilherme Tebaldi
644	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "ifenifnei"}	2025-12-03 22:33:44.432946	cristiane tebaldi
645	product_sold	9	Guilherme Tebaldi	20	108	Produto pneu vendido para cristiane tebaldi	{"buyer_email": "cris@tebaldi.com", "confirmed_at": "2025-12-03T21:34:10.086Z"}	2025-12-03 22:34:10.089314	\N
646	message_sent	9	\N	20	108	Mensagem no chat do produto 108	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":840,\\"status\\":\\"accepted\\",\\"offer\\":{\\"amount\\":1.02,\\"currency\\":\\"BRL\\",\\"productId\\":108,\\"productTitle\\":\\"pneu\\",\\"productImage\\":\\"http://localhost:5000/uploads/products/1764695945542-235029362.jpeg\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":\\"jdbwejdw\\",\\"createdAt\\":\\"2025-12-03T21:33:33.362Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-12-03T21:34:10.064Z\\"}", "productId": 108}	2025-12-03 22:34:10.091742	Guilherme Tebaldi
647	message_sent	20	\N	9	108	Mensagem no chat do produto 108	{"content": "ini", "productId": 108}	2025-12-03 22:34:21.076752	Guilherme Tebaldi
648	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "Legal"}	2025-12-04 20:05:23.505586	cristiane tebaldi
651	message_sent	9	\N	20	117	Mensagem no chat do produto 117	{"content": "__saleday_product_context__:{\\"productId\\":117,\\"title\\":\\"not teste\\",\\"image\\":\\"http://localhost:5000/uploads/products/1764614736068-964704862.webp\\",\\"price\\":\\"R$ 100,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1764960165939}", "productId": 117}	2025-12-05 18:43:39.693625	cristiane tebaldi
652	message_sent	9	\N	20	117	Mensagem no chat do produto 117	{"content": "Legal esse produto", "productId": 117}	2025-12-05 18:43:40.095221	cristiane tebaldi
655	message_sent	9	\N	20	117	Mensagem no chat do produto 117	{"content": "Oi", "productId": 117}	2025-12-06 16:10:08.024781	cristiane tebaldi
656	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "duiby"}	2025-12-06 16:10:26.111013	Guilherme Tebaldi
657	message_sent	9	\N	20	117	Mensagem no chat do produto 117	{"content": "Man", "productId": 117}	2025-12-06 16:10:38.307579	cristiane tebaldi
661	message_sent	20	\N	26	\N	Mensagem enviada via chat direto	{"content": "ijim"}	2025-12-06 16:13:10.775597	Saleday
664	message_sent	20	\N	26	\N	Mensagem enviada via chat direto	{"content": "ubu]"}	2025-12-06 16:15:04.936838	Saleday
669	message_sent	20	\N	26	\N	Mensagem enviada via chat direto	{"content": "dwdw"}	2025-12-08 13:59:39.379483	Saleday
672	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Oi"}	2025-12-08 14:17:25.297744	Cristiane
673	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Hi"}	2025-12-08 14:17:36.170232	Guilherme Tebaldi
677	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Hoje vou resolver isso !"}	2025-12-09 08:47:39.583769	Cristiane
682	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Meu amorzinho"}	2025-12-09 08:49:04.215741	Guilherme Tebaldi
692	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Sumiu a foto que eu coloquei"}	2025-12-09 08:50:39.319628	Guilherme Tebaldi
695	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Isso acontece só quando eu subo algo para o backend"}	2025-12-09 08:51:13.470774	Cristiane
699	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "E ontem pelo Google"}	2025-12-09 08:52:36.232034	Guilherme Tebaldi
700	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Sim apareceu pra mim mais ainda quando eu subir algo perde"}	2025-12-09 08:52:41.052888	Cristiane
701	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "O restante ficou salvo"}	2025-12-09 08:52:50.110957	Guilherme Tebaldi
702	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "É só as fotos"}	2025-12-09 08:53:05.646573	Cristiane
705	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Além disso as nossas conversas aqui estão muito misturadas vou ter que diferenciar melhor"}	2025-12-09 08:53:52.445997	Cristiane
649	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "Ou"}	2025-12-04 20:34:05.150315	cristiane tebaldi
653	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "Te amo"}	2025-12-05 18:44:23.201948	cristiane tebaldi
658	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "jij]"}	2025-12-06 16:10:49.207093	Guilherme Tebaldi
662	message_sent	20	\N	26	\N	Mensagem enviada via chat direto	{"content": "o,mp"}	2025-12-06 16:13:22.001235	Saleday
666	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "jn"}	2025-12-06 16:16:31.800916	Guilherme Tebaldi
670	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "É solteira ?"}	2025-12-08 14:16:58.938026	Cristiane
674	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Te amo"}	2025-12-09 08:46:24.142065	Cristiane
675	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Tenho saudade amor"}	2025-12-09 08:46:54.799775	Cristiane
678	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Gostosa ! 🥰"}	2025-12-09 08:48:04.22078	Cristiane
679	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Sou apaixonado por você!"}	2025-12-09 08:48:14.160295	Cristiane
680	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Mulher da minha vida"}	2025-12-09 08:48:24.703671	Cristiane
687	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Como eu te amo"}	2025-12-09 08:49:49.06634	Cristiane
690	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Te amo 💕"}	2025-12-09 08:50:06.101118	Cristiane
693	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Tem que ver isso"}	2025-12-09 08:50:46.829477	Guilherme Tebaldi
696	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Agora eu coloquei"}	2025-12-09 08:52:10.133584	Guilherme Tebaldi
703	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "As foto se perde mais já estou resolvendo isso hoje ainda"}	2025-12-09 08:53:24.106943	Cristiane
706	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "E hoje vai fazer só as fábricas"}	2025-12-09 08:53:53.845996	Guilherme Tebaldi
708	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Pena que não dá para marcar a mensagem né"}	2025-12-09 08:54:19.179997	Guilherme Tebaldi
709	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Igual do WhatsApp"}	2025-12-09 08:54:26.742496	Guilherme Tebaldi
710	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Esse lugar é imundo"}	2025-12-09 08:54:26.969467	Cristiane
711	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Tem pano ?"}	2025-12-09 08:54:38.022247	Guilherme Tebaldi
712	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Da pra fazer é só criar !"}	2025-12-09 08:54:43.986463	Cristiane
714	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "A Jurema veio aqui"}	2025-12-09 08:55:42.454294	Guilherme Tebaldi
715	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Bom tenho que ver esse negócio das fotos sumirem quando eu atualizo o banco de dados"}	2025-12-09 08:55:46.695024	Cristiane
716	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Que bom amor tranca ela dentro de casa"}	2025-12-09 08:55:58.155157	Cristiane
717	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Sim vou trancar a gordinha"}	2025-12-09 08:56:26.71471	Guilherme Tebaldi
721	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Sim já tranqui a porta"}	2025-12-09 08:56:54.311824	Guilherme Tebaldi
723	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Mete ração como a mãe mete comida no César"}	2025-12-09 08:57:07.101187	Cristiane
726	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Te amo"}	2025-12-09 08:58:05.602918	Cristiane
729	message_sent	9	\N	26	119	Mensagem no chat do produto 119	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":924,\\"status\\":\\"declined\\",\\"offer\\":{\\"amount\\":9,\\"currency\\":\\"EUR\\",\\"productId\\":119,\\"productTitle\\":\\"Musicassetta\\",\\"productImage\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"senderName\\":\\"Saleday\\",\\"message\\":\\"Per favore\\",\\"createdAt\\":\\"2025-12-09T09:40:00.001Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-12-09T09:40:17.830Z\\"}", "productId": 119}	2025-12-09 09:40:18.19955	Guilherme Tebaldi
731	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "__saleday_product_context__:{\\"productId\\":119,\\"title\\":\\"Musicassetta\\",\\"image\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"price\\":\\"10,00 €\\",\\"location\\":\\"Ardea, LAZIO, IT\\",\\"timestamp\\":1765273250450}", "productId": 119}	2025-12-09 09:40:50.839328	Guilherme Tebaldi
732	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "__OFFER__{\\"amount\\":9.8,\\"currency\\":\\"EUR\\",\\"productId\\":119,\\"productTitle\\":\\"Musicassetta\\",\\"productImage\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"senderName\\":\\"Saleday\\",\\"message\\":\\"Agora vai\\",\\"createdAt\\":\\"2025-12-09T09:40:50.449Z\\"}", "productId": 119}	2025-12-09 09:40:51.237881	Guilherme Tebaldi
733	message_sent	9	\N	26	119	Mensagem no chat do produto 119	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":928,\\"status\\":\\"declined\\",\\"offer\\":{\\"amount\\":9.8,\\"currency\\":\\"EUR\\",\\"productId\\":119,\\"productTitle\\":\\"Musicassetta\\",\\"productImage\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"senderName\\":\\"Saleday\\",\\"message\\":\\"Agora vai\\",\\"createdAt\\":\\"2025-12-09T09:40:50.449Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-12-09T09:41:03.223Z\\"}", "productId": 119}	2025-12-09 09:41:03.548715	Guilherme Tebaldi
736	product_sold	9	Guilherme Tebaldi	26	148	Produto Baralho vendido para Saleday	{"buyer_email": "saledayword@gmail.com", "confirmed_at": "2025-12-09T09:44:57.985Z"}	2025-12-09 09:44:58.097623	\N
737	message_sent	9	\N	26	148	Mensagem no chat do produto 148	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":931,\\"status\\":\\"accepted\\",\\"offer\\":{\\"amount\\":1,\\"currency\\":\\"EUR\\",\\"productId\\":148,\\"productTitle\\":\\"Baralho\\",\\"productImage\\":\\"http://saleday-backend.onrender.com/uploads/products/1765273439148-57037977.jpeg\\",\\"senderName\\":\\"Saleday\\",\\"message\\":\\"Vai\\",\\"createdAt\\":\\"2025-12-09T09:44:45.241Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-12-09T09:44:57.558Z\\"}", "productId": 148}	2025-12-09 09:44:58.163862	Guilherme Tebaldi
739	message_sent	9	\N	26	\N	Mensagem enviada via chat direto	{"content": "Tito a posto"}	2025-12-09 09:47:31.270542	Saleday
747	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "Ok", "productId": 119}	2025-12-09 15:24:13.500914	Guilherme Tebaldi
650	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "Te amo"}	2025-12-05 18:42:08.097887	cristiane tebaldi
654	message_sent	9	\N	20	117	Mensagem no chat do produto 117	{"content": "ygyvygb", "productId": 117}	2025-12-06 13:17:25.978889	cristiane tebaldi
659	message_sent	26	\N	20	117	Mensagem no chat do produto 117	{"content": "__saleday_product_context__:{\\"productId\\":117,\\"title\\":\\"not teste\\",\\"image\\":\\"http://localhost:5000/uploads/products/1764614736068-964704862.webp\\",\\"price\\":\\"R$ 100,00\\",\\"location\\":\\"BR\\",\\"timestamp\\":1765037572158}", "productId": 117}	2025-12-06 16:12:57.178753	cristiane tebaldi
660	message_sent	26	\N	20	117	Mensagem no chat do produto 117	{"content": "Quanto essa poha", "productId": 117}	2025-12-06 16:12:57.528543	cristiane tebaldi
663	message_sent	20	\N	26	\N	Mensagem enviada via chat direto	{"content": "ygygg"}	2025-12-06 16:13:45.917732	Saleday
665	message_sent	20	\N	26	\N	Mensagem enviada via chat direto	{"content": "ubn"}	2025-12-06 16:15:15.785886	Saleday
667	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "__saleday_product_context__:{\\"productId\\":119,\\"title\\":\\"Musicassetta\\",\\"image\\":\\"http://saleday-backend.onrender.com/uploads/products/1765197272309-903832100.jpeg\\",\\"price\\":\\"10,00 €\\",\\"location\\":\\"Ardea, LAZIO, IT\\",\\"timestamp\\":1765201052231}", "productId": 119}	2025-12-08 13:37:40.257427	Guilherme Tebaldi
668	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "Lindo legal", "productId": 119}	2025-12-08 13:37:40.711238	Guilherme Tebaldi
671	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Oi"}	2025-12-08 14:17:19.944402	Cristiane
676	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "A minha atualização de ontem fez você perder foto"}	2025-12-09 08:47:23.18363	Cristiane
681	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Te amo vidinha"}	2025-12-09 08:48:57.553744	Guilherme Tebaldi
683	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Que sdd de vc amor"}	2025-12-09 08:49:04.533192	Cristiane
684	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Não quero mais esse trabalho"}	2025-12-09 08:49:19.095312	Cristiane
685	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Venha pra casa então vidinha"}	2025-12-09 08:49:22.901749	Guilherme Tebaldi
686	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "❤️"}	2025-12-09 08:49:40.429648	Cristiane
688	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Eu sei meu amor, logo Deus vai te abençoar e lhe dar um trabalho digno seu"}	2025-12-09 08:49:54.540669	Guilherme Tebaldi
689	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Minha rainha"}	2025-12-09 08:49:55.010956	Cristiane
691	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Hein eu coloquei foto e hoje não tá ?"}	2025-12-09 08:50:13.24316	Guilherme Tebaldi
694	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Sim quando vc colocai eu testei se ia perder as foto de novo e mais uma vez perdemos as foto"}	2025-12-09 08:50:49.189078	Cristiane
697	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Hoje vou resolver! Tive que criar um disco rígido dentro do Render agora basta testar novamente! Ainda não funcionou"}	2025-12-09 08:52:14.968115	Cristiane
698	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Eu entrei pelo Safari"}	2025-12-09 08:52:21.981594	Guilherme Tebaldi
704	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Vai dar certo amor, em nome do senhor ele vai te abençoar ❤️"}	2025-12-09 08:53:36.245178	Guilherme Tebaldi
707	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Não sei paixão"}	2025-12-09 08:54:12.341846	Cristiane
713	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Sim uns veio"}	2025-12-09 08:54:50.385569	Cristiane
718	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Amor fecha a casa ! Sempre !"}	2025-12-09 08:56:32.996154	Cristiane
719	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Vou trabalhar agora !"}	2025-12-09 08:56:42.667018	Cristiane
720	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Não tem nada pra ela comer só ração"}	2025-12-09 08:56:44.342001	Guilherme Tebaldi
722	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Ta bem vida Deus te abençoe"}	2025-12-09 08:57:02.764936	Guilherme Tebaldi
724	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Sabia que essas conversa que nós estamos aqui elas não são rastreáveis porque a única pessoa que rastreia ela sou eu mesmo no administrativo"}	2025-12-09 08:57:24.148191	Cristiane
725	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Por isso muitos pessoas que fazem golpe elas criam seu próprio WhatsApp se IRRASTREÁVEL"}	2025-12-09 08:57:39.905968	Cristiane
727	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "__saleday_product_context__:{\\"productId\\":119,\\"title\\":\\"Musicassetta\\",\\"image\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"price\\":\\"10,00 €\\",\\"location\\":\\"Ardea, LAZIO, IT\\",\\"timestamp\\":1765273200003}", "productId": 119}	2025-12-09 09:40:00.353984	Guilherme Tebaldi
728	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "__OFFER__{\\"amount\\":9,\\"currency\\":\\"EUR\\",\\"productId\\":119,\\"productTitle\\":\\"Musicassetta\\",\\"productImage\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"senderName\\":\\"Saleday\\",\\"message\\":\\"Per favore\\",\\"createdAt\\":\\"2025-12-09T09:40:00.001Z\\"}", "productId": 119}	2025-12-09 09:40:00.874015	Guilherme Tebaldi
730	message_sent	9	\N	26	\N	Mensagem enviada via chat direto	{"content": "Não posso faz por 9.80"}	2025-12-09 09:40:30.126	Saleday
734	message_sent	26	\N	9	148	Mensagem no chat do produto 148	{"content": "__saleday_product_context__:{\\"productId\\":148,\\"title\\":\\"Baralho\\",\\"image\\":\\"http://saleday-backend.onrender.com/uploads/products/1765273439148-57037977.jpeg\\",\\"price\\":\\"0,50 €\\",\\"location\\":\\"Aprilia, LAZIO, IT\\",\\"timestamp\\":1765273485243}", "productId": 148}	2025-12-09 09:44:45.610878	Guilherme Tebaldi
735	message_sent	26	\N	9	148	Mensagem no chat do produto 148	{"content": "__OFFER__{\\"amount\\":1,\\"currency\\":\\"EUR\\",\\"productId\\":148,\\"productTitle\\":\\"Baralho\\",\\"productImage\\":\\"http://saleday-backend.onrender.com/uploads/products/1765273439148-57037977.jpeg\\",\\"senderName\\":\\"Saleday\\",\\"message\\":\\"Vai\\",\\"createdAt\\":\\"2025-12-09T09:44:45.241Z\\"}", "productId": 148}	2025-12-09 09:44:46.081108	Guilherme Tebaldi
738	message_sent	26	\N	9	148	Mensagem no chat do produto 148	{"content": "Valeu", "productId": 148}	2025-12-09 09:46:53.360695	Guilherme Tebaldi
740	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "__saleday_product_context__:{\\"productId\\":119,\\"title\\":\\"Musicassetta\\",\\"image\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"price\\":\\"10,00 €\\",\\"location\\":\\"Ardea, LAZIO, IT\\",\\"timestamp\\":1765279669267}", "productId": 119}	2025-12-09 11:27:49.681001	Guilherme Tebaldi
741	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "__OFFER__{\\"amount\\":1,\\"currency\\":\\"EUR\\",\\"productId\\":119,\\"productTitle\\":\\"Musicassetta\\",\\"productImage\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"senderName\\":\\"Saleday\\",\\"message\\":null,\\"createdAt\\":\\"2025-12-09T11:27:49.266Z\\"}", "productId": 119}	2025-12-09 11:27:50.16995	Guilherme Tebaldi
742	message_sent	9	\N	26	119	Mensagem no chat do produto 119	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":936,\\"status\\":\\"declined\\",\\"offer\\":{\\"amount\\":1,\\"currency\\":\\"EUR\\",\\"productId\\":119,\\"productTitle\\":\\"Musicassetta\\",\\"productImage\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"senderName\\":\\"Saleday\\",\\"message\\":null,\\"createdAt\\":\\"2025-12-09T11:27:49.266Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-12-09T11:28:14.846Z\\"}", "productId": 119}	2025-12-09 11:28:15.283226	Guilherme Tebaldi
743	message_sent	9	\N	26	\N	Mensagem enviada via chat direto	{"content": "Não dá"}	2025-12-09 11:29:06.427494	Saleday
744	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "__saleday_product_context__:{\\"productId\\":119,\\"title\\":\\"Musicassetta\\",\\"image\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"price\\":\\"10,00 €\\",\\"location\\":\\"Ardea, LAZIO, IT\\",\\"timestamp\\":1765287263422}", "productId": 119}	2025-12-09 13:34:23.763838	Guilherme Tebaldi
745	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "__OFFER__{\\"amount\\":1,\\"currency\\":\\"EUR\\",\\"productId\\":119,\\"productTitle\\":\\"Musicassetta\\",\\"productImage\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"senderName\\":\\"Saleday\\",\\"message\\":null,\\"createdAt\\":\\"2025-12-09T13:34:23.418Z\\"}", "productId": 119}	2025-12-09 13:34:24.149241	Guilherme Tebaldi
746	message_sent	9	\N	26	119	Mensagem no chat do produto 119	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":940,\\"status\\":\\"declined\\",\\"offer\\":{\\"amount\\":1,\\"currency\\":\\"EUR\\",\\"productId\\":119,\\"productTitle\\":\\"Musicassetta\\",\\"productImage\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"senderName\\":\\"Saleday\\",\\"message\\":null,\\"createdAt\\":\\"2025-12-09T13:34:23.418Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-12-09T13:34:34.199Z\\"}", "productId": 119}	2025-12-09 13:34:34.577409	Guilherme Tebaldi
748	message_sent	9	\N	26	\N	Mensagem enviada via chat direto	{"content": "eunefunfeufneufneufnefe"}	2025-12-09 15:27:58.015129	Saleday
749	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "Ifificficicicicicifidudisjdidjdjxjxjxuxuxuxuxududjdjxjxjxjxjxj", "productId": 119}	2025-12-09 15:28:12.376508	Guilherme Tebaldi
750	message_sent	9	\N	26	\N	Mensagem enviada via chat direto	{"content": "kmk"}	2025-12-09 15:38:37.954095	Saleday
751	message_sent	9	\N	26	\N	Mensagem enviada via chat direto	{"content": "nnun"}	2025-12-09 15:41:01.357488	Saleday
752	message_sent	9	\N	26	\N	Mensagem enviada via chat direto	{"content": "ghjk"}	2025-12-09 15:44:45.123911	Saleday
753	message_sent	26	\N	9	\N	Mensagem enviada via chat direto	{"content": "Ggg"}	2025-12-09 15:45:13.925923	Guilherme Tebaldi
754	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "__saleday_product_context__:{\\"productId\\":119,\\"title\\":\\"Musicassetta\\",\\"image\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"price\\":\\"10,00 €\\",\\"location\\":\\"Ardea, LAZIO, IT\\",\\"timestamp\\":1765295149522}", "productId": 119}	2025-12-09 15:45:49.795299	Guilherme Tebaldi
755	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "__OFFER__{\\"amount\\":10,\\"currency\\":\\"EUR\\",\\"productId\\":119,\\"productTitle\\":\\"Musicassetta\\",\\"productImage\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"senderName\\":\\"Saleday\\",\\"message\\":null,\\"createdAt\\":\\"2025-12-09T15:45:49.522Z\\"}", "productId": 119}	2025-12-09 15:45:50.162916	Guilherme Tebaldi
756	message_sent	9	\N	26	119	Mensagem no chat do produto 119	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":950,\\"status\\":\\"declined\\",\\"offer\\":{\\"amount\\":10,\\"currency\\":\\"EUR\\",\\"productId\\":119,\\"productTitle\\":\\"Musicassetta\\",\\"productImage\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"senderName\\":\\"Saleday\\",\\"message\\":null,\\"createdAt\\":\\"2025-12-09T15:45:49.522Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-12-09T15:46:01.535Z\\"}", "productId": 119}	2025-12-09 15:46:02.089967	Guilherme Tebaldi
757	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "Bingo", "productId": 119}	2025-12-09 15:49:12.03507	Guilherme Tebaldi
758	message_sent	9	\N	26	\N	Mensagem enviada via chat direto	{"content": "dwdwd"}	2025-12-09 18:39:34.539092	Saleday
759	message_sent	9	\N	26	\N	Mensagem enviada via chat direto	{"content": "wddw"}	2025-12-09 18:44:03.653486	Saleday
760	message_sent	20	\N	9	119	Mensagem no chat do produto 119	{"content": "__saleday_product_context__:{\\"productId\\":119,\\"title\\":\\"Musicassetta\\",\\"image\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"price\\":\\"10,00 €\\",\\"location\\":\\"Ardea, LAZIO, IT\\",\\"timestamp\\":1765305953446}", "productId": 119}	2025-12-09 18:45:56.51844	Guilherme Tebaldi
761	message_sent	20	\N	9	119	Mensagem no chat do produto 119	{"content": "ddd", "productId": 119}	2025-12-09 18:45:56.843541	Guilherme Tebaldi
762	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dertgyhujk"}	2025-12-09 18:46:08.527098	cristiane tebaldi
763	message_sent	20	\N	9	119	Mensagem no chat do produto 119	{"content": "__saleday_product_context__:{\\"productId\\":119,\\"title\\":\\"Musicassetta\\",\\"image\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"price\\":\\"10,00 €\\",\\"location\\":\\"Ardea, LAZIO, IT\\",\\"timestamp\\":1765306005283}", "productId": 119}	2025-12-09 18:46:45.938989	Guilherme Tebaldi
764	message_sent	20	\N	9	119	Mensagem no chat do produto 119	{"content": "__OFFER__{\\"amount\\":9,\\"currency\\":\\"EUR\\",\\"productId\\":119,\\"productTitle\\":\\"Musicassetta\\",\\"productImage\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":\\"wdwddw\\",\\"createdAt\\":\\"2025-12-09T18:46:45.283Z\\"}", "productId": 119}	2025-12-09 18:46:46.291915	Guilherme Tebaldi
765	message_sent	9	\N	20	119	Mensagem no chat do produto 119	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":959,\\"status\\":\\"declined\\",\\"offer\\":{\\"amount\\":9,\\"currency\\":\\"EUR\\",\\"productId\\":119,\\"productTitle\\":\\"Musicassetta\\",\\"productImage\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"senderName\\":\\"cristiane tebaldi\\",\\"message\\":\\"wdwddw\\",\\"createdAt\\":\\"2025-12-09T18:46:45.283Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-12-09T18:46:56.877Z\\"}", "productId": 119}	2025-12-09 18:46:57.529413	Guilherme Tebaldi
766	message_sent	26	\N	9	\N	Mensagem enviada via chat direto	{"content": "Jsieeb"}	2025-12-09 18:57:30.672795	Guilherme Tebaldi
767	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-12-09 19:07:17.072929	cristiane tebaldi
768	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "dvd"}	2025-12-09 19:37:23.584214	cristiane tebaldi
769	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "scs"}	2025-12-09 19:37:28.152688	cristiane tebaldi
770	message_sent	9	\N	26	\N	Mensagem enviada via chat direto	{"content": "Ok"}	2025-12-09 20:50:19.468589	Saleday
771	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "Olá", "productId": 119}	2025-12-09 20:51:12.336361	Guilherme Tebaldi
772	message_sent	26	\N	20	\N	Mensagem enviada via chat direto	{"content": "Jj"}	2025-12-09 20:51:36.294801	cristiane tebaldi
773	message_sent	26	\N	20	\N	Mensagem enviada via chat direto	{"content": "Jash"}	2025-12-09 20:52:41.391125	cristiane tebaldi
774	message_sent	26	\N	20	\N	Mensagem enviada via chat direto	{"content": "Na sbs"}	2025-12-09 20:52:44.939197	cristiane tebaldi
775	message_sent	26	\N	20	\N	Mensagem enviada via chat direto	{"content": "Hjjjjjjjjj"}	2025-12-09 20:55:21.440145	cristiane tebaldi
776	message_sent	26	\N	9	119	Mensagem no chat do produto 119	{"content": "Jababs", "productId": 119}	2025-12-09 20:56:40.462883	Guilherme Tebaldi
777	message_sent	26	\N	20	\N	Mensagem enviada via chat direto	{"content": "Ssd"}	2025-12-09 21:00:55.068081	cristiane tebaldi
778	message_sent	9	\N	26	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-12-09 21:10:40.578749	Saleday
779	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-12-09 21:20:13.129032	Cristiane
780	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "ww"}	2025-12-09 21:20:18.659745	Cristiane
781	message_sent	9	\N	26	\N	Mensagem enviada via chat direto	{"content": "Khj"}	2025-12-09 21:22:20.218641	Saleday
782	message_sent	9	\N	26	\N	Mensagem enviada via chat direto	{"content": "Jgh"}	2025-12-09 21:22:33.288689	Saleday
783	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Guib"}	2025-12-09 21:22:59.919366	Cristiane
784	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Te amo"}	2025-12-10 07:06:11.187607	Cristiane
785	message_sent	28	\N	9	119	Mensagem no chat do produto 119	{"content": "__saleday_product_context__:{\\"productId\\":119,\\"title\\":\\"Musicassetta\\",\\"image\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"price\\":\\"10,00 €\\",\\"location\\":\\"Ardea, LAZIO, IT\\",\\"timestamp\\":1765350866383}", "productId": 119}	2025-12-10 07:14:26.764123	Guilherme Tebaldi
786	message_sent	28	\N	9	119	Mensagem no chat do produto 119	{"content": "__OFFER__{\\"amount\\":9,\\"currency\\":\\"EUR\\",\\"productId\\":119,\\"productTitle\\":\\"Musicassetta\\",\\"productImage\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"senderName\\":\\"Teste fabio\\",\\"message\\":null,\\"createdAt\\":\\"2025-12-10T07:14:26.382Z\\"}", "productId": 119}	2025-12-10 07:14:27.175733	Guilherme Tebaldi
787	message_sent	9	\N	28	119	Mensagem no chat do produto 119	{"content": "__OFFER_RESPONSE__{\\"targetMessageId\\":981,\\"status\\":\\"declined\\",\\"offer\\":{\\"amount\\":9,\\"currency\\":\\"EUR\\",\\"productId\\":119,\\"productTitle\\":\\"Musicassetta\\",\\"productImage\\":\\"http://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"senderName\\":\\"Teste fabio\\",\\"message\\":null,\\"createdAt\\":\\"2025-12-10T07:14:26.382Z\\"},\\"responderId\\":9,\\"responderName\\":\\"Guilherme Tebaldi\\",\\"createdAt\\":\\"2025-12-10T07:14:41.752Z\\"}", "productId": 119}	2025-12-10 07:14:42.098808	Guilherme Tebaldi
788	message_sent	28	\N	9	119	Mensagem no chat do produto 119	{"content": "Vai", "productId": 119}	2025-12-10 07:17:21.842115	Guilherme Tebaldi
789	message_sent	9	\N	28	\N	Mensagem enviada via chat direto	{"content": "Não"}	2025-12-10 07:17:33.466614	Teste fabio
790	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Te amo"}	2025-12-10 13:41:54.215702	Cristiane
791	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Jaba"}	2025-12-10 14:24:48.642449	Cristiane
792	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Jga"}	2025-12-10 14:54:03.980886	Cristiane
793	message_sent	9	\N	26	\N	Mensagem enviada via chat direto	{"content": "Hgg"}	2025-12-10 15:00:57.197059	Saleday
794	message_sent	20	\N	9	166	Mensagem no chat do produto 166	{"content": "__saleday_product_context__:{\\"productId\\":166,\\"title\\":\\"teste\\",\\"image\\":\\"https://saleday-backend.onrender.com/uploads/products/1765815427891-627085687.jpeg\\",\\"price\\":\\"18,88 €\\",\\"location\\":\\"Ardea, LAZIO, IT\\",\\"timestamp\\":1765899451000}", "productId": 166}	2025-12-16 15:37:40.879613	Guilherme Tebaldi
795	message_sent	20	\N	9	166	Mensagem no chat do produto 166	{"content": "ola", "productId": 166}	2025-12-16 15:37:41.323967	Guilherme Tebaldi
796	message_sent	20	\N	9	166	Mensagem no chat do produto 166	{"content": "gostei desse!", "productId": 166}	2025-12-16 15:37:56.392869	Guilherme Tebaldi
797	product_sold	9	Guilherme Tebaldi	20	166	Produto teste vendido para cristiane tebaldi	{"buyer_email": "cris@tebaldi.com", "confirmed_at": "2025-12-16T15:40:54.953Z"}	2025-12-16 15:40:55.075254	\N
798	product_sold	9	Guilherme Tebaldi	20	168	Produto teste casa vendido para cristiane tebaldi	{"buyer_email": "cris@tebaldi.com", "confirmed_at": "2025-12-16T16:09:51.069Z"}	2025-12-16 16:09:51.260433	\N
799	product_sold	9	Guilherme Tebaldi	20	169	Produto teste 3 vendido para cristiane tebaldi	{"buyer_email": "cris@tebaldi.com", "confirmed_at": "2025-12-16T16:20:36.825Z"}	2025-12-16 16:20:36.998362	\N
800	product_sold	9	Guilherme Tebaldi	20	170	Produto dww vendido para cristiane tebaldi	{"buyer_email": "cris@tebaldi.com", "confirmed_at": "2025-12-16T16:30:04.730Z"}	2025-12-16 16:30:04.836364	\N
801	product_sold	9	Guilherme Tebaldi	20	171	Produto wdw vendido para cristiane tebaldi	{"buyer_email": "cris@tebaldi.com", "confirmed_at": "2025-12-16T17:34:07.658Z"}	2025-12-16 17:34:07.831912	\N
802	product_sold	9	Guilherme Tebaldi	20	172	Produto dwd vendido para cristiane tebaldi	{"buyer_email": "cris@tebaldi.com", "confirmed_at": "2025-12-16T17:49:07.210Z"}	2025-12-16 17:49:07.383356	\N
803	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "idfmew"}	2025-12-16 18:32:23.53899	cristiane tebaldi
804	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "dwdw"}	2025-12-16 18:33:49.116241	Guilherme Tebaldi
805	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Te amo"}	2025-12-19 11:24:32.665885	Cristiane
806	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Tenho sdd"}	2025-12-19 11:24:42.455107	Cristiane
807	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Vamos trabalhar!"}	2025-12-19 11:24:57.170958	Cristiane
808	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Hello good afternoon"}	2025-12-19 11:29:14.620361	Guilherme Tebaldi
809	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Very good"}	2025-12-19 11:29:53.493609	Guilherme Tebaldi
810	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Vero"}	2025-12-19 11:30:03.655999	Cristiane
811	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Te amo amore"}	2025-12-19 11:30:20.801722	Cristiane
812	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "I can to sleep 😴"}	2025-12-19 11:30:22.361429	Guilherme Tebaldi
813	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Good job"}	2025-12-19 11:30:55.764757	Guilherme Tebaldi
814	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Is beautiful 🤩"}	2025-12-19 11:31:20.057876	Guilherme Tebaldi
815	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "❤️"}	2025-12-19 11:31:33.581483	Cristiane
816	message_sent	9	\N	29	206	Mensagem no chat do produto 206	{"content": "__saleday_product_context__:{\\"productId\\":206,\\"title\\":\\"Laptop\\",\\"image\\":\\"\\",\\"price\\":\\"R$ 1.000,00\\",\\"location\\":\\"Foz do Iguaçu, PR, BR\\",\\"timestamp\\":1766242065559}", "productId": 206}	2025-12-20 14:47:52.770508	Eduardo Mateus eichtalt
817	message_sent	9	\N	29	206	Mensagem no chat do produto 206	{"content": "Me interesse", "productId": 206}	2025-12-20 14:47:53.183689	Eduardo Mateus eichtalt
818	message_sent	9	\N	29	206	Mensagem no chat do produto 206	{"content": "❤️", "productId": 206}	2025-12-20 14:48:38.666085	Eduardo Mateus eichtalt
819	message_sent	29	\N	9	\N	Mensagem enviada via chat direto	{"content": "Ok. Parcela em até 5 vezes sem juros."}	2025-12-20 14:48:45.0854	Guilherme Tebaldi
820	message_sent	9	\N	32	\N	Mensagem enviada via chat direto	{"content": "E criei esse chat"}	2025-12-26 18:31:09.452546	Nicole Lindner
821	message_sent	9	\N	32	\N	Mensagem enviada via chat direto	{"content": "Que é parecido com WhatsApp! Ainda eu quero implementar pra pessoa poder mandar foto"}	2025-12-26 18:31:24.462745	Nicole Lindner
896	message_sent	79	\N	68	\N	Mensagem enviada via chat direto	{"content": "ola"}	2026-01-30 20:02:29.939192	Guilherme Tebaldi
822	message_sent	9	\N	32	\N	Mensagem enviada via chat direto	{"content": "A ideia aqui é a pessoa poder mandar uma mensagem pra você perguntando sobre algum produto específico"}	2025-12-26 18:31:49.139709	Nicole Lindner
823	message_sent	9	\N	32	209	Mensagem no chat do produto 209	{"content": "__saleday_product_context__:{\\"productId\\":209,\\"title\\":\\"Venda de terreno Derbravador\\",\\"image\\":\\"https://saleday-backend.onrender.com/uploads/products/1766773936345-568456498.jpeg\\",\\"price\\":\\"R$ 400.000,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1766773968967}", "productId": 209}	2025-12-26 18:33:06.653302	Nicole Lindner
824	message_sent	9	\N	32	209	Mensagem no chat do produto 209	{"content": "Aí aqui eu encontrei o seu produto no site! E eu mandaria uma mensagem pra você perguntando sobre o produto", "productId": 209}	2025-12-26 18:33:07.067551	Nicole Lindner
825	message_sent	33	\N	9	\N	Mensagem enviada via chat direto	{"content": "ola"}	2026-01-02 16:37:20.95906	Guilherme Tebaldi
826	message_sent	34	\N	9	\N	Mensagem enviada via chat direto	{"content": "wdwd"}	2026-01-02 16:38:14.406492	Guilherme Tebaldi
827	message_sent	20	\N	9	119	Mensagem no chat do produto 119	{"content": "__saleday_product_context__:{\\"productId\\":119,\\"title\\":\\"Musicassetta\\",\\"image\\":\\"https://saleday-backend.onrender.com/uploads/products/1765269876328-247656741.jpeg\\",\\"price\\":\\"10,00 €\\",\\"location\\":\\"Ardea, LAZIO, IT\\",\\"timestamp\\":1767387505613}", "productId": 119}	2026-01-02 20:58:29.677817	Guilherme Tebaldi
828	message_sent	20	\N	9	119	Mensagem no chat do produto 119	{"content": "ccbn", "productId": 119}	2026-01-02 20:58:30.009524	Guilherme Tebaldi
829	message_sent	9	\N	20	225	Mensagem no chat do produto 225	{"content": "__saleday_product_context__:{\\"productId\\":225,\\"title\\":\\"Hajsb\\",\\"image\\":\\"https://saleday-backend.onrender.com/uploads/products/1767433944812-279323769.png\\",\\"price\\":\\"121,28 €\\",\\"location\\":\\"Ardea, LAZIO, IT\\",\\"timestamp\\":1767437468778}", "productId": 225}	2026-01-03 10:52:27.921026	santiago mendonça
830	message_sent	9	\N	20	225	Mensagem no chat do produto 225	{"content": "fef", "productId": 225}	2026-01-03 10:52:28.250307	santiago mendonça
831	message_sent	20	\N	27	224	Mensagem no chat do produto 224	{"content": "__saleday_product_context__:{\\"productId\\":224,\\"title\\":\\"Notebook\\",\\"image\\":\\"https://saleday-backend.onrender.com/uploads/products/1767433834581-570540491.png\\",\\"price\\":\\"5000,00 €\\",\\"location\\":\\"Ardea, LAZIO, IT\\",\\"timestamp\\":1767438321609}", "productId": 224}	2026-01-03 11:05:33.436742	Cristiane
832	message_sent	20	\N	27	224	Mensagem no chat do produto 224	{"content": "Bbb.", "productId": 224}	2026-01-03 11:05:33.8342	Cristiane
833	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "Nvnb"}	2026-01-03 11:06:55.264146	Guilherme Tebaldi
834	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "fghj"}	2026-01-03 11:10:16.209487	santiago mendonça
835	message_sent	9	\N	27	224	Mensagem no chat do produto 224	{"content": "__saleday_product_context__:{\\"productId\\":224,\\"title\\":\\"Notebook\\",\\"image\\":\\"https://saleday-backend.onrender.com/uploads/products/1767433834581-570540491.png\\",\\"price\\":\\"5000,00 €\\",\\"location\\":\\"Ardea, LAZIO, IT\\",\\"timestamp\\":1767438662098}", "productId": 224}	2026-01-03 11:11:08.591455	Cristiane
836	message_sent	9	\N	27	224	Mensagem no chat do produto 224	{"content": "que produto legal!", "productId": 224}	2026-01-03 11:11:09.021421	Cristiane
837	message_sent	20	\N	27	224	Mensagem no chat do produto 224	{"content": "Bastiona", "productId": 224}	2026-01-03 11:12:38.420554	Cristiane
838	message_sent	9	\N	27	224	Mensagem no chat do produto 224	{"content": "rtyui", "productId": 224}	2026-01-03 11:19:32.608219	Cristiane
839	message_sent	9	\N	27	224	Mensagem no chat do produto 224	{"content": "ded", "productId": 224}	2026-01-03 11:21:52.548865	Cristiane
840	message_sent	9	\N	27	224	Mensagem no chat do produto 224	{"content": "wfwe", "productId": 224}	2026-01-03 11:27:52.550261	Cristiane
841	message_sent	20	\N	27	224	Mensagem no chat do produto 224	{"content": "Dd", "productId": 224}	2026-01-03 11:29:33.070885	Cristiane
842	message_sent	20	\N	27	224	Mensagem no chat do produto 224	{"content": "Dd", "productId": 224}	2026-01-03 11:30:12.319796	Cristiane
843	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "Dc"}	2026-01-03 11:30:48.858657	Guilherme Tebaldi
844	message_sent	20	\N	9	\N	Mensagem enviada via chat direto	{"content": "Ff"}	2026-01-03 11:31:03.494597	Guilherme Tebaldi
845	product_sold	27	Cristiane	20	224	Produto Notebook vendido para santiago mendonça	{"buyer_email": "cris@tebaldi.com", "confirmed_at": "2026-01-03T11:34:49.716Z"}	2026-01-03 11:34:49.831857	\N
846	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "bo;a"}	2026-01-09 19:53:53.759167	santiago mendonça
847	message_sent	9	\N	27	224	Mensagem no chat do produto 224	{"content": "__templesale_product_context__:{\\"productId\\":224,\\"title\\":\\"Notebook\\",\\"image\\":\\"https://saleday-backend.onrender.com/uploads/products/1767433834581-570540491.png\\",\\"price\\":\\"5000,00 €\\",\\"location\\":\\"Ardea, LAZIO, IT\\",\\"timestamp\\":1767988952298}", "productId": 224}	2026-01-09 20:02:38.525531	Cristiane
848	message_sent	9	\N	27	224	Mensagem no chat do produto 224	{"content": "ddwd", "productId": 224}	2026-01-09 20:02:39.007076	Cristiane
849	message_sent	9	\N	32	209	Mensagem no chat do produto 209	{"content": "__templesale_product_context__:{\\"productId\\":209,\\"title\\":\\"Venda de terreno Derbravador\\",\\"image\\":\\"https://saleday-backend.onrender.com/uploads/products/1766773936345-568456498.jpeg\\",\\"price\\":\\"R$ 400.000,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1767989110983}", "productId": 209}	2026-01-09 20:05:14.531861	Nicole Lindner
850	message_sent	9	\N	32	209	Mensagem no chat do produto 209	{"content": "teste", "productId": 209}	2026-01-09 20:05:15.073346	Nicole Lindner
851	message_sent	9	\N	29	\N	Mensagem enviada via chat direto	{"content": "teste"}	2026-01-09 20:05:54.819619	Eduardo Mateus eichtalt
852	message_sent	35	\N	9	\N	Mensagem enviada via chat direto	{"content": "teste"}	2026-01-09 21:11:34.685938	Guilherme Tebaldi
853	message_sent	27	\N	20	\N	Mensagem enviada via chat direto	{"content": "No está disponível"}	2026-01-09 21:14:40.946076	santiago mendonça
854	message_sent	20	\N	9	259	Mensagem no chat do produto 259	{"content": "__templesale_product_context__:{\\"productId\\":259,\\"title\\":\\"teste\\",\\"image\\":\\"https://saleday-backend.onrender.com/uploads/products/1768128633864-977207344.jpg\\",\\"price\\":\\"R$ 234,56\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1768149074583}", "productId": 259}	2026-01-11 16:31:29.715938	Guilherme Tebaldi
855	message_sent	20	\N	9	259	Mensagem no chat do produto 259	{"content": "S", "productId": 259}	2026-01-11 16:31:30.083038	Guilherme Tebaldi
856	message_sent	36	\N	35	258	Mensagem no chat do produto 258	{"content": "__templesale_product_context__:{\\"productId\\":258,\\"title\\":\\"erthjk\\",\\"image\\":\\"https://saleday-backend.onrender.com/uploads/products/1768128582751-472288998.jpg\\",\\"price\\":\\"R$ 3.456,78\\",\\"location\\":\\"Balneário Piçarras, SC, BR\\",\\"timestamp\\":1768600888567}", "productId": 258}	2026-01-16 22:01:48.854338	templesale
857	message_sent	36	\N	35	258	Mensagem no chat do produto 258	{"content": "Olá", "productId": 258}	2026-01-16 22:01:49.571587	templesale
858	message_sent	36	\N	35	258	Mensagem no chat do produto 258	{"content": "Ola", "productId": 258}	2026-01-16 22:16:26.498309	templesale
859	message_sent	9	\N	20	\N	Mensagem enviada via chat direto	{"content": "teste cris"}	2026-01-17 15:10:59.010122	santiago mendonça
860	message_sent	27	\N	20	\N	Mensagem enviada via chat direto	{"content": "Santiago teu pai é um viado kkkkkkk"}	2026-01-17 19:24:49.140121	santiago mendonça
861	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Jacaré"}	2026-01-17 19:29:48.928397	Guilherme Tebaldi
862	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "De teta"}	2026-01-17 19:30:17.943382	Guilherme Tebaldi
863	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Ivan ti sleep"}	2026-01-17 19:32:08.493518	Guilherme Tebaldi
864	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "Good night my dear sweet dreams I love you and I’m thinking about you today"}	2026-01-17 19:32:57.762747	Guilherme Tebaldi
865	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "The first time sleeping with my boyfriend"}	2026-01-17 19:33:46.429442	Guilherme Tebaldi
866	message_sent	27	\N	9	\N	Mensagem enviada via chat direto	{"content": "The first time sleeping with my boyfriend"}	2026-01-17 19:34:31.667565	Guilherme Tebaldi
867	message_sent	27	\N	20	260	Mensagem no chat do produto 260	{"content": "__templesale_product_context__:{\\"productId\\":260,\\"title\\":\\"Teste più\\",\\"image\\":\\"https://saleday-backend.onrender.com/uploads/products/1768300586152-671984869.jpg\\",\\"price\\":\\"125.000,00 €\\",\\"location\\":\\"Molara, LAZIO, IT\\",\\"timestamp\\":1768678542017}", "productId": 260}	2026-01-17 19:35:42.498879	santiago mendonça
868	message_sent	27	\N	20	260	Mensagem no chat do produto 260	{"content": "__OFFER__{\\"amount\\":1,\\"currency\\":\\"EUR\\",\\"productId\\":260,\\"productTitle\\":\\"Teste più\\",\\"productImage\\":\\"https://saleday-backend.onrender.com/uploads/products/1768300586152-671984869.jpg\\",\\"senderName\\":\\"Cristiane\\",\\"message\\":\\"Não gostei da localization\\",\\"createdAt\\":\\"2026-01-17T19:35:42.016Z\\"}", "productId": 260}	2026-01-17 19:35:42.827485	santiago mendonça
869	message_sent	27	\N	20	260	Mensagem no chat do produto 260	{"content": "Santiago is a good guy and he has the best of both ways", "productId": 260}	2026-01-17 19:36:25.944114	santiago mendonça
870	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "Não sabe nem o portugues !"}	2026-01-17 19:46:37.222446	Cristiane
871	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "vai estudar o italiano !"}	2026-01-17 19:46:53.995202	Cristiane
872	message_sent	9	\N	27	\N	Mensagem enviada via chat direto	{"content": "isso voce nao sabe!"}	2026-01-17 19:47:04.753203	Cristiane
873	message_sent	9	\N	29	\N	Mensagem enviada via chat direto	{"content": "coloca foto ! 😍"}	2026-01-17 19:47:27.999876	Eduardo Mateus eichtalt
874	message_sent	68	\N	73	\N	Mensagem enviada via chat direto	{"content": "Olá"}	2026-01-19 18:21:11.304537	overworlddead
875	message_sent	73	\N	68	\N	Mensagem enviada via chat direto	{"content": "Olá"}	2026-01-19 18:21:31.237386	Guilherme Tebaldi
876	message_sent	68	\N	73	\N	Mensagem enviada via chat direto	{"content": "Si"}	2026-01-19 18:22:25.098235	overworlddead
877	message_sent	68	\N	77	\N	Mensagem enviada via chat direto	{"content": "Oi"}	2026-01-20 18:39:33.100408	cristianeeichtalt3
878	message_sent	77	\N	68	\N	Mensagem enviada via chat direto	{"content": "Hi"}	2026-01-20 18:39:48.536857	Guilherme Tebaldi
879	message_sent	68	\N	77	\N	Mensagem enviada via chat direto	{"content": "Vamos fazer sexo"}	2026-01-20 18:39:58.045782	cristianeeichtalt3
880	message_sent	77	\N	68	\N	Mensagem enviada via chat direto	{"content": "Nice to Meet you"}	2026-01-20 18:39:59.525321	Guilherme Tebaldi
881	message_sent	77	\N	68	\N	Mensagem enviada via chat direto	{"content": "I ma married"}	2026-01-20 18:40:17.737109	Guilherme Tebaldi
882	message_sent	68	\N	77	\N	Mensagem enviada via chat direto	{"content": "Você tem buceta ?"}	2026-01-20 18:40:23.365655	cristianeeichtalt3
883	message_sent	77	\N	68	\N	Mensagem enviada via chat direto	{"content": "No"}	2026-01-20 18:40:30.689895	Guilherme Tebaldi
884	message_sent	68	\N	77	\N	Mensagem enviada via chat direto	{"content": "Eu tenho !"}	2026-01-20 18:40:36.988079	cristianeeichtalt3
885	message_sent	77	\N	68	\N	Mensagem enviada via chat direto	{"content": "Io tenho pirocao"}	2026-01-20 18:40:39.78469	Guilherme Tebaldi
886	message_sent	68	\N	77	\N	Mensagem enviada via chat direto	{"content": "A da minha mulher"}	2026-01-20 18:40:44.779515	cristianeeichtalt3
887	message_sent	57	\N	29	277	Mensagem no chat do produto 277	{"content": "__templesale_product_context__:{\\"productId\\":277,\\"title\\":\\"celta\\",\\"image\\":\\"https://res.cloudinary.com/dymox62b9/image/upload/v1769105619/saleday/products/iapmtrg8uetsoli2nukt.png\\",\\"price\\":\\"R$ 25.000,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1769105637984}", "productId": 277}	2026-01-22 18:14:06.046679	Eduardo Mateus eichtalt
888	message_sent	57	\N	29	277	Mensagem no chat do produto 277	{"content": "quanto ?", "productId": 277}	2026-01-22 18:14:06.409616	Eduardo Mateus eichtalt
889	message_sent	57	\N	29	277	Mensagem no chat do produto 277	{"content": "faz em parcelas ?", "productId": 277}	2026-01-22 18:14:15.84393	Eduardo Mateus eichtalt
890	message_sent	29	\N	57	\N	Mensagem enviada via chat direto	{"content": "faz em 1000 vzs"}	2026-01-22 18:14:38.006862	Rafael
891	message_sent	57	\N	29	277	Mensagem no chat do produto 277	{"content": "gostei !", "productId": 277}	2026-01-22 18:14:58.01235	Eduardo Mateus eichtalt
892	message_sent	29	\N	57	\N	Mensagem enviada via chat direto	{"content": "para vc e de graça por ter levado a cristiane aqui de casa."}	2026-01-22 18:15:44.009929	Rafael
893	product_sold	68	Guilherme Tebaldi	79	283	Produto Teste vendido para Evangelista Moraes Tebaldi	{"buyer_email": "licetebaldi@gmail.com", "confirmed_at": "2026-01-29T20:12:00.675Z"}	2026-01-29 20:12:00.846983	\N
894	message_sent	68	\N	79	\N	Mensagem enviada via chat direto	{"content": "Olá"}	2026-01-29 20:13:29.163183	Evangelista Moraes Tebaldi
895	message_sent	79	\N	68	\N	Mensagem enviada via chat direto	{"content": "dfghjkl"}	2026-01-29 20:56:37.418123	Guilherme Tebaldi
897	message_sent	79	\N	68	283	Mensagem no chat do produto 283	{"content": "__templesale_product_context__:{\\"productId\\":283,\\"title\\":\\"Teste\\",\\"image\\":\\"https://res.cloudinary.com/dymox62b9/image/upload/v1769717416/saleday/products/tgtgnka9kk6vnmw3lkes.png\\",\\"price\\":\\"R$ 200,00\\",\\"location\\":\\"Chapecó, SC, BR\\",\\"timestamp\\":1769806683453}", "productId": 283}	2026-01-30 20:58:08.212002	Guilherme Tebaldi
898	message_sent	79	\N	68	283	Mensagem no chat do produto 283	{"content": "jbub", "productId": 283}	2026-01-30 20:58:08.581632	Guilherme Tebaldi
899	product_sold	79	Evangelista Moraes Tebaldi	68	284	Produto teste 2 vendido para Guilherme Tebaldi	{"buyer_email": "tebaldiguilherme.roma@gmail.com", "confirmed_at": "2026-01-30T21:04:34.487Z"}	2026-01-30 21:04:34.615095	\N
\.


--
-- Data for Name: admin_visitor_self_signatures; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.admin_visitor_self_signatures (id, admin_email, signature_key, device_type, device_model, os_name, os_version, created_at, last_seen_at) FROM stdin;
1	admin@saleday.com	desktop|mac|macos|10.15	desktop	Mac	macOS	10.15	1773245857379	1773670077042
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.favorites (id, user_id, product_id, created_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.messages (id, sender_id, receiver_id, product_id, content, created_at, is_read) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.orders (id, product_id, seller_id, buyer_id, status, created_at, confirmed_at, updated_at, completed_at, total) FROM stdin;
\.


--
-- Data for Name: product_cart_notifications; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.product_cart_notifications (id, owner_user_id, actor_user_id, actor_name, product_id, created_at) FROM stdin;
4	119	\N		332	2026-03-10 12:44:45.167713
5	119	\N		403	2026-03-10 19:21:55.772639
6	119	\N		398	2026-03-11 07:23:53.193292
7	119	\N		383	2026-03-11 07:25:51.550328
8	119	\N		417	2026-03-12 21:10:11.720146
9	119	\N		378	2026-06-01 13:48:57.117598
\.


--
-- Data for Name: product_comments; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.product_comments (id, product_id, user_id, parent_comment_id, rating, body, created_at) FROM stdin;
10	380	117	\N	5	Ottimo prodotto.	2026-04-01 13:29:03.961394+00
\.


--
-- Data for Name: product_likes; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.product_likes (user_id, product_id, created_at) FROM stdin;
117	416	1773168995
117	380	1775050081
117	417	1780401785
\.


--
-- Data for Name: product_questions; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.product_questions (id, product_id, user_id, content, created_at, updated_at, response_content, response_user_id, response_created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.products (id, user_id, title, description, price, category, city, image_url, created_at, lat, lng, country, state, neighborhood, street, zip, status, brand, model, color, year, is_free, district, pickup_only, image_urls, views_count, clicks_count, favorites_count, rank, clicks, likes, last_viewed_at, last_clicked_at, manual_rank_position, manual_rank_started_at, manual_rank_expires_at, manual_rank_plan, property_type, surface_area, bedrooms, bathrooms, parking, condo_fee, rent_type, hidden_by_seller, service_type, service_duration, service_rate, service_location, job_title, job_type, job_salary, job_requirements, links, image_kinds, floorplan_urls, latitude, longitude, name, image, images, details, quantity, price_negotiable, slug, click_count) FROM stdin;
337	119	Borsa Elegante da Donna	Borsa da donna dal design elegante e raffinato, perfetta per l’uso quotidiano o per occasioni speciali. Realizzata con materiali resistenti e rifiniture curate nei dettagli, combina stile e praticità.\n\nDotata di comodi manici per il trasporto a mano e ampio spazio interno per organizzare facilmente oggetti personali come telefono, portafoglio e accessori. Il contrasto di colori dona un aspetto moderno e sofisticato, ideale per completare qualsiasi outfit.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773153820/templesale/products/product_user_119_1773153819247_9f5214a3e812.jpg	2026-03-10 14:45:42.077471	41.590283	12.523127	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773153820/templesale/products/product_user_119_1773153819247_9f5214a3e812.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773153826/templesale/products/product_user_119_1773153825276_b4a3bfba6fd9.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773153831/templesale/products/product_user_119_1773153831021_818fa4d929be.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590283	12.523127	Borsa Elegante da Donna	https://res.cloudinary.com/dymox62b9/image/upload/v1773153820/templesale/products/product_user_119_1773153819247_9f5214a3e812.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773153820/templesale/products/product_user_119_1773153819247_9f5214a3e812.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773153826/templesale/products/product_user_119_1773153825276_b4a3bfba6fd9.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773153831/templesale/products/product_user_119_1773153831021_818fa4d929be.jpg"]	{"color":"Blu"}	1	t	borsa-elegante-da-donna-337	0
339	119	Borsa Leopardata Donna	Borsa da donna con elegante fantasia leopardata, perfetta per aggiungere stile e personalità a qualsiasi outfit. Realizzata con materiali resistenti e dettagli curati, presenta una comoda tracolla regolabile e tasche con chiusura a zip per una migliore organizzazione degli oggetti personali.\n\nIdeale per l’uso quotidiano grazie alla sua praticità e al design moderno che unisce eleganza e carattere.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773154204/templesale/products/product_user_119_1773154204181_899fc2202203.jpg	2026-03-10 14:50:48.798859	41.590219	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773154204/templesale/products/product_user_119_1773154204181_899fc2202203.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154211/templesale/products/product_user_119_1773154210736_8290a46ac6a6.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154218/templesale/products/product_user_119_1773154217619_e8f11b95fc58.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590219	12.523298	Borsa Leopardata Donna	https://res.cloudinary.com/dymox62b9/image/upload/v1773154204/templesale/products/product_user_119_1773154204181_899fc2202203.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773154204/templesale/products/product_user_119_1773154204181_899fc2202203.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154211/templesale/products/product_user_119_1773154210736_8290a46ac6a6.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154218/templesale/products/product_user_119_1773154217619_e8f11b95fc58.jpg"]	{}	1	t	borsa-leopardata-donna-339	0
332	119	Tapete	2,50 x 3.50	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773146479/templesale/products/product_user_119_1773146479156_ed980ea20a40.jpg	2026-03-10 12:44:09.373122	41.589788	12.523617	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773146479/templesale/products/product_user_119_1773146479156_ed980ea20a40.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773146506/templesale/products/product_user_119_1773146505787_8418fe5e6720.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589788	12.523617	Tapete	https://res.cloudinary.com/dymox62b9/image/upload/v1773146479/templesale/products/product_user_119_1773146479156_ed980ea20a40.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773146479/templesale/products/product_user_119_1773146479156_ed980ea20a40.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773146506/templesale/products/product_user_119_1773146505787_8418fe5e6720.jpg"]	{}	10	t	tapete-332	0
408	119	Statue decorative	Diversi statue decorative, in terracotta gesso	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773164658/templesale/products/product_user_119_1773164658402_aca09a1cb309.jpg	2026-03-10 17:45:32.595883	41.589994	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164658/templesale/products/product_user_119_1773164658402_aca09a1cb309.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164662/templesale/products/product_user_119_1773164661638_a30498fbd70c.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164664/templesale/products/product_user_119_1773164663920_7098b0cbb438.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164666/templesale/products/product_user_119_1773164666048_653f9abddaa6.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164668/templesale/products/product_user_119_1773164668403_20b992ec0def.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164671/templesale/products/product_user_119_1773164671605_96e8ada66c0d.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164674/templesale/products/product_user_119_1773164673910_132d75d3d2bb.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589994	12.523298	Statue decorative	https://res.cloudinary.com/dymox62b9/image/upload/v1773164658/templesale/products/product_user_119_1773164658402_aca09a1cb309.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164658/templesale/products/product_user_119_1773164658402_aca09a1cb309.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164662/templesale/products/product_user_119_1773164661638_a30498fbd70c.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164664/templesale/products/product_user_119_1773164663920_7098b0cbb438.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164666/templesale/products/product_user_119_1773164666048_653f9abddaa6.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164668/templesale/products/product_user_119_1773164668403_20b992ec0def.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164671/templesale/products/product_user_119_1773164671605_96e8ada66c0d.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164674/templesale/products/product_user_119_1773164673910_132d75d3d2bb.jpg"]	{}	1	t	statue-decorative-408	5
422	117	vintage CD	Diversi vecchi CD. \nPer decorazione.\n\nNon so se funzionano.	3.00	Vintage	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1775050872/templesale/products/product_user_117_1775050871993_48a9862ee480.jpg	2026-04-01 13:44:46.886176	41.592469	12.501747	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1775050872/templesale/products/product_user_117_1775050871993_48a9862ee480.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1775050873/templesale/products/product_user_117_1775050873642_f6e8e1dd02f6.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1775050875/templesale/products/product_user_117_1775050875307_09bb57b31616.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.592469	12.501747	vintage CD	https://res.cloudinary.com/dymox62b9/image/upload/v1775050872/templesale/products/product_user_117_1775050871993_48a9862ee480.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1775050872/templesale/products/product_user_117_1775050871993_48a9862ee480.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1775050873/templesale/products/product_user_117_1775050873642_f6e8e1dd02f6.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1775050875/templesale/products/product_user_117_1775050875307_09bb57b31616.jpg"]	{}	15	f	vintage-cd-422	12
333	119	Anfore o vaso	Terra cotta. Fazo	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773147302/templesale/products/product_user_119_1773147301898_b0e9950f69bf.jpg	2026-03-10 12:56:55.293555	41.58977	12.523212	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773147302/templesale/products/product_user_119_1773147301898_b0e9950f69bf.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773147312/templesale/products/product_user_119_1773147311521_5b7ebb506069.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.58977	12.523212	Anfore o vaso	https://res.cloudinary.com/dymox62b9/image/upload/v1773147302/templesale/products/product_user_119_1773147301898_b0e9950f69bf.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773147302/templesale/products/product_user_119_1773147301898_b0e9950f69bf.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773147312/templesale/products/product_user_119_1773147311521_5b7ebb506069.jpg"]	{}	1	t	anfore-o-vaso-333	0
338	119	Borsa Donna con Pochette	Borsa da donna elegante e pratica, realizzata con materiali resistenti e design moderno. Dotata di ampio spazio interno per organizzare facilmente oggetti personali come telefono, portafoglio e accessori.\n\nInclude una piccola pochette coordinata con chiusura a zip, ideale per monete o piccoli oggetti. I manici resistenti e le rifiniture curate rendono questa borsa perfetta per l’uso quotidiano o per completare un outfit con stile.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773153981/templesale/products/product_user_119_1773153980657_6360745b4a58.jpg	2026-03-10 14:47:56.893897	41.589962	12.523384	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773153981/templesale/products/product_user_119_1773153980657_6360745b4a58.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773153987/templesale/products/product_user_119_1773153986779_67162b5bb686.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154002/templesale/products/product_user_119_1773154001962_5cc792292479.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154020/templesale/products/product_user_119_1773154020179_2c725cc3664c.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589962	12.523384	Borsa Donna con Pochette	https://res.cloudinary.com/dymox62b9/image/upload/v1773153981/templesale/products/product_user_119_1773153980657_6360745b4a58.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773153981/templesale/products/product_user_119_1773153980657_6360745b4a58.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773153987/templesale/products/product_user_119_1773153986779_67162b5bb686.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154002/templesale/products/product_user_119_1773154001962_5cc792292479.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154020/templesale/products/product_user_119_1773154020179_2c725cc3664c.jpg"]	{}	1	t	borsa-donna-con-pochette-338	0
360	119	Profumo Uomo MK One Noir	Fragranza dal carattere deciso con un profumo intenso e maschile. Le note profonde creano una sensazione di eleganza e sicurezza, ideale per la sera o per eventi importanti. Un profumo raffinato che lascia una scia persistente.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773157749/templesale/products/product_user_119_1773157748701_047d0dfa6966.jpg	2026-03-10 15:49:10.497173	41.590476	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157749/templesale/products/product_user_119_1773157748701_047d0dfa6966.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590476	12.523298	Profumo Uomo MK One Noir	https://res.cloudinary.com/dymox62b9/image/upload/v1773157749/templesale/products/product_user_119_1773157748701_047d0dfa6966.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157749/templesale/products/product_user_119_1773157748701_047d0dfa6966.jpg"]	{}	1	t	profumo-uomo-mk-one-noir-360	0
361	119	Profumo Uomo MK One Forever	Profumo maschile moderno con una fragranza fresca e avvolgente. Le sue note equilibrate lo rendono perfetto per l’uso quotidiano, offrendo una sensazione di freschezza e stile durante tutta la giornata.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773157752/templesale/products/product_user_119_1773157751817_93a76b06bf13.jpg	2026-03-10 15:49:13.317805	41.589834	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157752/templesale/products/product_user_119_1773157751817_93a76b06bf13.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589834	12.52317	Profumo Uomo MK One Forever	https://res.cloudinary.com/dymox62b9/image/upload/v1773157752/templesale/products/product_user_119_1773157751817_93a76b06bf13.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157752/templesale/products/product_user_119_1773157751817_93a76b06bf13.jpg"]	{}	1	t	profumo-uomo-mk-one-forever-361	0
381	119	Mini Motosega a Batteria Li-Ion LS-004 48V (Barra 6")	Mini motosega elettrica a batteria, pratica e maneggevole per lavori di taglio in giardino e piccole potature. Modello LS-004 con barra da 6 pollici, velocità a vuoto fino a 5 m/s e alimentazione Li-Ion 48V (dati indicati sulla confezione). Ideale per rami, legno leggero e manutenzione domestica grazie al formato compatto e all'uso rapido.	0.00	Ferramentas e Construção	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1774958197/templesale/products/product_user_119_1774958197087_2fdcf22ccdc9.webp	2026-03-10 16:26:48.351196	41.589834	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1774958197/templesale/products/product_user_119_1774958197087_2fdcf22ccdc9.webp","https://res.cloudinary.com/dymox62b9/image/upload/v1774958195/templesale/products/product_user_119_1774958194808_9a003823af78.webp","https://res.cloudinary.com/dymox62b9/image/upload/v1773160003/templesale/products/product_user_119_1773160002607_81f783ef3193.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160004/templesale/products/product_user_119_1773160004601_899606e4132b.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160007/templesale/products/product_user_119_1773160007076_27f2b7610b8b.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589834	12.52317	Mini Motosega a Batteria Li-Ion LS-004 48V (Barra 6")	https://res.cloudinary.com/dymox62b9/image/upload/v1774958197/templesale/products/product_user_119_1774958197087_2fdcf22ccdc9.webp	["https://res.cloudinary.com/dymox62b9/image/upload/v1774958197/templesale/products/product_user_119_1774958197087_2fdcf22ccdc9.webp","https://res.cloudinary.com/dymox62b9/image/upload/v1774958195/templesale/products/product_user_119_1774958194808_9a003823af78.webp","https://res.cloudinary.com/dymox62b9/image/upload/v1773160003/templesale/products/product_user_119_1773160002607_81f783ef3193.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160004/templesale/products/product_user_119_1773160004601_899606e4132b.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160007/templesale/products/product_user_119_1773160007076_27f2b7610b8b.jpg"]	{}	1	t	mini-motosega-a-batteria-li-ion-ls-004-48v-barra-6-381	6
344	119	Stivaletti Sandalo Donna	Eleganti stivaletti sandalo da donna con design traforato che unisce stile e comfort. Il tacco stabile offre una camminata sicura mentre la struttura aperta garantisce freschezza e comodità durante la stagione primavera-estate.\n\nPerfetti per completare outfit casual o più eleganti. Disponibili in diversi colori per adattarsi facilmente a ogni stile.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773155376/templesale/products/product_user_119_1773155375654_590b1db8dba0.jpg	2026-03-10 15:10:32.403013	41.589962	12.523942	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773155376/templesale/products/product_user_119_1773155375654_590b1db8dba0.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155382/templesale/products/product_user_119_1773155382367_0c660c74810b.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155387/templesale/products/product_user_119_1773155387279_0c078a842559.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155392/templesale/products/product_user_119_1773155392041_f58326cb4ae9.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589962	12.523942	Stivaletti Sandalo Donna	https://res.cloudinary.com/dymox62b9/image/upload/v1773155376/templesale/products/product_user_119_1773155375654_590b1db8dba0.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773155376/templesale/products/product_user_119_1773155375654_590b1db8dba0.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155382/templesale/products/product_user_119_1773155382367_0c660c74810b.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155387/templesale/products/product_user_119_1773155387279_0c078a842559.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155392/templesale/products/product_user_119_1773155392041_f58326cb4ae9.jpg"]	{}	1	t	stivaletti-sandalo-donna-344	0
346	119	Sneaker Uomo Stile Classico	Scarpa sportiva dal look pulito ed elegante, con inserti in contrasto che valorizzano il design. La struttura leggera e la suola flessibile offrono comodità e praticità per l’uso quotidiano.\n\nAdatta sia per il tempo libero che per un look urbano moderno.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773155685/templesale/products/product_user_119_1773155684253_bcd715747fdc.jpg	2026-03-10 15:15:39.531205	41.589994	12.523427	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773155685/templesale/products/product_user_119_1773155684253_bcd715747fdc.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155691/templesale/products/product_user_119_1773155690435_7ea58ebb246a.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589994	12.523427	Sneaker Uomo Stile Classico	https://res.cloudinary.com/dymox62b9/image/upload/v1773155685/templesale/products/product_user_119_1773155684253_bcd715747fdc.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773155685/templesale/products/product_user_119_1773155684253_bcd715747fdc.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155691/templesale/products/product_user_119_1773155690435_7ea58ebb246a.jpg"]	{"color":"Bianco"}	1	t	sneaker-uomo-stile-classico-346	0
347	119	Sneaker Uomo Sportivo Tecnico	Sneaker dal design sportivo con dettagli tecnici e struttura ergonomica. La suola robusta offre una buona aderenza mentre la forma avvolgente garantisce comfort durante la camminata.\n\nIdeale per uno stile casual dinamico.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773155766/templesale/products/product_user_119_1773155766181_d0051ed9a2de.jpg	2026-03-10 15:16:48.635032	41.58977	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773155766/templesale/products/product_user_119_1773155766181_d0051ed9a2de.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155771/templesale/products/product_user_119_1773155771297_48b05e13102c.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.58977	12.52317	Sneaker Uomo Sportivo Tecnico	https://res.cloudinary.com/dymox62b9/image/upload/v1773155766/templesale/products/product_user_119_1773155766181_d0051ed9a2de.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773155766/templesale/products/product_user_119_1773155766181_d0051ed9a2de.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155771/templesale/products/product_user_119_1773155771297_48b05e13102c.jpg"]	{}	1	t	sneaker-uomo-sportivo-tecnico-347	0
348	119	Sneaker Uomo Casual Beige	Sneaker dallo stile minimal con tonalità neutre che si abbinano facilmente a qualsiasi outfit. La suola leggera e il design semplice offrono comfort e versatilità per l’uso quotidiano.\n\nPerfetta per look casual e urbani.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773155834/templesale/products/product_user_119_1773155834044_03f71d93d4aa.jpg	2026-03-10 15:17:51.784225	41.590091	12.523384	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773155834/templesale/products/product_user_119_1773155834044_03f71d93d4aa.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155840/templesale/products/product_user_119_1773155839961_79f33a9f0644.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590091	12.523384	Sneaker Uomo Casual Beige	https://res.cloudinary.com/dymox62b9/image/upload/v1773155834/templesale/products/product_user_119_1773155834044_03f71d93d4aa.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773155834/templesale/products/product_user_119_1773155834044_03f71d93d4aa.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155840/templesale/products/product_user_119_1773155839961_79f33a9f0644.jpg"]	{}	1	t	sneaker-uomo-casual-beige-348	0
349	119	Sneaker Uomo Running Moderno	Sneaker dal design sportivo con dettagli dinamici e suola ammortizzata che garantisce comfort e stabilità durante la camminata. Lo stile moderno rende questa scarpa perfetta per chi cerca praticità senza rinunciare al look.\n\nIdeale per attività quotidiane e tempo libero.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773155895/templesale/products/product_user_119_1773155894978_bd52be5a1afd.jpg	2026-03-10 15:19:08.234654	41.589802	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773155895/templesale/products/product_user_119_1773155894978_bd52be5a1afd.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155910/templesale/products/product_user_119_1773155909547_e943d5f601fb.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589802	12.523298	Sneaker Uomo Running Moderno	https://res.cloudinary.com/dymox62b9/image/upload/v1773155895/templesale/products/product_user_119_1773155894978_bd52be5a1afd.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773155895/templesale/products/product_user_119_1773155894978_bd52be5a1afd.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155910/templesale/products/product_user_119_1773155909547_e943d5f601fb.jpg"]	{}	1	t	sneaker-uomo-running-moderno-349	0
362	119	Profumo Uomo Top Town	Fragranza elegante con carattere deciso e sofisticato. Il profumo unisce note aromatiche e calde creando una composizione intensa e duratura. Ideale per chi cerca un profumo distintivo e moderno.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773157755/templesale/products/product_user_119_1773157755451_c9b51a74b6f6.jpg	2026-03-10 15:49:16.699443	41.589962	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157755/templesale/products/product_user_119_1773157755451_c9b51a74b6f6.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589962	12.52317	Profumo Uomo Top Town	https://res.cloudinary.com/dymox62b9/image/upload/v1773157755/templesale/products/product_user_119_1773157755451_c9b51a74b6f6.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157755/templesale/products/product_user_119_1773157755451_c9b51a74b6f6.jpg"]	{}	1	t	profumo-uomo-top-town-362	0
351	119	Sneaker Uomo Sportivo Rosso	Sneaker leggera dal design sportivo con tessuto traspirante che garantisce comfort durante tutta la giornata. La suola flessibile offre una buona stabilità e una camminata comoda.\nIdeale per attività quotidiane e look casual dinamici.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773156183/templesale/products/product_user_119_1773156182729_d1b401d118d8.jpg	2026-03-10 15:24:05.768577	41.589994	12.523212	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156183/templesale/products/product_user_119_1773156182729_d1b401d118d8.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156189/templesale/products/product_user_119_1773156188201_92b21e1c1861.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589994	12.523212	Sneaker Uomo Sportivo Rosso	https://res.cloudinary.com/dymox62b9/image/upload/v1773156183/templesale/products/product_user_119_1773156182729_d1b401d118d8.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156183/templesale/products/product_user_119_1773156182729_d1b401d118d8.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156189/templesale/products/product_user_119_1773156188201_92b21e1c1861.jpg"]	{"color":"Roso "}	1	t	sneaker-uomo-sportivo-rosso-351	0
352	119	Sneaker Uomo Casual Beige	Sneaker dallo stile moderno con combinazione di materiali e inserti che donano un look urbano elegante. La suola resistente e la struttura leggera assicurano comfort e praticità.\nPerfetta per outfit casual e utilizzo quotidiano.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773156263/templesale/products/product_user_119_1773156262826_1079cc4a26ce.jpg	2026-03-10 15:25:07.047909	41.589802	12.52347	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156263/templesale/products/product_user_119_1773156262826_1079cc4a26ce.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156268/templesale/products/product_user_119_1773156267956_a4d17db39d94.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589802	12.52347	Sneaker Uomo Casual Beige	https://res.cloudinary.com/dymox62b9/image/upload/v1773156263/templesale/products/product_user_119_1773156262826_1079cc4a26ce.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156263/templesale/products/product_user_119_1773156262826_1079cc4a26ce.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156268/templesale/products/product_user_119_1773156267956_a4d17db39d94.jpg"]	{}	1	t	sneaker-uomo-casual-beige-352	0
353	119	Sneaker Uomo Sportivo Nero	Sneaker sportiva con struttura traspirante e design moderno. La suola ammortizzata garantisce comfort durante la camminata mentre il look minimal si abbina facilmente a qualsiasi outfit.\nIdeale per uso quotidiano e tempo libero.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773156326/templesale/products/product_user_119_1773156325555_3cb7667a871a.jpg	2026-03-10 15:26:12.631687	41.589866	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156326/templesale/products/product_user_119_1773156325555_3cb7667a871a.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156331/templesale/products/product_user_119_1773156330522_d0700a30fcd7.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589866	12.523298	Sneaker Uomo Sportivo Nero	https://res.cloudinary.com/dymox62b9/image/upload/v1773156326/templesale/products/product_user_119_1773156325555_3cb7667a871a.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156326/templesale/products/product_user_119_1773156325555_3cb7667a871a.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156331/templesale/products/product_user_119_1773156330522_d0700a30fcd7.jpg"]	{"color":"Nero"}	1	t	sneaker-uomo-sportivo-nero-353	0
354	119	Sneaker Uomo Running Grigio	Scarpa sportiva dal design dinamico con materiali leggeri e traspiranti. La suola robusta offre stabilità e supporto durante l’attività quotidiana.\nPerfetta per uno stile casual e sportivo.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773156404/templesale/products/product_user_119_1773156403735_5ddaa73ce0b6.jpg	2026-03-10 15:27:33.441573	41.590797	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156404/templesale/products/product_user_119_1773156403735_5ddaa73ce0b6.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156410/templesale/products/product_user_119_1773156409280_5b90b6e082db.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590797	12.523298	Sneaker Uomo Running Grigio	https://res.cloudinary.com/dymox62b9/image/upload/v1773156404/templesale/products/product_user_119_1773156403735_5ddaa73ce0b6.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156404/templesale/products/product_user_119_1773156403735_5ddaa73ce0b6.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156410/templesale/products/product_user_119_1773156409280_5b90b6e082db.jpg"]	{}	1	t	sneaker-uomo-running-grigio-354	0
355	119	Sneaker Uomo Classico con Velcro	Scarpa dal design classico con chiusura a strappo che garantisce praticità e comfort. La struttura resistente e la suola stabile rendono questa sneaker ideale per l’uso quotidiano.\nPerfetta per chi cerca comodità e semplicità nello stile.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773156480/templesale/products/product_user_119_1773156479852_2553d42170b9.jpg	2026-03-10 15:28:39.369446	41.590283	12.523384	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156480/templesale/products/product_user_119_1773156479852_2553d42170b9.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156485/templesale/products/product_user_119_1773156484462_518187b5551d.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590283	12.523384	Sneaker Uomo Classico con Velcro	https://res.cloudinary.com/dymox62b9/image/upload/v1773156480/templesale/products/product_user_119_1773156479852_2553d42170b9.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156480/templesale/products/product_user_119_1773156479852_2553d42170b9.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156485/templesale/products/product_user_119_1773156484462_518187b5551d.jpg"]	{}	1	t	sneaker-uomo-classico-con-velcro-355	0
356	119	Nuova Collezione Sneaker Casual e Sportive	Scopri la nuova selezione di sneaker pensate per unire comfort, stile e personalità. Modelli sportivi, casual ed eleganti con dettagli moderni, materiali traspiranti e suole confortevoli ideali per l’uso quotidiano.\nPerfette per completare qualsiasi outfit, dalla giornata dinamica al look urbano più raffinato.\n\nColori e modelli disponibili:\n• Nero sportivo\n• Bianco con dettagli leopardati\n• Beige elegante\n• Grigio con inserti decorativi\n• Verde con dettagli oro\n\nDisponibili diverse taglie.\nVieni a provarle in negozio.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773156695/templesale/products/product_user_119_1773156694860_1de36ff97fae.jpg	2026-03-10 15:32:57.174487	41.589802	12.523427	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156695/templesale/products/product_user_119_1773156694860_1de36ff97fae.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156702/templesale/products/product_user_119_1773156701776_3550752b153b.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156709/templesale/products/product_user_119_1773156708484_09f534dd4c86.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156715/templesale/products/product_user_119_1773156714807_672c97970383.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156720/templesale/products/product_user_119_1773156719897_609de0b2ab81.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156726/templesale/products/product_user_119_1773156725670_15cf7f5e856d.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156731/templesale/products/product_user_119_1773156731093_96fbadd17c1a.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156738/templesale/products/product_user_119_1773156737330_5a8b6b7c79c9.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156742/templesale/products/product_user_119_1773156742380_cfbc9269b7e4.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156747/templesale/products/product_user_119_1773156747255_6e47370e755a.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589802	12.523427	Nuova Collezione Sneaker Casual e Sportive	https://res.cloudinary.com/dymox62b9/image/upload/v1773156695/templesale/products/product_user_119_1773156694860_1de36ff97fae.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156695/templesale/products/product_user_119_1773156694860_1de36ff97fae.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156702/templesale/products/product_user_119_1773156701776_3550752b153b.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156709/templesale/products/product_user_119_1773156708484_09f534dd4c86.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156715/templesale/products/product_user_119_1773156714807_672c97970383.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156720/templesale/products/product_user_119_1773156719897_609de0b2ab81.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156726/templesale/products/product_user_119_1773156725670_15cf7f5e856d.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156731/templesale/products/product_user_119_1773156731093_96fbadd17c1a.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156738/templesale/products/product_user_119_1773156737330_5a8b6b7c79c9.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156742/templesale/products/product_user_119_1773156742380_cfbc9269b7e4.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156747/templesale/products/product_user_119_1773156747255_6e47370e755a.jpg"]	{}	1	t	nuova-collezione-sneaker-casual-e-sportive-356	0
358	119	Nuova Collezione Sneaker Casual e Sportive	Scopri la nuova selezione di sneaker pensate per unire comfort, stile e personalità. Modelli sportivi, casual ed eleganti con dettagli moderni, materiali traspiranti e suole confortevoli ideali per l’uso quotidiano.\nPerfette per completare qualsiasi outfit, dalla giornata dinamica al look urbano più raffinato.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773156919/templesale/products/product_user_119_1773156918792_88cba7eaac9a.jpg	2026-03-10 15:36:39.549158	41.589962	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156919/templesale/products/product_user_119_1773156918792_88cba7eaac9a.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156925/templesale/products/product_user_119_1773156924234_c1272748d0b3.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156930/templesale/products/product_user_119_1773156930231_410769d6c91a.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589962	12.52317	Nuova Collezione Sneaker Casual e Sportive	https://res.cloudinary.com/dymox62b9/image/upload/v1773156919/templesale/products/product_user_119_1773156918792_88cba7eaac9a.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156919/templesale/products/product_user_119_1773156918792_88cba7eaac9a.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156925/templesale/products/product_user_119_1773156924234_c1272748d0b3.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156930/templesale/products/product_user_119_1773156930231_410769d6c91a.jpg"]	{}	1	t	nuova-collezione-sneaker-casual-e-sportive-358	1
363	119	Profumo Donna Jasmine	Fragranza delicata e femminile con il profumo raffinato del gelsomino. Una composizione floreale elegante che dona freschezza e leggerezza durante tutta la giornata. Perfetto per uno stile romantico e sofisticato.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773157758/templesale/products/product_user_119_1773157757733_460b0cf04a4f.jpg	2026-03-10 15:49:19.085365	41.589962	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157758/templesale/products/product_user_119_1773157757733_460b0cf04a4f.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589962	12.52317	Profumo Donna Jasmine	https://res.cloudinary.com/dymox62b9/image/upload/v1773157758/templesale/products/product_user_119_1773157757733_460b0cf04a4f.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157758/templesale/products/product_user_119_1773157757733_460b0cf04a4f.jpg"]	{}	1	t	profumo-donna-jasmine-363	0
364	119	Profumo Aswad Bourbon	Fragranza intensa e avvolgente con note calde e profonde. Il profumo crea una presenza elegante e misteriosa, ideale per chi ama profumi ricchi e persistenti. Perfetto per serate e occasioni speciali.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773157760/templesale/products/product_user_119_1773157760208_d6d8e1620abf.jpg	2026-03-10 15:49:21.495865	41.589962	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157760/templesale/products/product_user_119_1773157760208_d6d8e1620abf.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589962	12.52317	Profumo Aswad Bourbon	https://res.cloudinary.com/dymox62b9/image/upload/v1773157760/templesale/products/product_user_119_1773157760208_d6d8e1620abf.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157760/templesale/products/product_user_119_1773157760208_d6d8e1620abf.jpg"]	{}	1	t	profumo-aswad-bourbon-364	0
365	119	Profumo Jazbaat Al Layl	Fragranza orientale dal carattere forte e sofisticato. Le note aromatiche e speziate creano un profumo ricco e affascinante, perfetto per chi cerca una presenza intensa e distintiva.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773157762/templesale/products/product_user_119_1773157762644_0b2156daf597.jpg	2026-03-10 15:49:23.975941	41.589962	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157762/templesale/products/product_user_119_1773157762644_0b2156daf597.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589962	12.52317	Profumo Jazbaat Al Layl	https://res.cloudinary.com/dymox62b9/image/upload/v1773157762/templesale/products/product_user_119_1773157762644_0b2156daf597.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157762/templesale/products/product_user_119_1773157762644_0b2156daf597.jpg"]	{}	1	t	profumo-jazbaat-al-layl-365	0
366	119	Profumo Tohfa Eau de Parfum	Fragranza elegante con note orientali e calde che creano una composizione ricca e raffinata. Il profumo offre una lunga durata ed è ideale per chi ama profumi intensi e sofisticati.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773157765/templesale/products/product_user_119_1773157765169_367e436c412b.jpg	2026-03-10 15:49:26.59735	41.589962	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157765/templesale/products/product_user_119_1773157765169_367e436c412b.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589962	12.52317	Profumo Tohfa Eau de Parfum	https://res.cloudinary.com/dymox62b9/image/upload/v1773157765/templesale/products/product_user_119_1773157765169_367e436c412b.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157765/templesale/products/product_user_119_1773157765169_367e436c412b.jpg"]	{}	1	t	profumo-tohfa-eau-de-parfum-366	0
367	119	Profumo Oud Model Crest	Fragranza orientale di carattere con il classico aroma dell’oud. Il profumo combina note profonde e calde creando una presenza elegante e persistente. Perfetto per chi ama profumi intensi e di forte personalità.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773157768/templesale/products/product_user_119_1773157767891_0d7b8667b841.jpg	2026-03-10 15:49:29.70136	41.589962	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157768/templesale/products/product_user_119_1773157767891_0d7b8667b841.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589962	12.52317	Profumo Oud Model Crest	https://res.cloudinary.com/dymox62b9/image/upload/v1773157768/templesale/products/product_user_119_1773157767891_0d7b8667b841.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157768/templesale/products/product_user_119_1773157767891_0d7b8667b841.jpg"]	{}	1	t	profumo-oud-model-crest-367	0
369	119	Profumo Donna Missy Girl Silver	Fragranza femminile moderna con un aroma fresco e delicato. Il profumo offre una combinazione elegante di note leggere e floreali, perfetto per l’uso quotidiano e per uno stile giovane e raffinato.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773158892/templesale/products/product_user_119_1773158892559_2330a1484fad.jpg	2026-03-10 16:08:14.458944	41.589834	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773158892/templesale/products/product_user_119_1773158892559_2330a1484fad.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589834	12.52317	Profumo Donna Missy Girl Silver	https://res.cloudinary.com/dymox62b9/image/upload/v1773158892/templesale/products/product_user_119_1773158892559_2330a1484fad.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773158892/templesale/products/product_user_119_1773158892559_2330a1484fad.jpg"]	{}	1	t	profumo-donna-missy-girl-silver-369	0
370	119	Profumo Ante Hayati	Fragranza orientale ricca e avvolgente con note calde e profonde. Il profumo crea una presenza intensa e sofisticata, ideale per chi ama profumi persistenti e di grande personalità.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773158896/templesale/products/product_user_119_1773158896279_137420fa7e2a.jpg	2026-03-10 16:08:18.754324	41.589834	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773158896/templesale/products/product_user_119_1773158896279_137420fa7e2a.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589834	12.52317	Profumo Ante Hayati	https://res.cloudinary.com/dymox62b9/image/upload/v1773158896/templesale/products/product_user_119_1773158896279_137420fa7e2a.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773158896/templesale/products/product_user_119_1773158896279_137420fa7e2a.jpg"]	{}	1	t	profumo-ante-hayati-370	0
372	119	Profumo Donna A Shoe Story Pink Blush	Fragranza femminile dolce e romantica con note floreali e fruttate. Il profumo è delicato ma persistente, ideale per chi ama uno stile elegante e femminile.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773158902/templesale/products/product_user_119_1773158902442_46b9c4cb6c9e.jpg	2026-03-10 16:08:23.747337	41.589834	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773158902/templesale/products/product_user_119_1773158902442_46b9c4cb6c9e.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589834	12.52317	Profumo Donna A Shoe Story Pink Blush	https://res.cloudinary.com/dymox62b9/image/upload/v1773158902/templesale/products/product_user_119_1773158902442_46b9c4cb6c9e.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773158902/templesale/products/product_user_119_1773158902442_46b9c4cb6c9e.jpg"]	{}	1	t	profumo-donna-a-shoe-story-pink-blush-372	1
374	119	Profumo Conclude Oud Orient Perfection	Fragranza orientale intensa con note profonde di oud e spezie. Il profumo offre una presenza forte e sofisticata, ideale per chi ama profumi caldi e molto persistenti.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773158909/templesale/products/product_user_119_1773158909105_0b47c6370c5d.jpg	2026-03-10 16:08:30.89437	41.589834	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773158909/templesale/products/product_user_119_1773158909105_0b47c6370c5d.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589834	12.52317	Profumo Conclude Oud Orient Perfection	https://res.cloudinary.com/dymox62b9/image/upload/v1773158909/templesale/products/product_user_119_1773158909105_0b47c6370c5d.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773158909/templesale/products/product_user_119_1773158909105_0b47c6370c5d.jpg"]	{}	1	t	profumo-conclude-oud-orient-perfection-374	2
368	119	Profumo Miran Eau de Parfum	Fragranza orientale intensa con carattere elegante e misterioso. Il profumo combina note calde e aromatiche creando una presenza raffinata e duratura. Ideale per chi cerca un profumo distintivo e sofisticato.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773158888/templesale/products/product_user_119_1773158887568_834a282d643f.jpg	2026-03-10 16:08:11.203347	41.589834	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773158888/templesale/products/product_user_119_1773158887568_834a282d643f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773158889/templesale/products/product_user_119_1773158889667_301a0a06f4e3.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589834	12.52317	Profumo Miran Eau de Parfum	https://res.cloudinary.com/dymox62b9/image/upload/v1773158888/templesale/products/product_user_119_1773158887568_834a282d643f.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773158888/templesale/products/product_user_119_1773158887568_834a282d643f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773158889/templesale/products/product_user_119_1773158889667_301a0a06f4e3.jpg"]	{}	1	t	profumo-miran-eau-de-parfum-368	0
371	119	Profumo Ameer Al Oud Original	Fragranza orientale di grande carattere con l’aroma tipico dell’oud. Il profumo è intenso, caldo e molto persistente, perfetto per chi cerca una fragranza elegante e potente.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773158900/templesale/products/product_user_119_1773158899813_1d39ce538be9.jpg	2026-03-10 16:08:21.253372	41.589834	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773158900/templesale/products/product_user_119_1773158899813_1d39ce538be9.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589834	12.52317	Profumo Ameer Al Oud Original	https://res.cloudinary.com/dymox62b9/image/upload/v1773158900/templesale/products/product_user_119_1773158899813_1d39ce538be9.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773158900/templesale/products/product_user_119_1773158899813_1d39ce538be9.jpg"]	{}	1	t	profumo-ameer-al-oud-original-371	0
373	119	Profumo Donna Coeur Pure	Fragranza raffinata e luminosa con una composizione elegante e delicata. Il profumo combina note morbide e floreali creando una sensazione di freschezza e femminilità.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773158905/templesale/products/product_user_119_1773158905316_167dea5f3f57.jpg	2026-03-10 16:08:27.17502	41.589834	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773158905/templesale/products/product_user_119_1773158905316_167dea5f3f57.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589834	12.52317	Profumo Donna Coeur Pure	https://res.cloudinary.com/dymox62b9/image/upload/v1773158905/templesale/products/product_user_119_1773158905316_167dea5f3f57.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773158905/templesale/products/product_user_119_1773158905316_167dea5f3f57.jpg"]	{}	1	t	profumo-donna-coeur-pure-373	0
397	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773161176/templesale/products/product_user_119_1773161176001_3e05869ba69f.jpg	2026-03-10 16:46:40.676099	41.590315	12.523384	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773161176/templesale/products/product_user_119_1773161176001_3e05869ba69f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161183/templesale/products/product_user_119_1773161182998_8b8ce19f3b34.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590315	12.523384	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773161176/templesale/products/product_user_119_1773161176001_3e05869ba69f.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773161176/templesale/products/product_user_119_1773161176001_3e05869ba69f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161183/templesale/products/product_user_119_1773161182998_8b8ce19f3b34.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-397	1
377	119	Collezione Cappelli e Cappellini	Scopri la nostra selezione di cappelli e cappellini con diversi modelli e stili, perfetti per completare qualsiasi outfit. Disponibili versioni sportive, casual e moderne, ideali per uomo e donna.\n\nRealizzati con materiali resistenti e confortevoli, offrono una vestibilità comoda per l’uso quotidiano. Perfetti per tempo libero, sport o per aggiungere un tocco di stile al tuo look. Disponibili in diversi colori e design.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773159596/templesale/products/product_user_119_1773159596217_eecf54ebe531.jpg	2026-03-10 16:21:10.320371	41.589962	12.523041	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773159596/templesale/products/product_user_119_1773159596217_eecf54ebe531.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773159603/templesale/products/product_user_119_1773159602616_ddb8ba3e2a6d.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773159608/templesale/products/product_user_119_1773159607933_7b01c665aba1.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589962	12.523041	Collezione Cappelli e Cappellini	https://res.cloudinary.com/dymox62b9/image/upload/v1773159596/templesale/products/product_user_119_1773159596217_eecf54ebe531.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773159596/templesale/products/product_user_119_1773159596217_eecf54ebe531.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773159603/templesale/products/product_user_119_1773159602616_ddb8ba3e2a6d.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773159608/templesale/products/product_user_119_1773159607933_7b01c665aba1.jpg"]	{}	1	t	collezione-cappelli-e-cappellini-377	1
410	119	Statue decorative	Diversi statue decorative, in terracotta gesso	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773164809/templesale/products/product_user_119_1773164808620_d9c53e2bb57e.jpg	2026-03-10 17:46:58.153499	41.589994	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164809/templesale/products/product_user_119_1773164808620_d9c53e2bb57e.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164811/templesale/products/product_user_119_1773164811080_1ea181337def.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589994	12.523298	Statue decorative	https://res.cloudinary.com/dymox62b9/image/upload/v1773164809/templesale/products/product_user_119_1773164808620_d9c53e2bb57e.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164809/templesale/products/product_user_119_1773164808620_d9c53e2bb57e.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164811/templesale/products/product_user_119_1773164811080_1ea181337def.jpg"]	{}	1	t	statue-decorative-410	0
380	119	Faro Solare JORTAIL 100W IP66 per Esterno	Faro solare JORTAIL da 100W con protezione IP66, resistente a pioggia e agenti atmosferici. Completo di pannello solare, ricarica efficiente, alta luminosità e controllo timer tramite telecomando. Perfetto per cortili, parchi, fattorie, ingressi e altre aree esterne che richiedono illuminazione affidabile.	0.00	Ferramentas e Construção	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773677024/templesale/products/product_user_119_1773677024557_c78dca6c6727.avif	2026-03-10 16:25:03.221032	41.590283	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773677024/templesale/products/product_user_119_1773677024557_c78dca6c6727.avif","https://res.cloudinary.com/dymox62b9/image/upload/v1773159902/templesale/products/product_user_119_1773159901955_681f36f07ba8.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160001/templesale/products/product_user_119_1773160001163_0ed09e580e42.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590283	12.523298	Faro Solare JORTAIL 100W IP66 per Esterno	https://res.cloudinary.com/dymox62b9/image/upload/v1773677024/templesale/products/product_user_119_1773677024557_c78dca6c6727.avif	["https://res.cloudinary.com/dymox62b9/image/upload/v1773677024/templesale/products/product_user_119_1773677024557_c78dca6c6727.avif","https://res.cloudinary.com/dymox62b9/image/upload/v1773159902/templesale/products/product_user_119_1773159901955_681f36f07ba8.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160001/templesale/products/product_user_119_1773160001163_0ed09e580e42.jpg"]	{}	1	t	faro-solare-jortail-100w-ip66-per-esterno-380	18
382	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773160172/templesale/products/product_user_119_1773160171586_f14766e865b4.jpg	2026-03-10 16:31:29.253164	41.590412	12.523556	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160172/templesale/products/product_user_119_1773160171586_f14766e865b4.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160178/templesale/products/product_user_119_1773160177883_79174717a7b1.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160183/templesale/products/product_user_119_1773160183254_540eb915e50f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160190/templesale/products/product_user_119_1773160189569_b8edb01510a5.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590412	12.523556	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773160172/templesale/products/product_user_119_1773160171586_f14766e865b4.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160172/templesale/products/product_user_119_1773160171586_f14766e865b4.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160178/templesale/products/product_user_119_1773160177883_79174717a7b1.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160183/templesale/products/product_user_119_1773160183254_540eb915e50f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160190/templesale/products/product_user_119_1773160189569_b8edb01510a5.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-382	0
407	119	Tapete 1,60 x 2,30	1,60 per 2,30	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773164562/templesale/products/product_user_119_1773164561484_245504488043.jpg	2026-03-10 17:43:13.502205	41.59054	12.522783	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164562/templesale/products/product_user_119_1773164561484_245504488043.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.59054	12.522783	Tapete 1,60 x 2,30	https://res.cloudinary.com/dymox62b9/image/upload/v1773164562/templesale/products/product_user_119_1773164561484_245504488043.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164562/templesale/products/product_user_119_1773164561484_245504488043.jpg"]	{}	1	t	tapete-1-60-x-2-30-407	0
385	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773160449/templesale/products/product_user_119_1773160448841_2e7fd1a80e39.jpg	2026-03-10 16:35:09.527618	41.590476	12.523084	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160449/templesale/products/product_user_119_1773160448841_2e7fd1a80e39.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160455/templesale/products/product_user_119_1773160454557_269c42787626.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160460/templesale/products/product_user_119_1773160459830_ea1211e16f40.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160465/templesale/products/product_user_119_1773160464784_1f7c1fdf8509.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160470/templesale/products/product_user_119_1773160469830_d3fb9dd44e7c.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590476	12.523084	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773160449/templesale/products/product_user_119_1773160448841_2e7fd1a80e39.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160449/templesale/products/product_user_119_1773160448841_2e7fd1a80e39.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160455/templesale/products/product_user_119_1773160454557_269c42787626.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160460/templesale/products/product_user_119_1773160459830_ea1211e16f40.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160465/templesale/products/product_user_119_1773160464784_1f7c1fdf8509.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160470/templesale/products/product_user_119_1773160469830_d3fb9dd44e7c.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-385	0
387	119	Vaso Statue Decorative	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773160647/templesale/products/product_user_119_1773160646632_cb376f3771b9.jpg	2026-03-10 16:37:57.581889	41.590155	12.523556	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160647/templesale/products/product_user_119_1773160646632_cb376f3771b9.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160654/templesale/products/product_user_119_1773160653392_c6917e9c3d5f.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590155	12.523556	Vaso Statue Decorative	https://res.cloudinary.com/dymox62b9/image/upload/v1773160647/templesale/products/product_user_119_1773160646632_cb376f3771b9.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160647/templesale/products/product_user_119_1773160646632_cb376f3771b9.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160654/templesale/products/product_user_119_1773160653392_c6917e9c3d5f.jpg"]	{}	1	t	vaso-statue-decorative-387	0
389	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773160750/templesale/products/product_user_119_1773160750099_9eeb77058057.jpg	2026-03-10 16:39:31.35947	41.589834	12.523384	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160750/templesale/products/product_user_119_1773160750099_9eeb77058057.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160757/templesale/products/product_user_119_1773160756426_53692b3ca101.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589834	12.523384	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773160750/templesale/products/product_user_119_1773160750099_9eeb77058057.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160750/templesale/products/product_user_119_1773160750099_9eeb77058057.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160757/templesale/products/product_user_119_1773160756426_53692b3ca101.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-389	0
390	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773160793/templesale/products/product_user_119_1773160792438_f4eac30da505.jpg	2026-03-10 16:40:17.399827	41.590283	12.523427	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160793/templesale/products/product_user_119_1773160792438_f4eac30da505.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160798/templesale/products/product_user_119_1773160797961_757a5a80322f.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590283	12.523427	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773160793/templesale/products/product_user_119_1773160792438_f4eac30da505.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160793/templesale/products/product_user_119_1773160792438_f4eac30da505.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160798/templesale/products/product_user_119_1773160797961_757a5a80322f.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-390	0
391	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773160841/templesale/products/product_user_119_1773160840602_c0c1a390a775.jpg	2026-03-10 16:40:56.800282	41.590412	12.523556	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160841/templesale/products/product_user_119_1773160840602_c0c1a390a775.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160848/templesale/products/product_user_119_1773160847703_0b7f4a9ae670.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590412	12.523556	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773160841/templesale/products/product_user_119_1773160840602_c0c1a390a775.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160841/templesale/products/product_user_119_1773160840602_c0c1a390a775.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160848/templesale/products/product_user_119_1773160847703_0b7f4a9ae670.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-391	0
392	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773160877/templesale/products/product_user_119_1773160876544_7ab601f136eb.jpg	2026-03-10 16:41:47.62358	41.589835	12.52321	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160877/templesale/products/product_user_119_1773160876544_7ab601f136eb.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160883/templesale/products/product_user_119_1773160882854_4ba8a33dbefc.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160890/templesale/products/product_user_119_1773160889834_c0595a08b71f.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589835	12.52321	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773160877/templesale/products/product_user_119_1773160876544_7ab601f136eb.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160877/templesale/products/product_user_119_1773160876544_7ab601f136eb.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160883/templesale/products/product_user_119_1773160882854_4ba8a33dbefc.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160890/templesale/products/product_user_119_1773160889834_c0595a08b71f.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-392	0
395	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773161028/templesale/products/product_user_119_1773161027278_ec9920d365e1.jpg	2026-03-10 16:44:26.72913	41.590572	12.523427	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773161028/templesale/products/product_user_119_1773161027278_ec9920d365e1.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161036/templesale/products/product_user_119_1773161036072_37a010cc044b.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161044/templesale/products/product_user_119_1773161043363_2fce71f016df.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161051/templesale/products/product_user_119_1773161050380_e98fbad3a6cc.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590572	12.523427	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773161028/templesale/products/product_user_119_1773161027278_ec9920d365e1.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773161028/templesale/products/product_user_119_1773161027278_ec9920d365e1.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161036/templesale/products/product_user_119_1773161036072_37a010cc044b.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161044/templesale/products/product_user_119_1773161043363_2fce71f016df.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161051/templesale/products/product_user_119_1773161050380_e98fbad3a6cc.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-395	0
409	119	Statue decorative	Diversi statue decorative, in terracotta gesso	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773164785/templesale/products/product_user_119_1773164785271_b03066f0a03d.jpg	2026-03-10 17:46:38.978917	41.589994	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164785/templesale/products/product_user_119_1773164785271_b03066f0a03d.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164788/templesale/products/product_user_119_1773164788011_200a5c085ac9.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589994	12.523298	Statue decorative	https://res.cloudinary.com/dymox62b9/image/upload/v1773164785/templesale/products/product_user_119_1773164785271_b03066f0a03d.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164785/templesale/products/product_user_119_1773164785271_b03066f0a03d.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164788/templesale/products/product_user_119_1773164788011_200a5c085ac9.jpg"]	{}	1	t	statue-decorative-409	0
399	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773161310/templesale/products/product_user_119_1773161309977_c572dc185080.jpg	2026-03-10 16:48:47.523016	41.589706	12.523341	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773161310/templesale/products/product_user_119_1773161309977_c572dc185080.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161318/templesale/products/product_user_119_1773161317488_614256a5d673.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589706	12.523341	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773161310/templesale/products/product_user_119_1773161309977_c572dc185080.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773161310/templesale/products/product_user_119_1773161309977_c572dc185080.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161318/templesale/products/product_user_119_1773161317488_614256a5d673.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-399	1
376	119	Orologio Uomo Acciaio Gold Classico	Orologio da uomo con finitura dorata e bracciale in acciaio. Il design classico ed elegante lo rende ideale per eventi, lavoro o serate importanti. Un accessorio che esprime stile e personalità.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773159464/templesale/products/product_user_119_1773159463724_e2d05942e7d8.jpg	2026-03-10 16:18:43.097041	41.589994	12.523127	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773159464/templesale/products/product_user_119_1773159463724_e2d05942e7d8.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773159471/templesale/products/product_user_119_1773159470315_e5e323a40200.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773159477/templesale/products/product_user_119_1773159475823_02b1ef73a33e.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773159482/templesale/products/product_user_119_1773159482059_d1d385544b23.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589994	12.523127	Orologio Uomo Acciaio Gold Classico	https://res.cloudinary.com/dymox62b9/image/upload/v1773159464/templesale/products/product_user_119_1773159463724_e2d05942e7d8.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773159464/templesale/products/product_user_119_1773159463724_e2d05942e7d8.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773159471/templesale/products/product_user_119_1773159470315_e5e323a40200.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773159477/templesale/products/product_user_119_1773159475823_02b1ef73a33e.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773159482/templesale/products/product_user_119_1773159482059_d1d385544b23.jpg"]	{}	1	t	orologio-uomo-acciaio-gold-classico-376	1
401	119	Fontanella Statue Decorative	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773161422/templesale/products/product_user_119_1773161421549_c25e823e9b56.jpg	2026-03-10 16:51:36.707367	41.589706	12.523341	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773161422/templesale/products/product_user_119_1773161421549_c25e823e9b56.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161431/templesale/products/product_user_119_1773161430090_6c1e2ad4aea7.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161439/templesale/products/product_user_119_1773161439083_c6a09967df55.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161447/templesale/products/product_user_119_1773161446527_eea2c741590b.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161455/templesale/products/product_user_119_1773161454286_1ec5c0206110.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589706	12.523341	Fontanella Statue Decorative	https://res.cloudinary.com/dymox62b9/image/upload/v1773161422/templesale/products/product_user_119_1773161421549_c25e823e9b56.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773161422/templesale/products/product_user_119_1773161421549_c25e823e9b56.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161431/templesale/products/product_user_119_1773161430090_6c1e2ad4aea7.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161439/templesale/products/product_user_119_1773161439083_c6a09967df55.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161447/templesale/products/product_user_119_1773161446527_eea2c741590b.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161455/templesale/products/product_user_119_1773161454286_1ec5c0206110.jpg"]	{}	1	t	fontanella-statue-decorative-401	0
342	119	Zaino Donna Elegante	Zaino da donna con design moderno e raffinato, perfetto per l’uso quotidiano. Dotato di scomparti con chiusura a zip che permettono di organizzare facilmente oggetti personali come telefono, portafoglio e accessori.\n\nLeggero e pratico, combina funzionalità e stile, rendendolo ideale per lavoro, viaggio o tempo libero.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773154609/templesale/products/product_user_119_1773154608446_358c2530a131.jpg	2026-03-10 15:00:51.808027	41.589898	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773154609/templesale/products/product_user_119_1773154608446_358c2530a131.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154616/templesale/products/product_user_119_1773154615692_ad20f74fe925.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154623/templesale/products/product_user_119_1773154622831_5213fb6cad0f.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589898	12.523298	Zaino Donna Elegante	https://res.cloudinary.com/dymox62b9/image/upload/v1773154609/templesale/products/product_user_119_1773154608446_358c2530a131.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773154609/templesale/products/product_user_119_1773154608446_358c2530a131.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154616/templesale/products/product_user_119_1773154615692_ad20f74fe925.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154623/templesale/products/product_user_119_1773154622831_5213fb6cad0f.jpg"]	{}	1	t	zaino-donna-elegante-342	1
404	119	Tapete 2,00 per 3,00	2,00 per 3,00	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773164207/templesale/products/product_user_119_1773164204491_721e151927f2.jpg	2026-03-10 17:37:19.082349	41.59054	12.522783	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164207/templesale/products/product_user_119_1773164204491_721e151927f2.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164213/templesale/products/product_user_119_1773164213401_c9c2e13d8ff2.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.59054	12.522783	Tapete 2,00 per 3,00	https://res.cloudinary.com/dymox62b9/image/upload/v1773164207/templesale/products/product_user_119_1773164204491_721e151927f2.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164207/templesale/products/product_user_119_1773164204491_721e151927f2.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164213/templesale/products/product_user_119_1773164213401_c9c2e13d8ff2.jpg"]	{}	1	t	tapete-2-00-per-3-00-404	1
405	119	Tapete	2,00 x 3,00 metri	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773164251/templesale/products/product_user_119_1773164250375_c140ffa37aa3.jpg	2026-03-10 17:38:39.405736	41.59054	12.522783	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164251/templesale/products/product_user_119_1773164250375_c140ffa37aa3.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164256/templesale/products/product_user_119_1773164253722_ccef37623e6c.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.59054	12.522783	Tapete	https://res.cloudinary.com/dymox62b9/image/upload/v1773164251/templesale/products/product_user_119_1773164250375_c140ffa37aa3.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164251/templesale/products/product_user_119_1773164250375_c140ffa37aa3.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164256/templesale/products/product_user_119_1773164253722_ccef37623e6c.jpg"]	{}	1	t	tapete-405	0
406	119	Statue	Le statue decorative, terracotta e gesso	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773164478/templesale/products/product_user_119_1773164477363_07040ddb3510.jpg	2026-03-10 17:41:49.415717	41.59054	12.522783	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164478/templesale/products/product_user_119_1773164477363_07040ddb3510.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164484/templesale/products/product_user_119_1773164483439_851193589293.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.59054	12.522783	Statue	https://res.cloudinary.com/dymox62b9/image/upload/v1773164478/templesale/products/product_user_119_1773164477363_07040ddb3510.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164478/templesale/products/product_user_119_1773164477363_07040ddb3510.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164484/templesale/products/product_user_119_1773164483439_851193589293.jpg"]	{}	1	t	statue-406	0
403	119	Tapete	1,60 per 2,00	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773164089/templesale/products/product_user_119_1773164088476_13fbed2e3d4e.jpg	2026-03-10 17:35:46.896199	41.59054	12.522783	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164089/templesale/products/product_user_119_1773164088476_13fbed2e3d4e.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164093/templesale/products/product_user_119_1773164093245_963587d6528a.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.59054	12.522783	Tapete	https://res.cloudinary.com/dymox62b9/image/upload/v1773164089/templesale/products/product_user_119_1773164088476_13fbed2e3d4e.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164089/templesale/products/product_user_119_1773164088476_13fbed2e3d4e.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164093/templesale/products/product_user_119_1773164093245_963587d6528a.jpg"]	{}	1	t	tapete-403	1
414	119	Spray Vernice RAL – Vari Colori	Lotto di bombolette spray di vernice con vari colori RAL. Ideali per lavori di verniciatura, fai-da-te, ritocchi su metallo, legno o plastica.\n\nColori visibili:\n\t•\tBlu traffico RAL 5017\n\t•\tBlu chiaro RAL 5012\n\t•\tRosa RAL 3015\n\t•\tLilla blu RAL 4005\n\t•\tGrigio traffico RAL 7042\n\t•\tTrasparente opaco\n\t•\tFluorescente arancio\n\nAdatte per lavori di restauro, bricolage e verniciatura rapida.\n\nVernici e materiali	0.00	Ferramentas e Construção	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1774971972/templesale/products/product_user_119_1774971971652_336c9f75e0bf.jpg	2026-03-10 17:55:22.529176	41.589994	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1774971972/templesale/products/product_user_119_1774971971652_336c9f75e0bf.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1774971974/templesale/products/product_user_119_1774971974158_f37491d4aa2d.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773165238/templesale/products/product_user_119_1773165238164_b0fb24ddd5da.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773165240/templesale/products/product_user_119_1773165240062_f4ed0ad05f6f.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589994	12.523298	Spray Vernice RAL – Vari Colori	https://res.cloudinary.com/dymox62b9/image/upload/v1774971972/templesale/products/product_user_119_1774971971652_336c9f75e0bf.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1774971972/templesale/products/product_user_119_1774971971652_336c9f75e0bf.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1774971974/templesale/products/product_user_119_1774971974158_f37491d4aa2d.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773165238/templesale/products/product_user_119_1773165238164_b0fb24ddd5da.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773165240/templesale/products/product_user_119_1773165240062_f4ed0ad05f6f.jpg"]	{}	1	t	spray-vernice-ral-vari-colori-414	4
411	119	Statue decorative	Diversi statue decorative, in terracotta gesso	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773164829/templesale/products/product_user_119_1773164828998_49473af540ff.jpg	2026-03-10 17:47:25.85654	41.589994	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164829/templesale/products/product_user_119_1773164828998_49473af540ff.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164832/templesale/products/product_user_119_1773164831994_38e1efbbd9d5.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589994	12.523298	Statue decorative	https://res.cloudinary.com/dymox62b9/image/upload/v1773164829/templesale/products/product_user_119_1773164828998_49473af540ff.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773164829/templesale/products/product_user_119_1773164828998_49473af540ff.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164832/templesale/products/product_user_119_1773164831994_38e1efbbd9d5.jpg"]	{}	1	t	statue-decorative-411	0
378	119	Faro Solare LED FOYU FO-T2100 100W (210 LED)	Faro solare da esterno FOYU modello FO-T2100 con potenza 100W e 210 LED ad alta luminosità. Dotato di pannello solare separato, batteria da 15000 mAh, telecomando wireless e protezione IP67 contro acqua e polvere. Ideale per giardino, cortile, ingresso, garage e aree esterne dove serve luce potente e autonomia.	0.00	Ferramentas e Construção	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1774971507/templesale/products/product_user_119_1774971507705_5f6e7557c4a8.avif	2026-03-10 16:24:58.106423	41.589834	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1774971507/templesale/products/product_user_119_1774971507705_5f6e7557c4a8.avif","https://res.cloudinary.com/dymox62b9/image/upload/v1774971491/templesale/products/product_user_119_1774971490769_b8d8118535e4.avif","https://res.cloudinary.com/dymox62b9/image/upload/v1773159897/templesale/products/product_user_119_1773159896665_b56c5f1a6c77.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589834	12.52317	Faro Solare LED FOYU FO-T2100 100W (210 LED)	https://res.cloudinary.com/dymox62b9/image/upload/v1774971507/templesale/products/product_user_119_1774971507705_5f6e7557c4a8.avif	["https://res.cloudinary.com/dymox62b9/image/upload/v1774971507/templesale/products/product_user_119_1774971507705_5f6e7557c4a8.avif","https://res.cloudinary.com/dymox62b9/image/upload/v1774971491/templesale/products/product_user_119_1774971490769_b8d8118535e4.avif","https://res.cloudinary.com/dymox62b9/image/upload/v1773159897/templesale/products/product_user_119_1773159896665_b56c5f1a6c77.jpg"]	{}	1	t	faro-solare-led-foyu-fo-t2100-100w-210-led-378	11
335	119	Set di Pentole da Cucina con Coperchio in Vetro	Elegante set di pentole da cucina composto da più pezzi con design moderno e resistente. Le pentole sono dotate di rivestimento antiaderente che permette una cottura uniforme e facilita la pulizia dopo l’uso.\n\nI coperchi in vetro temperato consentono di controllare facilmente la cottura senza dover sollevare il coperchio. Le maniglie ergonomiche garantiscono una presa sicura e confortevole durante la preparazione dei cibi.\n\nIdeale per cucinare una grande varietà di piatti come pasta, carne, zuppe e verdure. Perfetto per uso quotidiano in cucina grazie alla combinazione di funzionalità, qualità e design elegante.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773152923/templesale/products/product_user_119_1773152922182_82fec325ee57.jpg	2026-03-10 14:30:45.679174	41.589778	12.523545	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773152923/templesale/products/product_user_119_1773152922182_82fec325ee57.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589778	12.523545	Set di Pentole da Cucina con Coperchio in Vetro	https://res.cloudinary.com/dymox62b9/image/upload/v1773152923/templesale/products/product_user_119_1773152922182_82fec325ee57.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773152923/templesale/products/product_user_119_1773152922182_82fec325ee57.jpg"]	{}	1	t	set-di-pentole-da-cucina-con-coperchio-in-vetro-335	1
345	119	Sneaker Uomo Sportivo Bianco	Sneaker dal design moderno con combinazione di materiali e dettagli colorati che donano uno stile dinamico e contemporaneo. La suola resistente garantisce comfort e stabilità durante tutta la giornata.\n\nPerfetta per outfit casual e sportivi, ideale per l’uso quotidiano.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773155607/templesale/products/product_user_119_1773155606720_2807cf386f87.jpg	2026-03-10 15:14:18.513881	41.589738	12.523642	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773155607/templesale/products/product_user_119_1773155606720_2807cf386f87.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155613/templesale/products/product_user_119_1773155612909_6c1f18f79807.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589738	12.523642	Sneaker Uomo Sportivo Bianco	https://res.cloudinary.com/dymox62b9/image/upload/v1773155607/templesale/products/product_user_119_1773155606720_2807cf386f87.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773155607/templesale/products/product_user_119_1773155606720_2807cf386f87.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155613/templesale/products/product_user_119_1773155612909_6c1f18f79807.jpg"]	{"color":"Bianco"}	1	t	sneaker-uomo-sportivo-bianco-345	0
418	119	Asciugacapelli Professionale Guanoming	Asciugacapelli professionale Guanoming RCT-3900 con potenza 2000W, progettato per un’asciugatura rapida e potente.\n\nCaratteristiche:\n\t•\tMotore ad alta potenza\n\t•\t2 bocchette strette incluse\n\t•\tFlusso d’aria forte\n\t•\tDesign ergonomico\n\nIdeale per uso domestico o professionale.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1774971851/templesale/products/product_user_119_1774971851283_8345e5b88ddc.jpg	2026-03-10 17:59:35.60918	41.589994	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1774971851/templesale/products/product_user_119_1774971851283_8345e5b88ddc.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773675745/templesale/products/product_user_119_1773675745083_7bfe4a1d0ff0.webp","https://res.cloudinary.com/dymox62b9/image/upload/v1773675746/templesale/products/product_user_119_1773675746242_7d73ad9cccb5.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773675760/templesale/products/product_user_119_1773675759737_7b8920cc525d.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589994	12.523298	Asciugacapelli Professionale Guanoming	https://res.cloudinary.com/dymox62b9/image/upload/v1774971851/templesale/products/product_user_119_1774971851283_8345e5b88ddc.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1774971851/templesale/products/product_user_119_1774971851283_8345e5b88ddc.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773675745/templesale/products/product_user_119_1773675745083_7bfe4a1d0ff0.webp","https://res.cloudinary.com/dymox62b9/image/upload/v1773675746/templesale/products/product_user_119_1773675746242_7d73ad9cccb5.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773675760/templesale/products/product_user_119_1773675759737_7b8920cc525d.jpg"]	{}	1	t	asciugacapelli-professionale-guanoming-418	1
336	119	Set Tazze 20 Pezzi	Elegante set di tazze composto da 20 pezzi in vetro di alta qualità, perfetto per servire caffè, tè o altre bevande calde. Il design raffinato con decorazioni dorate dona un tocco di stile e classe alla tavola.\n\nLe tazze sono realizzate con materiali resistenti e curate nei dettagli, ideali sia per l’uso quotidiano che per occasioni speciali. Set completo perfetto anche come idea regalo. Disponibile in versione bianca e nera.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773153277/templesale/products/product_user_119_1773153276334_abfff28a74ee.jpg	2026-03-10 14:36:04.571549	41.590733	12.523126	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773153277/templesale/products/product_user_119_1773153276334_abfff28a74ee.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773153282/templesale/products/product_user_119_1773153281475_5256ce28d414.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773153289/templesale/products/product_user_119_1773153288830_5d4846f2994f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773153295/templesale/products/product_user_119_1773153294752_072ab46ee7f8.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773153301/templesale/products/product_user_119_1773153300808_6c2d7f7a679d.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773153322/templesale/products/product_user_119_1773153321707_da59e6c7b3ce.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590733	12.523126	Set Tazze 20 Pezzi	https://res.cloudinary.com/dymox62b9/image/upload/v1773153277/templesale/products/product_user_119_1773153276334_abfff28a74ee.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773153277/templesale/products/product_user_119_1773153276334_abfff28a74ee.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773153282/templesale/products/product_user_119_1773153281475_5256ce28d414.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773153289/templesale/products/product_user_119_1773153288830_5d4846f2994f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773153295/templesale/products/product_user_119_1773153294752_072ab46ee7f8.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773153301/templesale/products/product_user_119_1773153300808_6c2d7f7a679d.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773153322/templesale/products/product_user_119_1773153321707_da59e6c7b3ce.jpg"]	{}	1	t	set-tazze-20-pezzi-336	0
340	119	Borsa Donna Sweet Years	Elegante borsa da donna con design moderno e stampa Sweet Years. Dotata di manici resistenti e tracolla regolabile per un utilizzo comodo sia a mano che a spalla.\n\nL’ampio spazio interno consente di organizzare facilmente oggetti personali come telefono, portafoglio e accessori. Perfetta per l’uso quotidiano con uno stile raffinato e contemporaneo.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773154413/templesale/products/product_user_119_1773154412952_804672a9096c.jpg	2026-03-10 14:54:28.733853	41.589962	12.523384	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773154413/templesale/products/product_user_119_1773154412952_804672a9096c.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154419/templesale/products/product_user_119_1773154418896_bcf998b4415b.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589962	12.523384	Borsa Donna Sweet Years	https://res.cloudinary.com/dymox62b9/image/upload/v1773154413/templesale/products/product_user_119_1773154412952_804672a9096c.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773154413/templesale/products/product_user_119_1773154412952_804672a9096c.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154419/templesale/products/product_user_119_1773154418896_bcf998b4415b.jpg"]	{"brand":"Sweet Years"}	1	t	borsa-donna-sweet-years-340	0
343	119	Sandali Donna con Tacco	Eleganti sandali da donna con tacco, perfetti per aggiungere stile e comfort al look quotidiano. Il design moderno con dettagli decorativi e fibbie eleganti dona un tocco raffinato e femminile.\n\nRealizzati con materiali resistenti e suola stabile, offrono comodità durante la camminata e una calzata confortevole. Ideali per primavera ed estate, perfetti sia per outfit casual che per occasioni più eleganti.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773154956/templesale/products/product_user_119_1773154955787_c2b346fa0b30.jpg	2026-03-10 15:04:51.604445	41.590347	12.523341	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773154956/templesale/products/product_user_119_1773154955787_c2b346fa0b30.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154962/templesale/products/product_user_119_1773154962026_271af96239e2.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154967/templesale/products/product_user_119_1773154967078_a793696ced75.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154972/templesale/products/product_user_119_1773154971975_cdbb3fe0562b.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154978/templesale/products/product_user_119_1773154977301_5989d9e96e32.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154984/templesale/products/product_user_119_1773154983524_c935ed6f0762.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154990/templesale/products/product_user_119_1773154989321_68b836ebe177.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154995/templesale/products/product_user_119_1773154994629_646460c0cacf.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155000/templesale/products/product_user_119_1773154999540_06217bf02c23.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590347	12.523341	Sandali Donna con Tacco	https://res.cloudinary.com/dymox62b9/image/upload/v1773154956/templesale/products/product_user_119_1773154955787_c2b346fa0b30.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773154956/templesale/products/product_user_119_1773154955787_c2b346fa0b30.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154962/templesale/products/product_user_119_1773154962026_271af96239e2.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154967/templesale/products/product_user_119_1773154967078_a793696ced75.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154972/templesale/products/product_user_119_1773154971975_cdbb3fe0562b.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154978/templesale/products/product_user_119_1773154977301_5989d9e96e32.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154984/templesale/products/product_user_119_1773154983524_c935ed6f0762.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154990/templesale/products/product_user_119_1773154989321_68b836ebe177.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154995/templesale/products/product_user_119_1773154994629_646460c0cacf.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773155000/templesale/products/product_user_119_1773154999540_06217bf02c23.jpg"]	{}	1	t	sandali-donna-con-tacco-343	0
350	119	Sneaker Uomo Sportivo Ammortizzato	Sneaker sportiva dal design moderno con struttura traspirante e suola ammortizzata che garantisce comfort e stabilità durante la camminata. Il sistema di supporto nella suola offre maggiore assorbimento degli impatti, rendendola ideale per l’uso quotidiano.\n\nDisponibile in diverse colorazioni per adattarsi facilmente a ogni stile, perfetta per outfit casual e sportivi.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773156051/templesale/products/product_user_119_1773156050654_aca5d5b8180f.jpg	2026-03-10 15:21:43.997815	41.590156	12.52321	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156051/templesale/products/product_user_119_1773156050654_aca5d5b8180f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156055/templesale/products/product_user_119_1773156055378_6b3847f3b2e6.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156060/templesale/products/product_user_119_1773156060297_9537a3367372.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156067/templesale/products/product_user_119_1773156066685_ded4b87a26aa.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156072/templesale/products/product_user_119_1773156071989_1fad2a5979ac.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590156	12.52321	Sneaker Uomo Sportivo Ammortizzato	https://res.cloudinary.com/dymox62b9/image/upload/v1773156051/templesale/products/product_user_119_1773156050654_aca5d5b8180f.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156051/templesale/products/product_user_119_1773156050654_aca5d5b8180f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156055/templesale/products/product_user_119_1773156055378_6b3847f3b2e6.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156060/templesale/products/product_user_119_1773156060297_9537a3367372.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156067/templesale/products/product_user_119_1773156066685_ded4b87a26aa.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156072/templesale/products/product_user_119_1773156071989_1fad2a5979ac.jpg"]	{}	1	t	sneaker-uomo-sportivo-ammortizzato-350	0
357	119	Sneaker Casual Uomo Beige	Sneaker dal design moderno con dettagli decorativi e inserti colorati che donano un look distintivo ed elegante. Realizzata con materiali leggeri e traspiranti, offre comfort durante tutta la giornata.\nLa suola resistente garantisce stabilità e una camminata confortevole, rendendola ideale per l’uso quotidiano e per uno stile casual raffinato.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773156819/templesale/products/product_user_119_1773156818113_1c5d6c4a78d0.jpg	2026-03-10 15:34:40.409949	41.590155	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156819/templesale/products/product_user_119_1773156818113_1c5d6c4a78d0.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156832/templesale/products/product_user_119_1773156831030_47d01995237d.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590155	12.523298	Sneaker Casual Uomo Beige	https://res.cloudinary.com/dymox62b9/image/upload/v1773156819/templesale/products/product_user_119_1773156818113_1c5d6c4a78d0.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773156819/templesale/products/product_user_119_1773156818113_1c5d6c4a78d0.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773156832/templesale/products/product_user_119_1773156831030_47d01995237d.jpg"]	{"color":"Bianco"}	1	t	sneaker-casual-uomo-beige-357	0
359	119	Profumo Uomo Freaking Fantastic	Fragranza maschile elegante e intensa pensata per chi ama distinguersi. Il profumo combina note aromatiche e calde che creano una presenza sofisticata e duratura. Perfetto per l’uso quotidiano o per occasioni speciali.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773157746/templesale/products/product_user_119_1773157745715_a5e270bde3ff.jpg	2026-03-10 15:49:07.200567	41.590091	12.523813	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157746/templesale/products/product_user_119_1773157745715_a5e270bde3ff.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590091	12.523813	Profumo Uomo Freaking Fantastic	https://res.cloudinary.com/dymox62b9/image/upload/v1773157746/templesale/products/product_user_119_1773157745715_a5e270bde3ff.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773157746/templesale/products/product_user_119_1773157745715_a5e270bde3ff.jpg"]	{}	1	t	profumo-uomo-freaking-fantastic-359	0
375	119	Orologio Uomo Acciaio Silver Elegante	Orologio da uomo con design moderno e bracciale in acciaio inox. Elegante e resistente, perfetto per l’uso quotidiano o per occasioni formali. Il quadrante raffinato dona uno stile sofisticato e professionale.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773159359/templesale/products/product_user_119_1773159358387_266388f5dda8.jpg	2026-03-10 16:17:28.74028	41.589866	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773159359/templesale/products/product_user_119_1773159358387_266388f5dda8.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773159364/templesale/products/product_user_119_1773159363653_fce043921f4e.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773159369/templesale/products/product_user_119_1773159368676_5574ddd39f1d.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589866	12.523298	Orologio Uomo Acciaio Silver Elegante	https://res.cloudinary.com/dymox62b9/image/upload/v1773159359/templesale/products/product_user_119_1773159358387_266388f5dda8.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773159359/templesale/products/product_user_119_1773159358387_266388f5dda8.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773159364/templesale/products/product_user_119_1773159363653_fce043921f4e.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773159369/templesale/products/product_user_119_1773159368676_5574ddd39f1d.jpg"]	{"brand":"Tutti"}	1	t	orologio-uomo-acciaio-silver-elegante-375	0
379	119	Faro Solare FOYU FO-55120 120W con Telecomando	Lampada solare FOYU modello FO-55120 da 120W, pensata per illuminazione esterna efficiente e a basso consumo. Include funzioni di controllo luce intelligente, timer, telecomando wireless e sensore di movimento (human body induction). Soluzione pratica per illuminare spazi esterni in modo automatico e sicuro.	0.00	Ferramentas e Construção	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1774971444/templesale/products/product_user_119_1774971444187_d4a3e1dea69c.jpg	2026-03-10 16:25:01.022565	41.589834	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1774971444/templesale/products/product_user_119_1774971444187_d4a3e1dea69c.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1774971445/templesale/products/product_user_119_1774971445686_5c09ff7e2891.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160055/templesale/products/product_user_119_1773160054690_4128af298031.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160061/templesale/products/product_user_119_1773160060845_2ca194eed039.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160067/templesale/products/product_user_119_1773160067016_30a1e3851b57.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160072/templesale/products/product_user_119_1773160071548_e821ef0c342c.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589834	12.52317	Faro Solare FOYU FO-55120 120W con Telecomando	https://res.cloudinary.com/dymox62b9/image/upload/v1774971444/templesale/products/product_user_119_1774971444187_d4a3e1dea69c.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1774971444/templesale/products/product_user_119_1774971444187_d4a3e1dea69c.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1774971445/templesale/products/product_user_119_1774971445686_5c09ff7e2891.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160055/templesale/products/product_user_119_1773160054690_4128af298031.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160061/templesale/products/product_user_119_1773160060845_2ca194eed039.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160067/templesale/products/product_user_119_1773160067016_30a1e3851b57.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160072/templesale/products/product_user_119_1773160071548_e821ef0c342c.jpg"]	{}	1	t	faro-solare-foyu-fo-55120-120w-con-telecomando-379	2
383	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773160314/templesale/products/product_user_119_1773160312974_0858e536504c.jpg	2026-03-10 16:32:33.123931	41.590412	12.523556	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160314/templesale/products/product_user_119_1773160312974_0858e536504c.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160320/templesale/products/product_user_119_1773160319550_09a949675441.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160325/templesale/products/product_user_119_1773160325259_aeca1ef19d55.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160331/templesale/products/product_user_119_1773160330593_ab41505a70f2.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160336/templesale/products/product_user_119_1773160336137_9cd45f4f35d0.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160341/templesale/products/product_user_119_1773160340985_004cb5679811.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590412	12.523556	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773160314/templesale/products/product_user_119_1773160312974_0858e536504c.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160314/templesale/products/product_user_119_1773160312974_0858e536504c.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160320/templesale/products/product_user_119_1773160319550_09a949675441.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160325/templesale/products/product_user_119_1773160325259_aeca1ef19d55.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160331/templesale/products/product_user_119_1773160330593_ab41505a70f2.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160336/templesale/products/product_user_119_1773160336137_9cd45f4f35d0.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160341/templesale/products/product_user_119_1773160340985_004cb5679811.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-383	0
384	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773160386/templesale/products/product_user_119_1773160385379_a5e08649dafc.jpg	2026-03-10 16:33:37.578856	41.590508	12.523427	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160386/templesale/products/product_user_119_1773160385379_a5e08649dafc.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160391/templesale/products/product_user_119_1773160390722_40d05fbd56a8.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160397/templesale/products/product_user_119_1773160396688_d5675fdc0b48.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160402/templesale/products/product_user_119_1773160401789_8922a05187b5.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590508	12.523427	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773160386/templesale/products/product_user_119_1773160385379_a5e08649dafc.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160386/templesale/products/product_user_119_1773160385379_a5e08649dafc.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160391/templesale/products/product_user_119_1773160390722_40d05fbd56a8.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160397/templesale/products/product_user_119_1773160396688_d5675fdc0b48.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160402/templesale/products/product_user_119_1773160401789_8922a05187b5.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-384	0
396	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773161095/templesale/products/product_user_119_1773161095086_058979364518.jpg	2026-03-10 16:45:38.35684	41.590412	12.52317	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773161095/templesale/products/product_user_119_1773161095086_058979364518.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161103/templesale/products/product_user_119_1773161102801_f43f7746e65f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161112/templesale/products/product_user_119_1773161110824_08330fb0d1d1.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161120/templesale/products/product_user_119_1773161119385_206a35afa680.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161126/templesale/products/product_user_119_1773161125785_007fe381827c.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590412	12.52317	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773161095/templesale/products/product_user_119_1773161095086_058979364518.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773161095/templesale/products/product_user_119_1773161095086_058979364518.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161103/templesale/products/product_user_119_1773161102801_f43f7746e65f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161112/templesale/products/product_user_119_1773161110824_08330fb0d1d1.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161120/templesale/products/product_user_119_1773161119385_206a35afa680.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161126/templesale/products/product_user_119_1773161125785_007fe381827c.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-396	1
386	119	Vaso Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773160560/templesale/products/product_user_119_1773160560050_c29cc5eb5048.jpg	2026-03-10 16:37:04.947451	41.589866	12.522912	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160560/templesale/products/product_user_119_1773160560050_c29cc5eb5048.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160567/templesale/products/product_user_119_1773160566417_cd22aa712753.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160574/templesale/products/product_user_119_1773160573318_d0cfbd3ab36a.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160579/templesale/products/product_user_119_1773160578705_4dd61a1aeed9.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589866	12.522912	Vaso Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773160560/templesale/products/product_user_119_1773160560050_c29cc5eb5048.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160560/templesale/products/product_user_119_1773160560050_c29cc5eb5048.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160567/templesale/products/product_user_119_1773160566417_cd22aa712753.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160574/templesale/products/product_user_119_1773160573318_d0cfbd3ab36a.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160579/templesale/products/product_user_119_1773160578705_4dd61a1aeed9.jpg"]	{}	1	t	vaso-statue-decorative-in-terracotta-e-gesso-386	0
388	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773160699/templesale/products/product_user_119_1773160698796_f64634509e70.jpg	2026-03-10 16:38:42.85328	41.590059	12.523038	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160699/templesale/products/product_user_119_1773160698796_f64634509e70.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160705/templesale/products/product_user_119_1773160704768_8a66fbd997fb.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160711/templesale/products/product_user_119_1773160710178_d146f75b55d2.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590059	12.523038	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773160699/templesale/products/product_user_119_1773160698796_f64634509e70.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160699/templesale/products/product_user_119_1773160698796_f64634509e70.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160705/templesale/products/product_user_119_1773160704768_8a66fbd997fb.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160711/templesale/products/product_user_119_1773160710178_d146f75b55d2.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-388	0
393	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773160930/templesale/products/product_user_119_1773160929651_170c6e78875a.jpg	2026-03-10 16:42:29.752528	41.589706	12.523341	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160930/templesale/products/product_user_119_1773160929651_170c6e78875a.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160935/templesale/products/product_user_119_1773160934945_01edd3eb1a73.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589706	12.523341	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773160930/templesale/products/product_user_119_1773160929651_170c6e78875a.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160930/templesale/products/product_user_119_1773160929651_170c6e78875a.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160935/templesale/products/product_user_119_1773160934945_01edd3eb1a73.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-393	0
334	119	Set di Coltelli da Cucina 5 Pezzi Rosenberg	Set di coltelli da cucina Rosenberg composto da 5 pezzi, ideale per ogni esigenza in cucina. Le lame sono dotate di rivestimento antiaderente che facilita il taglio e impedisce agli alimenti di attaccarsi, garantendo precisione e praticità durante la preparazione dei cibi.\n\nIl set include diversi tipi di coltelli per tagliare carne, verdure, pane e altri alimenti con facilità. Le impugnature ergonomiche offrono una presa sicura e confortevole durante l’uso.\n\nPerfetto sia per uso domestico che professionale. Design moderno ed elegante, ideale per chi desidera qualità e funzionalità in cucina.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773151772/templesale/products/product_user_119_1773151771458_58b99fa0fa49.jpg	2026-03-10 14:09:48.815202	41.590283	12.52347	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773151772/templesale/products/product_user_119_1773151771458_58b99fa0fa49.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773151777/templesale/products/product_user_119_1773151777007_4c9c47c7621e.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773151784/templesale/products/product_user_119_1773151782434_a77a79a5fc82.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590283	12.52347	Set di Coltelli da Cucina 5 Pezzi Rosenberg	https://res.cloudinary.com/dymox62b9/image/upload/v1773151772/templesale/products/product_user_119_1773151771458_58b99fa0fa49.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773151772/templesale/products/product_user_119_1773151771458_58b99fa0fa49.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773151777/templesale/products/product_user_119_1773151777007_4c9c47c7621e.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773151784/templesale/products/product_user_119_1773151782434_a77a79a5fc82.jpg"]	{}	10	t	set-di-coltelli-da-cucina-5-pezzi-rosenberg-334	1
398	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773161224/templesale/products/product_user_119_1773161223491_439273b4b00b.jpg	2026-03-10 16:47:48.979668	41.589706	12.523341	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773161224/templesale/products/product_user_119_1773161223491_439273b4b00b.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161232/templesale/products/product_user_119_1773161231262_cbf1d8778fde.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161241/templesale/products/product_user_119_1773161240633_ea0fe766996c.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589706	12.523341	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773161224/templesale/products/product_user_119_1773161223491_439273b4b00b.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773161224/templesale/products/product_user_119_1773161223491_439273b4b00b.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161232/templesale/products/product_user_119_1773161231262_cbf1d8778fde.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161241/templesale/products/product_user_119_1773161240633_ea0fe766996c.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-398	0
400	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773161371/templesale/products/product_user_119_1773161370425_a2822825c82c.jpg	2026-03-10 16:49:53.914006	41.589706	12.523341	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773161371/templesale/products/product_user_119_1773161370425_a2822825c82c.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161379/templesale/products/product_user_119_1773161378028_0d171d55fb09.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161386/templesale/products/product_user_119_1773161386157_0f9507022b2d.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589706	12.523341	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773161371/templesale/products/product_user_119_1773161370425_a2822825c82c.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773161371/templesale/products/product_user_119_1773161370425_a2822825c82c.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161379/templesale/products/product_user_119_1773161378028_0d171d55fb09.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161386/templesale/products/product_user_119_1773161386157_0f9507022b2d.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-400	1
402	119	Tapete	2.50 x 3.50	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773161547/templesale/products/product_user_119_1773161547016_9d846cf4fc6e.jpg	2026-03-10 16:53:40.702109	41.589706	12.523341	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773161547/templesale/products/product_user_119_1773161547016_9d846cf4fc6e.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161559/templesale/products/product_user_119_1773161558555_329a1d804f5c.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161568/templesale/products/product_user_119_1773161567490_ad6c4dc036f0.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161700/templesale/products/product_user_119_1773161699408_3d1fbdb64980.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161708/templesale/products/product_user_119_1773161707790_0ef83b11150b.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161717/templesale/products/product_user_119_1773161717142_39e1a1e20ddc.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589706	12.523341	Tapete	https://res.cloudinary.com/dymox62b9/image/upload/v1773161547/templesale/products/product_user_119_1773161547016_9d846cf4fc6e.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773161547/templesale/products/product_user_119_1773161547016_9d846cf4fc6e.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161559/templesale/products/product_user_119_1773161558555_329a1d804f5c.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161568/templesale/products/product_user_119_1773161567490_ad6c4dc036f0.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161700/templesale/products/product_user_119_1773161699408_3d1fbdb64980.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161708/templesale/products/product_user_119_1773161707790_0ef83b11150b.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773161717/templesale/products/product_user_119_1773161717142_39e1a1e20ddc.jpg"]	{}	1	t	tapete-402	0
394	119	Statue Decorative in Terracotta e Gesso	Eleganti statue decorative realizzate in terracotta e gesso, perfette per arredare casa, giardino o spazi interni con uno stile artistico e raffinato. I dettagli curati e le finiture lavorate rendono ogni pezzo unico e decorativo.\n\nIdeali come elementi d’arredo per salotti, ingressi, terrazze o come idea regalo. Disponibili diversi modelli e dimensioni per adattarsi a vari ambienti.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773160971/templesale/products/product_user_119_1773160970767_7a3bedf7973a.jpg	2026-03-10 16:43:20.636313	41.58993	12.523685	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160971/templesale/products/product_user_119_1773160970767_7a3bedf7973a.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160978/templesale/products/product_user_119_1773160977053_1d3c8578eda3.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160983/templesale/products/product_user_119_1773160983268_0f5ac82d85eb.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.58993	12.523685	Statue Decorative in Terracotta e Gesso	https://res.cloudinary.com/dymox62b9/image/upload/v1773160971/templesale/products/product_user_119_1773160970767_7a3bedf7973a.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773160971/templesale/products/product_user_119_1773160970767_7a3bedf7973a.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160978/templesale/products/product_user_119_1773160977053_1d3c8578eda3.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773160983/templesale/products/product_user_119_1773160983268_0f5ac82d85eb.jpg"]	{}	1	t	statue-decorative-in-terracotta-e-gesso-394	5
416	119	Asciugacapelli Professionale Euroblu 2000W	Asciugacapelli professionale Euroblu con motore potente da 2000W, progettato per asciugare i capelli rapidamente.\n\nCaratteristiche:\n\t•\tMotore DC\n\t•\tFlusso d’aria elevato\n\t•\tBeccuccio diffusore\n\t•\tDesign professionale\n\nIdeale per uso domestico o salone.	15.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1774972180/templesale/products/product_user_119_1774972179969_8a425495703f.jpg	2026-03-10 17:57:34.270849	41.589994	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1774972180/templesale/products/product_user_119_1774972179969_8a425495703f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1774972178/templesale/products/product_user_119_1774972178217_867452ed19fa.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773165406/templesale/products/product_user_119_1773165405780_c2aa5ca1c142.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589994	12.523298	Asciugacapelli Professionale Euroblu 2000W	https://res.cloudinary.com/dymox62b9/image/upload/v1774972180/templesale/products/product_user_119_1774972179969_8a425495703f.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1774972180/templesale/products/product_user_119_1774972179969_8a425495703f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1774972178/templesale/products/product_user_119_1774972178217_867452ed19fa.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773165406/templesale/products/product_user_119_1773165405780_c2aa5ca1c142.jpg"]	{}	10	f	asciugacapelli-professionale-euroblu-2000w-416	2
419	119	Borsa / Marsupio Multitasche Camouflage	Borsa multitasche stile camouflage militare, pratica e resistente, perfetta per attività all’aperto.\n\nCaratteristiche:\n\t•\tMarca Angel\n\t•\tDiversi scomparti con zip\n\t•\tDesign camouflage\n\t•\tMateriale resistente\n\t•\tIdeale per viaggi, trekking, pesca o uso quotidiano\n\nCompatta ma molto capiente per oggetti personali.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773165659/templesale/products/product_user_119_1773165659073_bb8abbb70d55.jpg	2026-03-10 18:01:34.430653	41.589994	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773165659/templesale/products/product_user_119_1773165659073_bb8abbb70d55.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773165663/templesale/products/product_user_119_1773165663457_75ebd080f239.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589994	12.523298	Borsa / Marsupio Multitasche Camouflage	https://res.cloudinary.com/dymox62b9/image/upload/v1773165659/templesale/products/product_user_119_1773165659073_bb8abbb70d55.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773165659/templesale/products/product_user_119_1773165659073_bb8abbb70d55.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773165663/templesale/products/product_user_119_1773165663457_75ebd080f239.jpg"]	{}	1	t	borsa-marsupio-multitasche-camouflage-419	3
412	119	Cassa Bluetooth Portatile	Cassa Bluetooth portatile XERTMT con connessione wireless, ideale per ascoltare musica ovunque. Design moderno e compatto, facile da trasportare e perfetta per casa, viaggi, feste o attività all’aperto.\n\nCaratteristiche principali:\n\t•\tConnessione Bluetooth wireless\n\t•\tAudio stereo potente\n\t•\tBatteria ricaricabile\n\t•\tPulsanti di controllo integrati\n\t•\tDesign resistente e compatto\n\t•\tCompatibile con smartphone, tablet e PC\n\nCondizione: Nuova nella confezione\n\nPerfetta per chi cerca uno speaker portatile semplice e pratico per ascoltare musica ovunque.\n\nCategoria consigliata:\nElettronica → Audio → Altoparlanti Bluetooth	0.00	Eletrodomésticos	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773676943/templesale/products/product_user_119_1773676942957_fa8aaa600c6f.jpg	2026-03-10 17:49:37.16505	41.589994	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773676943/templesale/products/product_user_119_1773676942957_fa8aaa600c6f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164871/templesale/products/product_user_119_1773164871299_8e10ab91f2b6.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164874/templesale/products/product_user_119_1773164874491_2ef46432264d.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589994	12.523298	Cassa Bluetooth Portatile	https://res.cloudinary.com/dymox62b9/image/upload/v1773676943/templesale/products/product_user_119_1773676942957_fa8aaa600c6f.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773676943/templesale/products/product_user_119_1773676942957_fa8aaa600c6f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164871/templesale/products/product_user_119_1773164871299_8e10ab91f2b6.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773164874/templesale/products/product_user_119_1773164874491_2ef46432264d.jpg"]	{"brand":"XERTMT"}	10	t	cassa-bluetooth-portatile-412	4
417	119	Orologio da Parete Vintage 30 cm	Orologio da parete con design vintage ispirato alle targhe automobilistiche e allo stile Parigi 1889.\n\nCaratteristiche:\n\t•\tDiametro 30 cm\n\t•\tDesign decorativo vintage\n\t•\tIdeale per soggiorno, cucina o ufficio\n\t•\tFacile da appendere\n\nPerfetto come elemento decorativo per la casa.	0.00	Casa, Móveis e Decoração	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1774972033/templesale/products/product_user_119_1774972033038_584188ff8a89.jpg	2026-03-10 17:58:29.520244	41.589994	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1774972033/templesale/products/product_user_119_1774972033038_584188ff8a89.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773675582/templesale/products/product_user_119_1773675581631_c7d8a1e9021f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773675607/templesale/products/product_user_119_1773675607353_a842c4e3af86.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589994	12.523298	Orologio da Parete Vintage 30 cm	https://res.cloudinary.com/dymox62b9/image/upload/v1774972033/templesale/products/product_user_119_1774972033038_584188ff8a89.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1774972033/templesale/products/product_user_119_1774972033038_584188ff8a89.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773675582/templesale/products/product_user_119_1773675581631_c7d8a1e9021f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773675607/templesale/products/product_user_119_1773675607353_a842c4e3af86.jpg"]	{}	1	t	orologio-da-parete-vintage-30-cm-417	2
413	119	Prezzatrice Manuale	Prezzatrice manuale modello MX5500 EOS, ideale per negozi, mercati e attività commerciali per applicare rapidamente etichette con il prezzo sui prodotti.\n\nSistema semplice e veloce con apertura one touch per inserire il rotolo di etichette. Strumento pratico per organizzare e marcare prezzi su merce in modo professionale.\n\nCaratteristiche:\n\t•\tModello MX5500 EOS\n\t•\tEtichettatrice manuale\n\t•\tSistema di apertura one touch\n\t•\tFacile da usare\n\t•\tIdeale per negozi, mercatini, magazzini\n\t•\tCompatibile con etichette standard per prezzatrici\n\nCondizione: Nuova con scatola\n\nCategoria consigliata:\nCommercio / Negozi → Attrezzatura negozio → Prezzatrici ed etichettatrici.	0.00	Ferramentas e Construção	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1774972198/templesale/products/product_user_119_1774972198503_d720dd561f13.jpg	2026-03-10 17:52:25.34315	41.589994	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1774972198/templesale/products/product_user_119_1774972198503_d720dd561f13.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773675861/templesale/products/product_user_119_1773675860976_1ce92dc06e2f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773165114/templesale/products/product_user_119_1773165113644_5d0e83c9a5fb.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773165117/templesale/products/product_user_119_1773165116973_2ca6f8c4f3a2.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589994	12.523298	Prezzatrice Manuale	https://res.cloudinary.com/dymox62b9/image/upload/v1774972198/templesale/products/product_user_119_1774972198503_d720dd561f13.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1774972198/templesale/products/product_user_119_1774972198503_d720dd561f13.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773675861/templesale/products/product_user_119_1773675860976_1ce92dc06e2f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773165114/templesale/products/product_user_119_1773165113644_5d0e83c9a5fb.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773165117/templesale/products/product_user_119_1773165116973_2ca6f8c4f3a2.jpg"]	{}	1	t	prezzatrice-manuale-413	3
420	119	Statue Radio FM portatile	Radio FM portatile Bluetooth 5.0: radio retrò vintage con batteria ricaricabile da 1200 mAh, supporta radio AM/SW/USB/TF, radio retrò da cucina per casa e ufficio.	0.00	Eletrônicos e Celulares	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1774972537/templesale/products/product_user_119_1774972537632_55bdf5b1703d.jpg	2026-03-31 15:57:12.388656	41.59038	12.523255	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1774972537/templesale/products/product_user_119_1774972537632_55bdf5b1703d.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1774972535/templesale/products/product_user_119_1774972535157_cf56faabbc2e.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1774972533/templesale/products/product_user_119_1774972533245_957fb8006d05.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.59038	12.523255	Statue Radio FM portatile	https://res.cloudinary.com/dymox62b9/image/upload/v1774972537/templesale/products/product_user_119_1774972537632_55bdf5b1703d.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1774972537/templesale/products/product_user_119_1774972537632_55bdf5b1703d.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1774972535/templesale/products/product_user_119_1774972535157_cf56faabbc2e.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1774972533/templesale/products/product_user_119_1774972533245_957fb8006d05.jpg"]	{}	1	t	statue-radio-fm-portatile-420	8
421	119	Solar Lights with Motion	NTELAMP Outdoor Solar Lights with Motion Sensor, 12000mAh 3000lm, Outdoor Solar Lights with Remote Control, Super Bright Solar Light for Outdoor with 5M Cable, IP65	0.00	Eletrônicos e Celulares	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1774973964/templesale/products/product_user_119_1774973963790_b1f08e009a92.avif	2026-03-31 16:20:54.990322	41.589994	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1774973964/templesale/products/product_user_119_1774973963790_b1f08e009a92.avif","https://res.cloudinary.com/dymox62b9/image/upload/v1774973965/templesale/products/product_user_119_1774973965058_f754a96ae169.avif"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589994	12.523298	Solar Lights with Motion	https://res.cloudinary.com/dymox62b9/image/upload/v1774973964/templesale/products/product_user_119_1774973963790_b1f08e009a92.avif	["https://res.cloudinary.com/dymox62b9/image/upload/v1774973964/templesale/products/product_user_119_1774973963790_b1f08e009a92.avif","https://res.cloudinary.com/dymox62b9/image/upload/v1774973965/templesale/products/product_user_119_1774973965058_f754a96ae169.avif"]	{}	1	t	solar-lights-with-motion-421	5
415	119	Micro Touch – Tagliacapelli di Precisione	Tagliacapelli di precisione Micro Touch progettato per rifinire barba, basette, sopracciglia e peli delle orecchie.\n\nCaratteristiche:\n\t•\tLuce integrata per maggiore precisione\n\t•\tTestina sottile per dettagli\n\t•\tInclude pettine guida\n\t•\tAlimentazione a batteria\n\t•\tCompatto e facile da usare\n\nIdeale per la cura personale quotidiana.	0.00	Beleza e Saúde	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1774972365/templesale/products/product_user_119_1774972365284_c99c937e4e3f.jpg	2026-03-10 17:56:33.329058	41.589994	12.523298	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1774972365/templesale/products/product_user_119_1774972365284_c99c937e4e3f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1774972367/templesale/products/product_user_119_1774972367657_6ff7010617c1.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1774972361/templesale/products/product_user_119_1774972361161_a0ba12eb95be.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1774972364/templesale/products/product_user_119_1774972363605_9868dd0ef5ee.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.589994	12.523298	Micro Touch – Tagliacapelli di Precisione	https://res.cloudinary.com/dymox62b9/image/upload/v1774972365/templesale/products/product_user_119_1774972365284_c99c937e4e3f.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1774972365/templesale/products/product_user_119_1774972365284_c99c937e4e3f.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1774972367/templesale/products/product_user_119_1774972367657_6ff7010617c1.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1774972361/templesale/products/product_user_119_1774972361161_a0ba12eb95be.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1774972364/templesale/products/product_user_119_1774972363605_9868dd0ef5ee.jpg"]	{}	1	t	micro-touch-tagliacapelli-di-precisione-415	7
341	119	Borsa Donna Elegante	Borsa da donna dal design classico e sofisticato, realizzata con materiali resistenti e rifiniture curate. I manici robusti e la tracolla regolabile offrono comfort e praticità durante l’utilizzo.\n\nSpaziosa e funzionale, è ideale per portare con sé tutto il necessario durante la giornata mantenendo uno stile elegante e versatile.	0.00	Moda e Acessórios	\N	https://res.cloudinary.com/dymox62b9/image/upload/v1773154494/templesale/products/product_user_119_1773154493697_05a0007fe9d7.jpg	2026-03-10 14:56:10.542219	41.590155	12.522697	\N	\N	\N	\N	\N	active	\N	\N	\N	\N	f	\N	f	["https://res.cloudinary.com/dymox62b9/image/upload/v1773154494/templesale/products/product_user_119_1773154493697_05a0007fe9d7.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154503/templesale/products/product_user_119_1773154502606_ecf310e75389.jpg"]	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	41.590155	12.522697	Borsa Donna Elegante	https://res.cloudinary.com/dymox62b9/image/upload/v1773154494/templesale/products/product_user_119_1773154493697_05a0007fe9d7.jpg	["https://res.cloudinary.com/dymox62b9/image/upload/v1773154494/templesale/products/product_user_119_1773154493697_05a0007fe9d7.jpg","https://res.cloudinary.com/dymox62b9/image/upload/v1773154503/templesale/products/product_user_119_1773154502606_ecf310e75389.jpg"]	{}	1	t	borsa-donna-elegante-341	2
\.


--
-- Data for Name: products_backup; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.products_backup (id, user_id, title, description, price, category, city, image_url, created_at, lat, lng, country, state, neighborhood, street, zip, status) FROM stdin;
1	1	Notebook Dell XPS	i7 16GB 512SSD	5500.00	Informática	São Paulo	https://via.placeholder.com/150	2025-10-20 10:48:49.444961	\N	\N	\N	\N	\N	\N	\N	active
33	3	1	\N	1.00	\N	Milano	\N	2025-10-22 13:20:41.336476	45.4637	9.1881	IT	LM	\N	\N	20131	active
34	3	br	\N	2.00	\N	Chapecó	\N	2025-10-22 13:21:58.749585	-27.0982154	-52.6505464	BR	SC	Centro	Avenida Nereu Ramos - D	89801023	active
35	3	sp 2	\N	2.00	\N	São Paulo	\N	2025-10-22 13:23:41.881661	-23.5701809	-46.648169	BR	SP	Bela Vista	Avenida Paulista	01310000	active
36	3	eua 3	\N	3.00	\N	Carteret	\N	2025-10-22 13:27:29.627719	40.5823	-74.2313	US	NJ	\N	\N	07008	active
\.


--
-- Data for Name: remember_tokens; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.remember_tokens (id, user_id, token_hash, expires_at, created_at) FROM stdin;
107	29	99ffb53995f147db0e0099fb9e845bf0ba4b100b6346a2e5c1238faed6d82efa	2026-03-23 18:10:11.085+00	2026-01-22 18:10:11.097575+00
142	29	f6d81007446179aee7cca92ea7f06d062c8d68726d3b348cc12a4d00b45cb4b8	2026-04-04 18:14:20.285+00	2026-02-03 18:14:20.298561+00
59	29	f3bbb7e3734715bd80caf891cc599404b404a13311a8c1e9b8192ca7d09ccaf6	2026-02-18 14:40:20.153+00	2025-12-20 14:40:20.165548+00
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.reviews (id, reviewee_id, reviewer_id, stars, comment, created_at, order_id, updated_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.sessions (id, user_id, token_hash, expires_at, created_at) FROM stdin;
56	117	82429ec0aa282e2862f3aed1dda642384c60ad775f203c4a093979e3283153f4	1780860928	1778268928
57	117	99a28c4553bff6cf9e2f96ba9e8b15943ef5157ffbe691953ce630b43c109459	1782988869	1780396870
\.


--
-- Data for Name: site_daily_visitors; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.site_daily_visitors (id, visit_date, visitor_key, ip, user_agent, entry_path, referrer, referrer_host, country, region, city, first_seen_at, last_seen_at, visits) FROM stdin;
1	2026-03-11	37ab85c8630e597a2a754548246ee063ed3f3d4e826ed356df352c1b46a527f1	78.208.198.252	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	/	android-app://com.google.android.googlequicksearchbox/	com.google.android.googlequicksearchbox	DE			1773242780853	1773242780853	1
2	2026-03-11	82edb48976fa73aaef4da88b14c3d914dee4571bfe498c0699999602b4cd5fc5	172.69.9.108	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	/admin	https://www.templesale.com/admin	www.templesale.com	DE			1773242843738	1773242843738	1
3	2026-03-11	62549f9e44d93e72728f6c5925153eda938d6a43500e30946c26d573a6e08dba	172.70.216.157	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/145.0.7632.108 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773242958637	1773242958637	1
4	2026-03-11	f19f5d946a6e63bb862a3a8daa8dbd1345a913be8f3f4dc6041ad3656db6364a	172.69.9.111	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773243073304	1773243073304	1
272	2026-03-14	7db4ba56f863758c34ed9e8bfc3e00f0c88b03b8985ec1afcde1d3857997e625	162.159.104.123	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1773478172496	1773478172496	1
6	2026-03-11	f20e9dbc05249e2e36e9b7a049e535cebdb9b67c814552501f3f906e3b6509cc	172.69.9.110	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/145.0.7632.108 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773243274849	1773243274849	1
7	2026-03-11	26a73d3ee6a2acab6b33a367d8ad04dfe64200124e35f79800815805c291dabb	144.126.208.83	vercel-screenshot/1.0	/	https://templesale2-disfods7a-guilherme-tebaldis-projects.vercel.app/	templesale2-disfods7a-guilherme-tebaldis-projects.vercel.app	US			1773243448381	1773243448754	1
9	2026-03-11	267ea81d949a362d336ef2c9126c1a244b1ec9cc27d7c83c6a85f65aff3fcf78	143.110.147.18	vercel-screenshot/1.0	/	https://templesale2-disfods7a-guilherme-tebaldis-projects.vercel.app/	templesale2-disfods7a-guilherme-tebaldis-projects.vercel.app	US			1773243449009	1773243448424	1
11	2026-03-11	ea781f9e71b3f629675338f416412393656494a05ead64270eb06b26a742f436	137.184.37.167	vercel-screenshot/1.0	/	https://templesale2-9chqnxxz7-guilherme-tebaldis-projects.vercel.app/	templesale2-9chqnxxz7-guilherme-tebaldis-projects.vercel.app	US			1773243628627	1773243629051	1
12	2026-03-11	d8b46e31dbaf5ab462846c16dc8e4d83294aa575b67795da0d820f402d14fd58	137.184.47.41	vercel-screenshot/1.0	/	https://templesale2-9chqnxxz7-guilherme-tebaldis-projects.vercel.app/	templesale2-9chqnxxz7-guilherme-tebaldis-projects.vercel.app	US			1773243628735	1773243629157	1
15	2026-03-11	9955d8c6181bc57c9b9c80e55a750a6a58e288ca6d30802600fb5cc736497c53	172.70.216.157	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	/admin	https://www.templesale.com/admin	www.templesale.com	DE			1773244100107	1773244100663	1
17	2026-03-11	c82cedcba06128ba220295ea3dc5a24a45c863d718fd87e58e5da84f5e1356bf	162.158.130.104	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/145.0.7632.108 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773244261459	1773244261459	1
5	2026-03-11	383012e6972fac38bc2df4e13da9ee71e4c9f9f553f7ae2aa3d5ab2de0b7e0c4	217.200.37.213	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/145.0.7632.108 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773243274652	1773244261782	2
34	2026-03-11	59c0ebc1241c5b2319c672607a0de7247c53960e6bbe935546c6b9604c4d7d61	188.114.102.180	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	/admin	https://www.templesale.com/admin	www.templesale.com	DE			1773245284305	1773250616837	3
19	2026-03-11	bb35f5dc5903e414bd123cacbebb4776485985b28b073098c7754a46b513fbe0	162.158.130.104	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.3 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773244304234	1773244351335	4
20	2026-03-11	99388afa5a65dcce660037c2c6b4a45626c3de17b49bb68ab553e233b09e7205	217.200.37.213	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.3 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773244311288	1773244351371	4
28	2026-03-11	6866deec2104362d65e0f0c702ee49124373d6f21abbd9adcb8bebecf125545c	172.69.68.66	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773245046897	1773245046897	1
30	2026-03-11	c51aefcd07d50cbb985da202e69f28a4cdb21816886e125e1516d913a0ed1837	161.35.224.220	vercel-screenshot/1.0	/	https://templesale2-4bzsid087-guilherme-tebaldis-projects.vercel.app/	templesale2-4bzsid087-guilherme-tebaldis-projects.vercel.app	US			1773245100651	1773245100397	1
29	2026-03-11	79c685cb3ce1b1000dfdc2e1593fe0afe889da64493c7b8db96bdeb0df617fc9	64.23.205.158	vercel-screenshot/1.0	/	https://templesale2-4bzsid087-guilherme-tebaldis-projects.vercel.app/	templesale2-4bzsid087-guilherme-tebaldis-projects.vercel.app	US			1773245100290	1773245100718	1
33	2026-03-11	17c304c2a2747cf0e2ec889563e05935047ab45ac607da9728342ed7f6fc7677	172.70.216.156	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	/admin	https://www.templesale.com/admin	www.templesale.com	DE			1773245283625	1773245283625	0
36	2026-03-11	e0064c01aed397064659e733a6fa159a373781f3499c2e265f7db304b4c416ba	162.158.130.104	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.3 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773245333126	1773249058950	2
51	2026-03-11	f6d28200c55fefa9ad979f793ea593763732c75264b66b45089b00ce77fd8e21	64.23.178.209	vercel-screenshot/1.0	/	https://templesale2-73axa2cm5-guilherme-tebaldis-projects.vercel.app/	templesale2-73axa2cm5-guilherme-tebaldis-projects.vercel.app	US			1773245680153	1773245680416	1
39	2026-03-11	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	188.114.102.181	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/145.0.7632.108 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773245369969	1773249298139	4
365	2026-03-16	ea311ff12337a2fa02f0e20acde947647c392be7d410cf3f0bd97c0b7d6a9c6b	64.23.148.34	vercel-screenshot/1.0	/	https://templesale2-hiee28xft-guilherme-tebaldis-projects.vercel.app/	templesale2-hiee28xft-guilherme-tebaldis-projects.vercel.app	US			1773676763867	1773676763867	1
52	2026-03-11	0234fa0163e05efbf0f149b2da0adc07cb508c7f1cd4832d4c1798cf537f0e4f	137.184.47.41	vercel-screenshot/1.0	/	https://templesale2-73axa2cm5-guilherme-tebaldis-projects.vercel.app/	templesale2-73axa2cm5-guilherme-tebaldis-projects.vercel.app	US			1773245680158	1773245683685	1
367	2026-03-16	0156e4927b4f83a3311572dbde60d651a2b9754bd9117c00835dde359bf733a3	165.232.154.185	vercel-screenshot/1.0	/	https://templesale2-hiee28xft-guilherme-tebaldis-projects.vercel.app/	templesale2-hiee28xft-guilherme-tebaldis-projects.vercel.app	US			1773676763972	1773676763972	0
57	2026-03-11	210cbbe0a800c32b9689d966727fc0241be8963e47791ac65f622768d80e90dd	137.184.5.60	vercel-screenshot/1.0	/	https://templesale2-mwiwlxkbc-guilherme-tebaldis-projects.vercel.app/	templesale2-mwiwlxkbc-guilherme-tebaldis-projects.vercel.app	US			1773245738655	1773245739019	1
59	2026-03-11	6281957f0014c89a9f50acb921f00d3c29c185aa774b541e6a5c27711afe9717	143.198.107.151	vercel-screenshot/1.0	/	https://templesale2-mwiwlxkbc-guilherme-tebaldis-projects.vercel.app/	templesale2-mwiwlxkbc-guilherme-tebaldis-projects.vercel.app	US			1773245738765	1773245738765	1
60	2026-03-11	bd3b81cc14b144d80c48a513d9fd2bf72befc78499d8afb3373193d9c2099f73	143.198.107.151	vercel-screenshot/1.0	/	https://templesale2-mwiwlxkbc-guilherme-tebaldis-projects.vercel.app/	templesale2-mwiwlxkbc-guilherme-tebaldis-projects.vercel.app	US			1773245739169	1773245739169	0
416	2026-03-18	680a807577865949ed6992e0f5c65568f9f5eaade4994f151d9c0179b13c8ee6	172.70.214.195	Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0	/	https://www.templesale.com/	www.templesale.com	US			1773844675003	1773844675003	1
304	2026-03-16	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	217.200.36.241	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/146.0.7680.40 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773654942937	1773690960273	3
205	2026-03-12	59c0ebc1241c5b2319c672607a0de7247c53960e6bbe935546c6b9604c4d7d61	217.200.37.213	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	/admin	https://www.templesale.com/admin	www.templesale.com	DE			1773299777895	1773299887520	1
258	2026-03-13	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	217.200.36.241	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/145.0.7632.108 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773385398386	1773432862234	3
211	2026-03-12	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	172.69.68.66	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/145.0.7632.108 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773303335497	1773316841825	4
283	2026-03-14	17f17d4ee67d32dd99e80c32197dec014e5aeb1ed8f8db7c7572cf1642da99cc	137.184.121.221	vercel-screenshot/1.0	/	https://templesale2-hlnljfs7y-guilherme-tebaldis-projects.vercel.app/	templesale2-hlnljfs7y-guilherme-tebaldis-projects.vercel.app	US			1773500842316	1773500842316	0
273	2026-03-14	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	172.70.216.157	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/145.0.7632.108 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773487158205	1773503804254	3
219	2026-03-12	1ad1ac9b593f572bb505ab3c33c623dd8108054d071d462832227f2ddb34e820	172.69.68.66	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	/	https://www.google.com/	www.google.com	DE			1773320455488	1773320594430	1
227	2026-03-12	433511fe98eab4a004da553b9732cc3a210b5b693a6cb5a2a06e718e426f861b	23.22.192.27	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1773323460878	1773323466263	1
229	2026-03-12	d16d36749876b1c0da04782863a563104cff0b6543e85a2560fd07944156c18b	162.158.62.63	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1773323668628	1773323688850	1
231	2026-03-12	0a6c066adf3adfaf0864163f827390fc2d984e998849022931f892ea1423929d	172.71.191.124	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1773347737268	1773347737268	1
232	2026-03-12	e783006eab8a1ecb1b6491d46b5ba2b42f310091763b69dafcc7d062390a42af	172.71.191.124	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1773347754942	1773347754942	0
288	2026-03-14	59c0ebc1241c5b2319c672607a0de7247c53960e6bbe935546c6b9604c4d7d61	172.69.9.110	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/admin	https://www.templesale.com/admin	www.templesale.com	DE			1773515151921	1773515199137	1
233	2026-03-12	bd74cb0e8db083b3966840fa810c3e1a1af9f776f62349e9d49080c63ad75eab	172.70.216.156	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	/	https://www.templesale.com/	www.templesale.com	DE			1773349780202	1773349855684	1
296	2026-03-15	00fe30cc61faca812a66c9cea0f9228c1485e1b870483ca83b4d54909b55e878	180.153.236.111	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	GB			1773602898688	1773602898688	1
302	2026-03-15	08308fd8d2300c3ea6b9c56ee1f2b9225844d4860b79b1f64a8d32e92feb2af9	172.71.191.124	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1773612069510	1773612069510	1
236	2026-03-13	c34062fe0cafdbef848d557ad601a70bc9d37e6180aab083faf4144f63e1d84a	186.227.147.4	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1773367133252	1773367929546	3
259	2026-03-13	291033bf5a88a35a50ce82cf824e9856ea24304a9cd505d69aa959c7094f2e70	172.69.7.23	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1773386709415	1773386709415	1
260	2026-03-13	b3e107967e14ca665f781cc9f5e84d91a28bc12dec3799a2f15bacc032399b36	172.236.122.62	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1773387490760	1773387490760	1
261	2026-03-13	bd74cb0e8db083b3966840fa810c3e1a1af9f776f62349e9d49080c63ad75eab	78.208.238.14	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	/	https://www.templesale.com/	www.templesale.com	DE			1773403916252	1773403916252	1
282	2026-03-14	a8466af6311818ff8fd1432b7f3b8c94996d6d4fdbb7ad25c573e389d7a6d757	137.184.121.221	vercel-screenshot/1.0	/	https://templesale2-hlnljfs7y-guilherme-tebaldis-projects.vercel.app/	templesale2-hlnljfs7y-guilherme-tebaldis-projects.vercel.app	US			1773500841949	1773500841949	1
284	2026-03-14	f157cd74fd1f9cf70580fa540abe96a03db9fe061d7eda9c435ce013c21ee1a8	143.198.107.32	vercel-screenshot/1.0	/	https://templesale2-hlnljfs7y-guilherme-tebaldis-projects.vercel.app/	templesale2-hlnljfs7y-guilherme-tebaldis-projects.vercel.app	US			1773500842807	1773500842807	0
285	2026-03-14	1047e8b2ca7352d2af302f041875ea4b8420aefee8cc7c23c8d4f0472f5a8d60	143.198.107.32	vercel-screenshot/1.0	/	https://templesale2-hlnljfs7y-guilherme-tebaldis-projects.vercel.app/	templesale2-hlnljfs7y-guilherme-tebaldis-projects.vercel.app	US			1773500842228	1773500842228	1
534	2026-03-31	e22baf5e416a617ebe6b655eafdc2c7df3647e4d9bd7466045df2b6975f6ff10	143.110.235.112	vercel-screenshot/1.0	/	https://templesale2-bk0tf5hub-guilherme-tebaldis-projects.vercel.app/	templesale2-bk0tf5hub-guilherme-tebaldis-projects.vercel.app	US			1774958318327	1774958318327	1
417	2026-03-18	037ec925ad090bbaa501cad453a652afca358a29e6ab60c2147fe130ff8305da	217.200.36.241	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	DE			1773858324382	1773858342369	1
420	2026-03-19	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	78.213.55.241	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/146.0.7680.40 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773921297329	1773921297329	1
292	2026-03-15	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	217.200.36.241	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/145.0.7632.108 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773563483762	1773573345961	2
907	2026-03-31	8033e2c270597e7fbcc37f973bf846a718d6c516d78582d9d08929462aaaca77	162.158.159.27	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0	/	https://www.google.com/	www.google.com	US			1774982910486	1774982910486	1
425	2026-03-19	37caaffbd22e95948d91a59746726a3d6ff1e33acead2e0763f687eda6b73066	180.153.236.143	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1773939952207	1773939958134	1
537	2026-03-31	52959a7bdaedd0f576612258816f420e6049c48bfae6a89042d131399921af2f	165.232.146.30	vercel-screenshot/1.0	/	https://templesale2-bk0tf5hub-guilherme-tebaldis-projects.vercel.app/	templesale2-bk0tf5hub-guilherme-tebaldis-projects.vercel.app	US			1774958318640	1774958319640	1
429	2026-03-20	6fa206325e4a6913fe68a9989fd52e6b824ed7d8bf9524084a571653a65a29d8	104.22.62.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1774006209372	1774006239313	1
297	2026-03-15	c34062fe0cafdbef848d557ad601a70bc9d37e6180aab083faf4144f63e1d84a	179.63.44.148	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1773607136412	1773607236396	1
303	2026-03-15	07d99a9178221c198ca51a71ed23b961711468c2d7570dd3fb6ba9388ecd6808	172.70.216.154	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	DE			1773617085692	1773617085692	1
432	2026-03-21	526ed4a22ab8b56b0791e255158ef485820f024253ee679b4fb520ca9fea7aed	104.23.211.87	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1774061076690	1774061076690	1
434	2026-03-21	940d2c27ec057030a241c60f4aab4dfa3f6c9f81c9c7745b90c707cbe345c048	104.143.84.54	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1774131430852	1774131430852	1
436	2026-03-24	696922b5c00f123d5e68328026fd7f03b29bead874533a12da3818c77d380f9c	172.71.194.95	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1774333438881	1774333438881	1
548	2026-03-31	7eb190d08276bb5e33f566ab2a20f3d6dae546ef25c6ba09a6fa9ab536922423	64.23.187.165	vercel-screenshot/1.0	/	https://templesale2-fit7nwxjm-guilherme-tebaldis-projects.vercel.app/	templesale2-fit7nwxjm-guilherme-tebaldis-projects.vercel.app	US			1774958425467	1774958425467	1
439	2026-03-25	81aea3f042c4c824ea01d1c01e526f72a3c8403dd870d02ce8770772f376cbe5	172.71.194.95	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1774419869933	1774419888639	1
444	2026-03-25	dfffa0a77623a421704e3e7c52eb4c320b7ed21640fdc0d0bc0fb9679beacd2c	162.158.130.30	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	DE			1774469056138	1774469056138	1
449	2026-03-28	0361d9a9a04534c43008f67511bc62cc4610208d2f22e0be851796e174670bc4	172.68.15.254	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1774716035580	1774716035580	1
366	2026-03-16	3b41e22803998ea5b9d478f35c000802113428c4f0ec90c6aa5625e75b368273	165.232.154.185	vercel-screenshot/1.0	/	https://templesale2-hiee28xft-guilherme-tebaldis-projects.vercel.app/	templesale2-hiee28xft-guilherme-tebaldis-projects.vercel.app	US			1773676763749	1773676763749	1
318	2026-03-16	59c0ebc1241c5b2319c672607a0de7247c53960e6bbe935546c6b9604c4d7d61	217.200.36.241	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	DE			1773669812133	1773677703014	2
399	2026-03-16	3de354d509548f9283c3bee1af245fde5e0470671872558cbe76e2a1857caa46	172.69.195.18	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	GB			1773699489390	1773699489390	1
400	2026-03-17	17b13e4cb5e66010fced51d5c1271af577bf7336ff9194a7d38867d8ebffc60f	172.70.174.213	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1773720059819	1773720059819	1
535	2026-03-31	e9bdc582a5a241d89b51c7d2fbb91e21a8d42ee22331aa9b5763dce4a02e53ab	54.183.218.159	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-bk0tf5hub-guilherme-tebaldis-projects.vercel.app/	templesale2-bk0tf5hub-guilherme-tebaldis-projects.vercel.app	US			1774958318364	1774958318364	1
401	2026-03-17	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	217.200.36.241	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/146.0.7680.40 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773720468796	1773720473921	1
403	2026-03-17	b6a3ecfdff6fe2ceadf04a41b7b090e9dbb094b24b5a0bdedb03a0acb79598c9	172.71.172.44	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/145.0.7632.6 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	DE			1773742878101	1773742884321	1
409	2026-03-18	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	78.210.149.160	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/146.0.7680.40 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773809809570	1773827280608	3
419	2026-03-18	4c7543d1907eca585e485d1a0bbf12bbccb01c234070fc1bf43a2725ef70539f	202.8.43.49	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1773865095439	1773865095439	1
405	2026-03-17	47a5dae10bd05bd7062f7f2408e3f87fd02550385b30f0794814dfd9c46b73b7	2a03:2880:21ff:46::	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0	/	https://www.facebook.com/	www.facebook.com	US			1773762544488	1773762577407	1
408	2026-03-17	0f3c04c979fef98bafdcdd81c243ad90850f2a788b911501c459168593ad7511	172.70.216.157	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22H217 Instagram 420.0.0.39.76 (iPhone14,5; iOS 18_7_3; pt_BR; pt; scale=3.00; 1170x2532; IABMV/1; 904620799) Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1773762587479	1773762587479	1
421	2026-03-19	59c0ebc1241c5b2319c672607a0de7247c53960e6bbe935546c6b9604c4d7d61	217.200.36.241	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	DE			1773934548734	1773934624507	1
427	2026-03-19	2f1eefad7a863e4195f1252d9c0b10a989f40c75053ecf19a0fc39274f825b8e	104.23.166.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1773939980893	1773939984194	1
430	2026-03-20	adabf31268fee6e52caefca3717c74e19c27d81ec0ccda43173733e362dcb349	205.169.39.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1774006211300	1774006211300	1
433	2026-03-21	6fdaab2eb372a6f13f2c8537a9ab8fd32ea0d989d043b5e2837f83e7765bdc95	104.23.166.125	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1774130616609	1774130616609	1
435	2026-03-23	59c0ebc1241c5b2319c672607a0de7247c53960e6bbe935546c6b9604c4d7d61	217.200.37.204	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	DE			1774278860060	1774278860060	1
437	2026-03-24	713b2913dc5e4a5077e3f784d3d1ae83e37337cea6d0304f18539ea93bc448ef	135.136.23.210	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	GB			1774390563921	1774390579413	1
441	2026-03-25	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	172.69.9.110	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/146.0.7680.151 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1774429773973	1774430019818	1
445	2026-03-26	0722f728a7a26ef618508468299d09155b78c4381e315e3ca7a454158ac7ef15	198.41.227.30	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1774503648877	1774503648877	1
446	2026-03-26	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	37.161.240.245	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/146.0.7680.151 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1774518973963	1774519085989	1
448	2026-03-27	2c73266d024be473d4507cec633d3ad3c131e2d3a0d1fb0d9e4be91dc894e4d9	2a03:2880:f806:3e::	meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)	/	https://www.templesale.com/	www.templesale.com	US			1774624080352	1774624080352	1
450	2026-03-29	372204276d9615f132ada895decb060454e00d9c7f95a5e9c4f6fecfd26953ff	180.153.236.13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1774787166135	1774787168353	1
452	2026-03-29	a08b0360136c4967f38bf6c3616c3f8eea9a6e32eb15ef4685b53ca939ed8fd4	104.23.170.33	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1774795197984	1774795199499	1
454	2026-03-29	6277ded7ec169d92a2703cdb3db0c532255957b4cbded9b92257fdda7c7c07c3	180.153.236.251	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1774795204101	1774795208484	1
456	2026-03-30	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	172.69.68.66	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/146.0.7680.151 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1774867428794	1774867485330	1
459	2026-03-30	a1d09036c643225d87c0364080311c368a44aa6e4a6a7da98aa26b540468f454	93.41.100.150	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1774891028341	1774891644124	1
1042	2026-04-01	5d810befe6262fb4fc6efe5f9058f414ec69c55b8087835ca48254cbc91ded6d	54.177.67.210	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-561l5dmhk-guilherme-tebaldis-projects.vercel.app/	templesale2-561l5dmhk-guilherme-tebaldis-projects.vercel.app	US			1775050338008	1775050338008	1
536	2026-03-31	86176fbbbca7c2db3a5a0e569beed78ef558d496aff0c9d3b9abf346f686be63	54.151.54.102	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-bk0tf5hub-guilherme-tebaldis-projects.vercel.app/	templesale2-bk0tf5hub-guilherme-tebaldis-projects.vercel.app	US			1774958318505	1774958318505	1
538	2026-03-31	67b890cccee0aa5fd19c5aae22b5c1ef9ba8b245a901a337b3b7a378b5438928	143.110.235.112	vercel-screenshot/1.0	/	https://templesale2-bk0tf5hub-guilherme-tebaldis-projects.vercel.app/	templesale2-bk0tf5hub-guilherme-tebaldis-projects.vercel.app	US			1774958318634	1774958318634	0
543	2026-03-31	118ad5efa53f65affa2f11ff8b3c2b017773b511b473439e356528a7b1234f6f	54.193.173.160	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-fit7nwxjm-guilherme-tebaldis-projects.vercel.app/	templesale2-fit7nwxjm-guilherme-tebaldis-projects.vercel.app	US			1774958425141	1774958425141	1
544	2026-03-31	1e9a45c5e068ec74b9f411c9529541723ada898929583880d093604885a19855	3.101.47.29	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-fit7nwxjm-guilherme-tebaldis-projects.vercel.app/	templesale2-fit7nwxjm-guilherme-tebaldis-projects.vercel.app	US			1774958425146	1774958425146	1
545	2026-03-31	256aabcf698cd72b49ed21b94f2fa3c8a23cf2f00d93934fd6a2b28fb9d2d8ae	147.182.199.40	vercel-screenshot/1.0	/	https://templesale2-fit7nwxjm-guilherme-tebaldis-projects.vercel.app/	templesale2-fit7nwxjm-guilherme-tebaldis-projects.vercel.app	US			1774958425365	1774958425655	1
547	2026-03-31	dc7587fea054ef37eb9d1b349913f55aebd9e7e74ad1f7bdba4b4a7e72bf0546	64.23.187.165	vercel-screenshot/1.0	/	https://templesale2-fit7nwxjm-guilherme-tebaldis-projects.vercel.app/	templesale2-fit7nwxjm-guilherme-tebaldis-projects.vercel.app	US			1774958425912	1774958425912	0
504	2026-03-31	513e39e44613be4204a959ac5a572438acc8aea1e95a3e9e6d202da1fea9be87	54.215.138.233	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-rkgij8lsi-guilherme-tebaldis-projects.vercel.app/	templesale2-rkgij8lsi-guilherme-tebaldis-projects.vercel.app	US			1774957965260	1774957965260	1
505	2026-03-31	b4bf0f4c6f4ba92f5ae9eedb5f9531fbd7574b234e00fb4db390e8586aabd78c	147.182.199.40	vercel-screenshot/1.0	/	https://templesale2-rkgij8lsi-guilherme-tebaldis-projects.vercel.app/	templesale2-rkgij8lsi-guilherme-tebaldis-projects.vercel.app	US			1774957965616	1774957966072	1
507	2026-03-31	a43cc7e861d389694d401aafcdc042bd91801f30a11c183b51d895349df1f94f	24.199.120.12	vercel-screenshot/1.0	/	https://templesale2-rkgij8lsi-guilherme-tebaldis-projects.vercel.app/	templesale2-rkgij8lsi-guilherme-tebaldis-projects.vercel.app	US			1774957965693	1774957967656	1
503	2026-03-31	61ccce64ba9e9fa7c3349f807aefd2d792a5bca193698ee2b4aa27914ce1aa6f	54.176.163.119	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-rkgij8lsi-guilherme-tebaldis-projects.vercel.app/	templesale2-rkgij8lsi-guilherme-tebaldis-projects.vercel.app	US			1774957965204	1774957979189	1
632	2026-03-31	64d89abfcad3705d251c40c8e38cd3ad4793b5674b108bad7dd96c2a94fc92ed	3.101.124.45	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-2a9l118cf-guilherme-tebaldis-projects.vercel.app/	templesale2-2a9l118cf-guilherme-tebaldis-projects.vercel.app	US			1774973626833	1774973626833	1
633	2026-03-31	77ca3a32de3b192d6e98332b08d649b6be228bdfd719ff5439a97aeb580d2a0b	18.144.176.115	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-2a9l118cf-guilherme-tebaldis-projects.vercel.app/	templesale2-2a9l118cf-guilherme-tebaldis-projects.vercel.app	US			1774973626843	1774973626843	1
634	2026-03-31	25fdb862e5c76062b7786c92037e4d8e9de1c30e4c2895abbb3b1cd118f1889a	64.227.97.126	vercel-screenshot/1.0	/	https://templesale2-2a9l118cf-guilherme-tebaldis-projects.vercel.app/	templesale2-2a9l118cf-guilherme-tebaldis-projects.vercel.app	US			1774973627023	1774973628228	1
635	2026-03-31	d9d9401f62e6ec20b2dd9028c74b05da97139f9ef1a845998508da7b695afb8d	134.199.239.11	vercel-screenshot/1.0	/	https://templesale2-2a9l118cf-guilherme-tebaldis-projects.vercel.app/	templesale2-2a9l118cf-guilherme-tebaldis-projects.vercel.app	US			1774973627628	1774973628425	1
474	2026-03-31	59c0ebc1241c5b2319c672607a0de7247c53960e6bbe935546c6b9604c4d7d61	188.114.102.181	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	DE			1774957086028	1774981648021	6
909	2026-04-01	790dac957b8838742d5528d27056dcff7dfbcc029c8658c40b2dd40bbc3fad0f	173.244.56.103	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1775046245970	1775046245970	1
647	2026-03-31	45ee8dc6c171779f12404a79f41e7a23847ac0177183aa990fe59e118f32ea2a	18.144.33.125	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-mv9kdyik3-guilherme-tebaldis-projects.vercel.app/	templesale2-mv9kdyik3-guilherme-tebaldis-projects.vercel.app	US			1774973861027	1774973861027	1
648	2026-03-31	0cd6178103445af331ae7995ec3c79081debf91c57d51773c6c617c34820cbe5	54.67.44.33	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-mv9kdyik3-guilherme-tebaldis-projects.vercel.app/	templesale2-mv9kdyik3-guilherme-tebaldis-projects.vercel.app	US			1774973860842	1774973860842	1
646	2026-03-31	97b7d1e0296e00a5c1e00eb3c82365f33f63953b51ee6c3f0b46a152cd1ea9f1	24.144.89.30	vercel-screenshot/1.0	/	https://templesale2-mv9kdyik3-guilherme-tebaldis-projects.vercel.app/	templesale2-mv9kdyik3-guilherme-tebaldis-projects.vercel.app	US			1774973860754	1774973861231	1
650	2026-03-31	cfd1eff5113e7436c25fcd02f335a065013e300780e046b60a082911c567bc35	143.198.144.241	vercel-screenshot/1.0	/	https://templesale2-mv9kdyik3-guilherme-tebaldis-projects.vercel.app/	templesale2-mv9kdyik3-guilherme-tebaldis-projects.vercel.app	US			1774973861292	1774973861292	0
651	2026-03-31	d7a324b03e3c77990cf2e8996741f99f861948542fe0dcd8ccad115df5caa3dd	143.198.144.241	vercel-screenshot/1.0	/	https://templesale2-mv9kdyik3-guilherme-tebaldis-projects.vercel.app/	templesale2-mv9kdyik3-guilherme-tebaldis-projects.vercel.app	US			1774973860923	1774973860923	1
668	2026-03-31	f6fb672083e540b9b2cbaa899e258ed7c29b620bc3451df3859bdd13c85c894c	13.56.228.217	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-r1d89u3pz-guilherme-tebaldis-projects.vercel.app/	templesale2-r1d89u3pz-guilherme-tebaldis-projects.vercel.app	US			1774974225798	1774974225798	1
669	2026-03-31	98f5406c089faaab7df7d333d04f08ad3134c75a66e1dc17abdeff4f9cb7b4b6	24.199.116.71	vercel-screenshot/1.0	/	https://templesale2-r1d89u3pz-guilherme-tebaldis-projects.vercel.app/	templesale2-r1d89u3pz-guilherme-tebaldis-projects.vercel.app	US			1774974226023	1774974226023	1
670	2026-03-31	4743d9035800739ab0ba12b4e0578b0c53efab075191b5546456a869113acb1a	137.184.121.221	vercel-screenshot/1.0	/	https://templesale2-r1d89u3pz-guilherme-tebaldis-projects.vercel.app/	templesale2-r1d89u3pz-guilherme-tebaldis-projects.vercel.app	US			1774974226404	1774974226404	1
671	2026-03-31	be3a6b8cd44268209d4c2bd05e587a6f06bee1a95995933fc8be5096f7f2d23b	24.199.116.71	vercel-screenshot/1.0	/	https://templesale2-r1d89u3pz-guilherme-tebaldis-projects.vercel.app/	templesale2-r1d89u3pz-guilherme-tebaldis-projects.vercel.app	US			1774974226435	1774974226435	0
672	2026-03-31	a4fa3248cc3a6b003c2ed3485a0082c969ce61957bfc6e58fd69c4b22a881fac	52.53.176.171	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-r1d89u3pz-guilherme-tebaldis-projects.vercel.app/	templesale2-r1d89u3pz-guilherme-tebaldis-projects.vercel.app	US			1774974226570	1774974226570	1
682	2026-03-31	5c731d0031b17269e153d5f08feb3089ee6ca553870f451f37c0b2b532f12fcc	64.227.97.126	vercel-screenshot/1.0	/	https://templesale2-oiplpgu92-guilherme-tebaldis-projects.vercel.app/	templesale2-oiplpgu92-guilherme-tebaldis-projects.vercel.app	US			1774974562667	1774974562667	1
683	2026-03-31	05d5a4bdfe89664e10e3969897e5b659a75d5da5a231c0de9fa352ed8842cd84	64.23.228.125	vercel-screenshot/1.0	/	https://templesale2-oiplpgu92-guilherme-tebaldis-projects.vercel.app/	templesale2-oiplpgu92-guilherme-tebaldis-projects.vercel.app	US			1774974562660	1774974562660	1
684	2026-03-31	0a0b9b83ea3b9c5a9aaa5b16175fc7c19587bbb45a9b7b3df8008677929f4b0f	64.227.97.126	vercel-screenshot/1.0	/	https://templesale2-oiplpgu92-guilherme-tebaldis-projects.vercel.app/	templesale2-oiplpgu92-guilherme-tebaldis-projects.vercel.app	US			1774974563019	1774974563019	0
685	2026-03-31	efa11a947e107615ca3e9895aef964f216733679e9349b9678930414c1232e67	54.241.119.116	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-oiplpgu92-guilherme-tebaldis-projects.vercel.app/	templesale2-oiplpgu92-guilherme-tebaldis-projects.vercel.app	US			1774974562617	1774974562617	1
1043	2026-04-01	5fab679f1c4e5213da263e0155abe31cca2564ff5d3538f1e42b44a3c2b4a6ab	13.56.58.43	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-561l5dmhk-guilherme-tebaldis-projects.vercel.app/	templesale2-561l5dmhk-guilherme-tebaldis-projects.vercel.app	US			1775050338049	1775050338049	1
687	2026-03-31	661d3114e1725a412fbc860597ed96af6e0f692c8cfc1a1b81a46da4a5126f4a	64.23.228.125	vercel-screenshot/1.0	/	https://templesale2-oiplpgu92-guilherme-tebaldis-projects.vercel.app/	templesale2-oiplpgu92-guilherme-tebaldis-projects.vercel.app	US			1774974563032	1774974563032	0
706	2026-03-31	56303a916efe386819da29ef9c4d160b18939ff5a8261d00083c660882ceb99f	18.144.125.234	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-n4ywq2jvy-guilherme-tebaldis-projects.vercel.app/	templesale2-n4ywq2jvy-guilherme-tebaldis-projects.vercel.app	US			1774974758458	1774974758458	1
686	2026-03-31	c5d34ad55c107f1fd2735549367e3afd97f8789e5f0a422b27a6c620ab74480e	54.183.214.221	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-oiplpgu92-guilherme-tebaldis-projects.vercel.app/	templesale2-oiplpgu92-guilherme-tebaldis-projects.vercel.app	US			1774974563087	1774974571438	1
704	2026-03-31	d2052fd40e9fa037cd26f98d8c0195822925dadc209e54e3bce5d3b6e115fedf	143.198.63.243	vercel-screenshot/1.0	/	https://templesale2-n4ywq2jvy-guilherme-tebaldis-projects.vercel.app/	templesale2-n4ywq2jvy-guilherme-tebaldis-projects.vercel.app	US			1774974758334	1774974758869	1
1207	2026-04-01	c2c290f50ec50ccbe2f7ed716f3909d110488530e5fcb27d2ae16b8d9998c608	3.101.112.209	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-o914guuq2-guilherme-tebaldis-projects.vercel.app/	templesale2-o914guuq2-guilherme-tebaldis-projects.vercel.app	US			1775052382418	1775052382418	1
708	2026-03-31	325da62058351d567ff77354c0dafe2254e8815b4cededb18105b5a9a5415830	64.23.171.115	vercel-screenshot/1.0	/	https://templesale2-n4ywq2jvy-guilherme-tebaldis-projects.vercel.app/	templesale2-n4ywq2jvy-guilherme-tebaldis-projects.vercel.app	US			1774974759230	1774974762416	1
1209	2026-04-01	7da0c755689de98b994d8717d325d8366c4feb456422b66300cf94c2d06600f3	143.244.191.158	vercel-screenshot/1.0	/	https://templesale2-o914guuq2-guilherme-tebaldis-projects.vercel.app/	templesale2-o914guuq2-guilherme-tebaldis-projects.vercel.app	US			1775052382940	1775052382940	0
705	2026-03-31	e144417b8677afbfba4fdd6d25c70ff7f2fc52b34516755d9c1e293ac9388527	54.153.35.18	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-n4ywq2jvy-guilherme-tebaldis-projects.vercel.app/	templesale2-n4ywq2jvy-guilherme-tebaldis-projects.vercel.app	US			1774974758372	1774974766984	1
749	2026-03-31	386338e87d8b126fa062d0bd8a17a3c27a99a8e418e3e0fc83bd6d9327138e62	54.241.143.53	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-1j5nwkit2-guilherme-tebaldis-projects.vercel.app/	templesale2-1j5nwkit2-guilherme-tebaldis-projects.vercel.app	US			1774976370187	1774976370187	1
750	2026-03-31	3264488c175a1e77eee526d0265c8a3166ef8515701d8b7c9698d198d0b0da91	54.151.95.57	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-1j5nwkit2-guilherme-tebaldis-projects.vercel.app/	templesale2-1j5nwkit2-guilherme-tebaldis-projects.vercel.app	US			1774976370160	1774976370160	1
752	2026-03-31	3243ae3db3dd4afc3bbd7c640fb5cbb236909296df328373b33e6fa77f1b0238	64.23.144.184	vercel-screenshot/1.0	/	https://templesale2-1j5nwkit2-guilherme-tebaldis-projects.vercel.app/	templesale2-1j5nwkit2-guilherme-tebaldis-projects.vercel.app	US			1774976370711	1774976370711	0
753	2026-03-31	becc09e7301f33a5468d53916528cef4f55d7d0aa76008c62922a321a6a1b256	64.23.248.169	vercel-screenshot/1.0	/	https://templesale2-1j5nwkit2-guilherme-tebaldis-projects.vercel.app/	templesale2-1j5nwkit2-guilherme-tebaldis-projects.vercel.app	US			1774976370901	1774976370901	0
754	2026-03-31	e1048e37cc39678b8e866ef2044d53709298b28636a7a2ffde314c88b809d6c3	64.23.144.184	vercel-screenshot/1.0	/	https://templesale2-1j5nwkit2-guilherme-tebaldis-projects.vercel.app/	templesale2-1j5nwkit2-guilherme-tebaldis-projects.vercel.app	US			1774976370389	1774976370389	1
755	2026-03-31	d1644fe1f43aebc52b731d5d1783a60f6a76bf571c002f8a2e2ad25553c06954	64.23.248.169	vercel-screenshot/1.0	/	https://templesale2-1j5nwkit2-guilherme-tebaldis-projects.vercel.app/	templesale2-1j5nwkit2-guilherme-tebaldis-projects.vercel.app	US			1774976370339	1774976370339	1
762	2026-03-31	e0064c01aed397064659e733a6fa159a373781f3499c2e265f7db304b4c416ba	172.70.216.156	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.3 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1774976536279	1774986205057	3
973	2026-04-01	bec3c074b9e7a00f8a9ff31b74d930f4be18e1899bfe6d8bd2332472e30c6589	143.244.191.158	vercel-screenshot/1.0	/	https://templesale2-fvxugdrad-guilherme-tebaldis-projects.vercel.app/	templesale2-fvxugdrad-guilherme-tebaldis-projects.vercel.app	US			1775049573892	1775049574194	1
975	2026-04-01	410301b6b8e3922bd6e143003747163d3c6bb109fabceeb4e11deade8c05edb6	54.183.198.179	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-fvxugdrad-guilherme-tebaldis-projects.vercel.app/	templesale2-fvxugdrad-guilherme-tebaldis-projects.vercel.app	US			1775049573893	1775049573893	1
2189	2026-06-04	91b69100f310ea5171bb1858904c24c8b546f0053c9e8ff4f28f0f3499f5a3f3	104.23.211.87	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1780578783545	1780578783545	1
976	2026-04-01	471a954bc5db14aa3657cd297b7bc365451efe9e8764f9d114c20a02f7913ab4	146.190.163.245	vercel-screenshot/1.0	/	https://templesale2-fvxugdrad-guilherme-tebaldis-projects.vercel.app/	templesale2-fvxugdrad-guilherme-tebaldis-projects.vercel.app	US			1775049573990	1775049576200	1
978	2026-04-01	3d800199963277da620003334988a04ec850033a5b1bf6215f35749dda47c522	54.219.29.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-fvxugdrad-guilherme-tebaldis-projects.vercel.app/	templesale2-fvxugdrad-guilherme-tebaldis-projects.vercel.app	US			1775049577393	1775049577393	1
1954	2026-05-11	0a733fbce254d1497c519e24e37e3832427615b4cd6638b0da644e626ce6aa2b	172.70.34.168	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1778506105921	1778506105921	1
1044	2026-04-01	d2b3410253e15a1fbc7890b2e08e806429a48668e5c16911c737e5d63370e609	64.23.231.164	vercel-screenshot/1.0	/	https://templesale2-561l5dmhk-guilherme-tebaldis-projects.vercel.app/	templesale2-561l5dmhk-guilherme-tebaldis-projects.vercel.app	US			1775050338070	1775050338647	1
1045	2026-04-01	fe7f94d729c370367476e6381960227426b7dde79c6e170f01f62b201171ffbd	64.23.232.81	vercel-screenshot/1.0	/	https://templesale2-561l5dmhk-guilherme-tebaldis-projects.vercel.app/	templesale2-561l5dmhk-guilherme-tebaldis-projects.vercel.app	US			1775050338167	1775050340606	1
910	2026-04-01	59c0ebc1241c5b2319c672607a0de7247c53960e6bbe935546c6b9604c4d7d61	172.70.216.157	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	DE			1775048168769	1775053916439	2
1337	2026-04-02	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	217.200.37.204	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/146.0.7680.151 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1775113648579	1775138971986	3
986	2026-04-01	f0ef69cead38e84fa9147f76afc920d9abbd8bb0634f864bc193eed64e4df854	217.200.37.204	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3.1 Safari/605.1.15	/	https://www.templesale.com/	www.templesale.com	DE			1775049799898	1775053972291	3
1333	2026-04-01	1a4ace0d1f8ed13476d4029fe6f67d8863a84c7e36914072c8c85d4e7ffec2bf	172.70.38.160	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1775072424187	1775072424187	1
473	2026-03-31	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	217.200.37.204	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/146.0.7680.151 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1774949752644	1774977006153	5
991	2026-04-01	e0064c01aed397064659e733a6fa159a373781f3499c2e265f7db304b4c416ba	217.200.37.204	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.3 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1775049844019	1775051862138	1
1293	2026-04-01	97a3a3b8a62f431e03d8c88eab9d348c1a8ef32ca2dc208f286171ddcb0b59fb	54.215.195.230	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-87p8i4jsu-guilherme-tebaldis-projects.vercel.app/	templesale2-87p8i4jsu-guilherme-tebaldis-projects.vercel.app	US			1775053736113	1775053736113	1
1295	2026-04-01	e19b700278f46f80fcede4210a36196f60dbc2e5d0a18bd499ee4e4e0fd72180	54.219.196.111	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-87p8i4jsu-guilherme-tebaldis-projects.vercel.app/	templesale2-87p8i4jsu-guilherme-tebaldis-projects.vercel.app	US			1775053736148	1775053736148	1
1208	2026-04-01	a90101c96c23626f2b14979e1760ecfe987dac038d34c18e44804aaa0f8e11bc	54.219.185.178	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-o914guuq2-guilherme-tebaldis-projects.vercel.app/	templesale2-o914guuq2-guilherme-tebaldis-projects.vercel.app	US			1775052382377	1775052382377	1
1122	2026-04-01	f85a9aa444571af0f2b71b6116fd971afaf5568b8444fb2ce29a661104459898	13.56.115.44	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-exqbfhad8-guilherme-tebaldis-projects.vercel.app/	templesale2-exqbfhad8-guilherme-tebaldis-projects.vercel.app	US			1775051259171	1775051259171	1
1211	2026-04-01	40b418e1ab0764aec169eb122cd498ce2c126b0dab1105364bd39cbd6dfca470	143.244.191.158	vercel-screenshot/1.0	/	https://templesale2-o914guuq2-guilherme-tebaldis-projects.vercel.app/	templesale2-o914guuq2-guilherme-tebaldis-projects.vercel.app	US			1775052382554	1775052382554	1
1123	2026-04-01	0e974022719e6113a4bbd2139c225c1df234aab9443dbcff50d165f81fe1e821	64.23.187.165	vercel-screenshot/1.0	/	https://templesale2-exqbfhad8-guilherme-tebaldis-projects.vercel.app/	templesale2-exqbfhad8-guilherme-tebaldis-projects.vercel.app	US			1775051259262	1775051259717	1
1212	2026-04-01	76a5918709ae27d6dc0fb132a7685435842b9452e3f93404652722b8627f9dd4	209.38.75.54	vercel-screenshot/1.0	/	https://templesale2-o914guuq2-guilherme-tebaldis-projects.vercel.app/	templesale2-o914guuq2-guilherme-tebaldis-projects.vercel.app	US			1775052383480	1775052383480	0
1124	2026-04-01	7334c9e1adb15ebb68b49ac0273a3ddb0eb5e6de5e44640a083db497769b9641	64.23.135.197	vercel-screenshot/1.0	/	https://templesale2-exqbfhad8-guilherme-tebaldis-projects.vercel.app/	templesale2-exqbfhad8-guilherme-tebaldis-projects.vercel.app	US			1775051259652	1775051259652	1
1125	2026-04-01	2f6b5cc6a5097b1ea17e01e76aee6422fda1dc01bb3eac1b3b68299856186968	54.177.152.94	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-exqbfhad8-guilherme-tebaldis-projects.vercel.app/	templesale2-exqbfhad8-guilherme-tebaldis-projects.vercel.app	US			1775051259399	1775051259399	1
1210	2026-04-01	bb3d09fdb1c143f833a1578415668e05875d104863351b4c191c8599e49d47a2	209.38.75.54	vercel-screenshot/1.0	/	https://templesale2-o914guuq2-guilherme-tebaldis-projects.vercel.app/	templesale2-o914guuq2-guilherme-tebaldis-projects.vercel.app	US			1775052382567	1775052382567	1
1294	2026-04-01	d313a4978b319dd0499fb763e44c66220d6bc7bd42c865e349bdd9c5d40dcbaa	146.190.163.245	vercel-screenshot/1.0	/	https://templesale2-87p8i4jsu-guilherme-tebaldis-projects.vercel.app/	templesale2-87p8i4jsu-guilherme-tebaldis-projects.vercel.app	US			1775053736304	1775053736304	1
1536	2026-04-07	244ddbff5a7b9d7ca4a385fcc45b45495bcadd3e0999014124122ba3c3f387fb	162.158.116.94	Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1775555453229	1775565396837	2
1296	2026-04-01	1971b7e5cfd81c93c7e303335e747133acc9d69e79fc486c2db9afdf9179cf2a	147.182.199.40	vercel-screenshot/1.0	/	https://templesale2-87p8i4jsu-guilherme-tebaldis-projects.vercel.app/	templesale2-87p8i4jsu-guilherme-tebaldis-projects.vercel.app	US			1775053736498	1775053737144	1
1907	2026-05-09	95de8ede7e44566ebd11e98bc36f20d389e3b2231ae67ebdeb40165ad9626ffd	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778341053662	1778341053662	1
1544	2026-04-07	a0bdbc6a749b594b9e050df7e1c5105e29ba3c7ef579fa93edf85bf36d023d95	180.153.236.206	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1775589468049	1775589471630	1
1550	2026-04-09	5bb37be644832cca5c138be263bb8429d87a7401d8c6a8a8e46f9afd88b20c34	104.23.166.124	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1775708213337	1775708215800	1
1589	2026-04-13	47742f336d19590346310041d39bc17e3c945f382e301907698b6713f4e84da5	149.56.150.165	Mozilla/5.0 (compatible; Dataprovider.com)	/	https://www.templesale.com/	www.templesale.com	CA			1776100780574	1776100780574	1
1423	2026-04-02	01e8404340af17335cf7b8fbb2a41140bedae5ec66de3740874b61fc59014d5c	50.18.244.202	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-6dkof0icn-guilherme-tebaldis-projects.vercel.app/	templesale2-6dkof0icn-guilherme-tebaldis-projects.vercel.app	US			1775137012605	1775137012605	1
1424	2026-04-02	04f7e0a640db07bdbc4065e1f3fe97777cda53f20bf8c366a4456cc4ed8b6518	137.184.121.221	vercel-screenshot/1.0	/	https://templesale2-6dkof0icn-guilherme-tebaldis-projects.vercel.app/	templesale2-6dkof0icn-guilherme-tebaldis-projects.vercel.app	US			1775137012634	1775137012634	1
1303	2026-04-01	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	217.200.37.204	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/146.0.7680.151 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1775053754366	1775076067156	4
1335	2026-04-01	f9ee53209d7ae70dafa118d51505def67179acd1070d8d62a6d2ba9ca07d26e3	180.153.236.228	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1775086272494	1775086277551	1
1340	2026-04-02	2c7e0eda2560b738729dd1395e4c865af8904d99d56e1e7311e9b08b4663db24	172.70.216.156	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	DE			1775135912281	1775137131203	2
1359	2026-04-02	54fadecfefab61489fba84641384d21b57e080c78140568d8e9ab38adcfd353d	52.53.246.152	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-65lrxvq68-guilherme-tebaldis-projects.vercel.app/	templesale2-65lrxvq68-guilherme-tebaldis-projects.vercel.app	US			1775136353506	1775136353506	1
1360	2026-04-02	795657fe6a1f1de093cea752d6c1c1d4d6104dc0e117902449e603c6754bc6ea	54.219.210.137	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-65lrxvq68-guilherme-tebaldis-projects.vercel.app/	templesale2-65lrxvq68-guilherme-tebaldis-projects.vercel.app	US			1775136353607	1775136353607	1
1361	2026-04-02	a28af3df641fcbbf649f25e4d533d8700a76a3623549befa89c00ce254e0c2af	64.23.135.197	vercel-screenshot/1.0	/	https://templesale2-65lrxvq68-guilherme-tebaldis-projects.vercel.app/	templesale2-65lrxvq68-guilherme-tebaldis-projects.vercel.app	US			1775136353817	1775136354737	1
1362	2026-04-02	39dcdf454b4e78c48bf931206ad681ad3e5b5396bdadc198841f57b581933723	24.199.113.242	vercel-screenshot/1.0	/	https://templesale2-65lrxvq68-guilherme-tebaldis-projects.vercel.app/	templesale2-65lrxvq68-guilherme-tebaldis-projects.vercel.app	US			1775136353875	1775136356200	1
1396	2026-04-02	120bf23eb1c7455b5eafefc747d6392c7c38d056760a187a2081948549033308	54.193.86.45	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-inzsorb7p-guilherme-tebaldis-projects.vercel.app/	templesale2-inzsorb7p-guilherme-tebaldis-projects.vercel.app	US			1775136755633	1775136755633	1
1399	2026-04-02	b8032469aaeda3daf28c0ed6bbd8cd31bb39429c69ab6d2393947a90a505745b	54.177.117.60	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-inzsorb7p-guilherme-tebaldis-projects.vercel.app/	templesale2-inzsorb7p-guilherme-tebaldis-projects.vercel.app	US			1775136755817	1775136755817	1
1397	2026-04-02	8e387d998eb01e324171b34f235e66677ade8f4076e2bc66d831affcf321569c	164.92.78.205	vercel-screenshot/1.0	/	https://templesale2-inzsorb7p-guilherme-tebaldis-projects.vercel.app/	templesale2-inzsorb7p-guilherme-tebaldis-projects.vercel.app	US			1775136755796	1775136756594	1
1398	2026-04-02	8cadd974be577d875dbb305fb5aad9b2f831c95b7d8f40f91a74eb2786c8833f	147.182.199.40	vercel-screenshot/1.0	/	https://templesale2-inzsorb7p-guilherme-tebaldis-projects.vercel.app/	templesale2-inzsorb7p-guilherme-tebaldis-projects.vercel.app	US			1775136755797	1775136757942	1
1425	2026-04-02	0be96f461f292f7706a17ebb1c7538fb56bc98ab7a3bb8906c741b4a98f76e56	143.198.63.243	vercel-screenshot/1.0	/	https://templesale2-6dkof0icn-guilherme-tebaldis-projects.vercel.app/	templesale2-6dkof0icn-guilherme-tebaldis-projects.vercel.app	US			1775137012671	1775137012671	1
1538	2026-04-07	6fb28ada9533f724bc2ad62484a81d0730fbf24fd4f5c8827bae97fdbe37f827	2a03:2880:21ff:6::	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/	https://www.facebook.com/	www.facebook.com	US			1775568846441	1775568878434	1
2096	2026-06-02	bf70ef9ee6b3928f42e1c391a51f1ceb4d3afaf86356b51ccf1dd7f38cd5eb15	85.18.30.4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	DE			1780396842522	1780396842522	1
1546	2026-04-07	df4226557ab6a92f221d6e459ee93db7ade720500b85a1db9f976fb5b11b499b	172.71.98.225	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1775589472517	1775589476902	1
1552	2026-04-09	244ddbff5a7b9d7ca4a385fcc45b45495bcadd3e0999014124122ba3c3f387fb	217.171.64.97	Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1775719242111	1775730837070	2
1558	2026-04-09	6e2556c7e2875f5b983b8f2961a3bdc28fbf2dcdb2dcbfea9ea02af49833c6c3	172.69.9.110	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.47 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1775730985231	1775730985231	1
1560	2026-04-09	c762492f46af7e94614103c3f7b285c5556320c0dd684e0f0380341a437404ab	172.70.206.102	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1775753511125	1775753511125	1
1563	2026-04-10	467bb435a8662cca25fc23d8e49eae41a12bc81010333780e02b0fca6f8e0ecf	172.69.176.158	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.60 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	SG			1775808996220	1775808996220	1
1566	2026-04-10	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	217.200.37.204	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.47 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1775817374584	1775817374584	1
1568	2026-04-10	a736354b3933d7fc87164e5b2c76f6158dfb9ad2ce3e95ad77543a51b35e15d5	180.153.236.170	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1775837008864	1775837013335	1
1570	2026-04-10	ac43e39ddfc602ece2fd4f4e29bb170c124aec62645909f4fdb392c523867f08	108.162.246.246	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/136.0.7103.49 Safari/537.36	/register	https://www.templesale.com/register	www.templesale.com	US			1775852756669	1775852756669	0
1571	2026-04-10	fae5a05beb5ec554ca8c59a7102a09ede1a97c5f8ae7e9d25685f83f922ac0ff	40.77.177.38	Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/100.0.4896.127 Safari/537.36	/register			US			1775853850024	1775853850024	1
1572	2026-04-11	1becf9746a1fe27f15cdb9f4fd17205c451d6ded8a555adcd0cb006b24ef8738	172.68.175.21	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1775876335821	1775876335821	1
1573	2026-04-11	84102eb02b8f5e9beec01118ea8f56e905e3d14a060ab9f4b5cb8dafeced3872	104.23.211.87	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0	/	https://www.google.com/	www.google.com	US			1775901280196	1775901280196	1
1574	2026-04-11	c78d4c5f0c5f0c83a8901c2bafffc18775eb3f2efa612014cc6de72dda91de4a	172.70.38.195	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0	/	https://www.google.com/	www.google.com	US			1775908981962	1775908981962	1
1575	2026-04-11	256037458e65a1ead06af97155f5f04d26512fd740aa034622c37527086aaee3	3.89.231.12	Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.2; WOW64; Trident/5.0)	/	https://www.templesale.com/	www.templesale.com	US			1775922938188	1775922951069	1
1577	2026-04-11	6446f7254ffe26df573603e39116ee8de6602ac930d385bdba57d49fc1906cf2	172.71.203.82	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1775943203698	1775943203698	1
1578	2026-04-12	e633a0c786af954c8a102cfbc981325230f70c053268362942f54de5387faec3	180.153.236.247	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1775975227055	1775975247967	1
1580	2026-04-12	bbcfca40dfa3bb7440cb69c1fe1bef7d2787d1d47cbbaff4cce427cafe8fc5f9	172.70.38.194	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1776026815780	1776026815780	1
1581	2026-04-13	1cf6121c47bbf4de2f4f866e184bb865e517e7e763c1bcc4777dccca2997e4aa	102.129.232.26	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1776045970679	1776045970679	1
1582	2026-04-13	46ab24abbf9a9b93790f934ca9607c11fa2dc5ac90170ef35ee54c15e4c7bf59	180.153.236.67	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1776048960778	1776048964958	1
1584	2026-04-13	244ddbff5a7b9d7ca4a385fcc45b45495bcadd3e0999014124122ba3c3f387fb	162.158.130.29	Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1776077436315	1776077436315	1
1590	2026-04-13	80059479fc3d9f43392da7ca87fc7149edc9c5c7b82dbeff7550673825b30a40	162.158.187.11	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1776120026041	1776120041660	1
1594	2026-04-15	59c0ebc1241c5b2319c672607a0de7247c53960e6bbe935546c6b9604c4d7d61	217.200.37.204	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	FR			1776255705713	1776255705713	1
1598	2026-04-16	260ca6ff9aebf024e3852a16a77897bd5bc8adb06a0a07cdbf853450145dd535	202.8.40.91	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1776346019279	1776346019279	1
1426	2026-04-02	11f15d72a955e766dd63e3c905ee99ea2e435b778613cc9c4536f3c9ca9eae91	143.198.63.243	vercel-screenshot/1.0	/	https://templesale2-6dkof0icn-guilherme-tebaldis-projects.vercel.app/	templesale2-6dkof0icn-guilherme-tebaldis-projects.vercel.app	US			1775137012917	1775137012917	0
1427	2026-04-02	c235a78b9a4fb72a34583e4327fccbe4433ff92dea5dfb963bf101105ca314c3	137.184.121.221	vercel-screenshot/1.0	/	https://templesale2-6dkof0icn-guilherme-tebaldis-projects.vercel.app/	templesale2-6dkof0icn-guilherme-tebaldis-projects.vercel.app	US			1775137012992	1775137012992	0
1428	2026-04-02	0a431f4bbe578517d439c2605862f88b3b460eff4196662070ca5f4bbc362e5d	13.57.228.38	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.7390.0 Safari/537.36	/	https://templesale2-6dkof0icn-guilherme-tebaldis-projects.vercel.app/	templesale2-6dkof0icn-guilherme-tebaldis-projects.vercel.app	US			1775137012662	1775137012662	1
1906	2026-05-09	edcdeb7b512995e6e523f01774cf45b444308cef3699a2525072d52b3241fe59	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778341000648	1778341075816	1
1436	2026-04-02	59c0ebc1241c5b2319c672607a0de7247c53960e6bbe935546c6b9604c4d7d61	217.200.37.204	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	FR			1775155446630	1775155449020	1
1438	2026-04-03	9c40c76f81e3037a74d663c5a16a8c253c59eed042c91286d3a38b2836ca81a1	202.8.43.49	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1775232261614	1775232261614	1
1439	2026-04-03	59c0ebc1241c5b2319c672607a0de7247c53960e6bbe935546c6b9604c4d7d61	172.69.9.110	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1775242041637	1775242940229	2
1464	2026-04-03	a61439371f4cde152eea5211d74173c04a11e6ef1114adfa74a334e3f7782e0d	172.69.11.243	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1775242863267	1775243973594	1
1474	2026-04-04	a61439371f4cde152eea5211d74173c04a11e6ef1114adfa74a334e3f7782e0d	172.69.91.86	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	/mini-motosega-a-batteria-li-ion-ls-004-48v-barra-6-381	https://www.templesale.com/mini-motosega-a-batteria-li-ion-ls-004-48v-barra-6-381	www.templesale.com	BR			1775269639022	1775269765524	2
1479	2026-04-04	59c0ebc1241c5b2319c672607a0de7247c53960e6bbe935546c6b9604c4d7d61	172.70.216.154	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	FR			1775306459459	1775306459459	1
1480	2026-04-04	bc53230fdc0d719acab6800efb153f501c8e6a81221803358f4babb9842c3ad2	172.71.183.47	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1775314693669	1775314693669	1
1481	2026-04-04	6a27d9a1f971cac0df2c86b88832ac4958d21b33f1f0ca58c647d23db2cc4e17	40.77.179.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/136.0.7103.49 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1775321578536	1775321581129	1
1483	2026-04-04	6d533d216ccb1418a74fc5439ed7e78032255b98cf894c2c5118490678861e6f	202.8.43.49	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1775343525592	1775343528626	1
1485	2026-04-05	a61439371f4cde152eea5211d74173c04a11e6ef1114adfa74a334e3f7782e0d	2804:2958:12f:2f00:e9d:a5d4:e9cd:273a	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1775348260510	1775348260510	1
1486	2026-04-05	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	172.70.216.156	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/146.0.7680.151 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1775370638704	1775370674400	1
1488	2026-04-05	42f572fac0ca33452a13f5bfbd680c923bc4adca6569629dd3edbfe2a119a5a4	172.71.183.47	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1775401174320	1775401174320	1
1489	2026-04-06	0f45e22722c0974016526f4ef7912806f0186d3d6c52035a369d5934fd609193	172.70.47.159	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1775439941646	1775439945507	1
1491	2026-04-06	12f23e23e1ff6d95b410943ffe3c33bc21cacc98181aaaab6247ccce1959bf92	180.153.236.142	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1775447679340	1775447685121	1
1493	2026-04-06	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	37.163.229.59	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/146.0.7680.151 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1775461578601	1775461638176	1
1496	2026-04-06	244ddbff5a7b9d7ca4a385fcc45b45495bcadd3e0999014124122ba3c3f387fb	217.171.77.12	Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1775475398899	1775475398899	1
1497	2026-04-06	f3ad7e79c9d5fead089321b4795de9ddfd298d9697d4dd3277f6a16c1dbc80ea	172.70.115.9	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1775502143974	1775502143974	1
1498	2026-04-06	95fdb8a1bc69ec86520f2dad9f17fb64b083a4588530dcdbe04e3d3931aa25d6	172.71.103.195	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1775509844373	1775509851748	1
1500	2026-04-07	a1d09036c643225d87c0364080311c368a44aa6e4a6a7da98aa26b540468f454	93.35.197.53	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1775545297104	1775545750409	1
2031	2026-06-01	97fb58ec64e2d92d59db34cc657ad53d331aac92128bbbeb64189698560102c2	188.114.102.145	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.5 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1780321691866	1780321782030	1
1910	2026-05-10	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	172.71.114.26	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0.7778.100 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1778402813527	1778444456265	3
1508	2026-04-07	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	78.211.21.130	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/146.0.7680.151 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1775549852595	1775550750274	1
1539	2026-04-07	2510243fa4d520a05f1b39e95eeb0c656d05de30af2c6941362f78c5adee36dc	2a03:2880:11ff:50::	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/	https://www.facebook.com/	www.facebook.com	US			1775568846545	1775568886452	1
1548	2026-04-07	aefd13fd6fc391de178a45cd1b98534a35df244ac17a84dcef88df8cc78f1545	180.153.236.44	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1775589496321	1775589500258	1
2138	2026-06-02	2f3313e5c13a73e228bc84c80f928f4673d27f7312e8b0e132b2ee0df9ef841b	217.200.36.187	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.3 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1780399095132	1780405226630	3
1556	2026-04-09	891fbc342018a12d93be2cd521d05eb807a8e953970f63e4a72240fd82501d22	202.8.43.49	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1775730725682	1775730725682	1
1559	2026-04-09	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	37.160.189.251	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.47 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	FR			1775731017311	1775731017311	1
1561	2026-04-09	d9c00c7ca9297c3d5960c7f3bdea302498389e9f27e319df8f924367a369d2b8	172.71.95.65	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1775761559924	1775761562948	1
1564	2026-04-10	53d00e634fe7d1a0529efa7dd173051389d3f94d914dc1cd74949616e62861fc	103.136.221.229	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.60 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	SG			1775808998372	1775808998372	1
1565	2026-04-10	762d918b39c803bcddf614a37f4eea8bcd578662a31ead8a378938f687b9c524	103.136.221.232	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.60 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	SG			1775808999595	1775808999595	1
1567	2026-04-10	537f4f08723de5e7400a12f4874ddbce3ce8cc34f654437c9645e20aee9b8a3f	205.169.39.44	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.5938.132 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1775819044385	1775819044385	1
1937	2026-05-11	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	172.69.9.110	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0.7778.100 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1778468548535	1778495389832	4
1956	2026-05-11	8176409d2ccc29d1a6744646a187dfe48e3f065f1f92a232dc360e053f0cfd09	138.229.102.3	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1778518151023	1778518151023	1
1959	2026-05-13	ec0c8be80ddce7536ea0be46816251bf7285455b3668b9f53be6f05054104a8a	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778657146680	1778657146680	1
1962	2026-05-14	733beb2c6f0e397f2a399621b781dfba77506ce8f46b2d90e1ae61aecaf8e368	104.23.209.67	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1778764124889	1778764128067	1
1965	2026-05-14	13062ac619a99b2a0a16eb9b0a238e066fa73701360b2e154b505523f0b5c623	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778776782977	1778776782977	1
1967	2026-05-15	302e6b7b3d0cd4659c8cdc5a7212b9d20a2529775e67aed6b9ef3c1626777f6d	184.72.116.225	Nokia6230i/2.0 (03.80) Profile/MIDP-2.0 Configuration/CLDC-1.1	/	https://www.templesale.com/	www.templesale.com	US			1778852603415	1778852603415	1
1969	2026-05-17	b04a3bddb10cc9e4f74cb13d8877dc36a4a3ab45df88c41c6675d93590f6b89b	104.22.101.124	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0	/	https://www.google.com/	www.google.com	US			1779004306704	1779004306704	1
1971	2026-05-17	f058dfc2cc60e5b7057d6e78f1f38e24bf92e2feeae32a50c038a3afa7c8e672	172.69.39.130	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1779008654299	1779008654299	1
1973	2026-05-18	83550c81a30a41580319432cf1ad8e8bd3f8bcc928dffaa2f228909b2ed19992	172.71.238.132	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1779124789140	1779124789140	1
1975	2026-05-18	96cee7c7d9697f507d6dd16e386a35ca7a836542f19518935b7fb2e7c3cb6f3a	172.70.80.181	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	CA			1779144814082	1779144833751	1
1979	2026-05-20	e5ec4d98ebe15d7e5340f591e6de7999e009c2e2500f28181017a3cc8c33d89f	172.71.195.122	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1779282522594	1779282522594	1
1981	2026-05-20	2c0106f6ebfe9b4c3580dcac91bbde71c749147c8152a17fa2a7d726957a89a4	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1779300141332	1779300141332	1
1911	2026-05-10	09096e9702f91a721a629721670da198cda4e672840ec93cc50d9bcf76cb32d5	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778433653697	1778433653697	1
1585	2026-04-13	b4968e6ed768463d96f0ad8bf39976c391f7173ea3049168d1a3ba500083448c	180.153.236.243	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1776083426353	1776083427879	1
2037	2026-06-01	f02d762f8b95bd46ecfc9529925fab7abf7535bb97892547ba22542620230e90	104.22.10.86	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1780327862657	1780327862657	1
1587	2026-04-13	ada4db994774e9e4a84c2471f44890a1a44d39ae3437c01ee6c79de454cae14c	104.23.211.87	Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.29 Safari/537.36 OPR/15.0.1147.24 (Edition Next)	/	https://www.templesale.com/	www.templesale.com	US			1776086979661	1776086987692	1
1940	2026-05-11	ee707a837f66325ac0979b8b50a97fd0e0e66954fbb191930091fce7801f2f4d	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778488244389	1778488302348	1
1592	2026-04-14	0c26dc258ebed8b132e460e3ce1c6634e0bbf95213ba39a73bce4d184474fc5d	172.70.46.24	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1776209508237	1776209515294	1
1957	2026-05-11	9575132a07db89e642568633582491797e134efd55b6da176c8a84cb3a1f298a	162.158.62.254	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1778530449539	1778530449539	1
1960	2026-05-13	6ea07dbd74005314ced7608d6e445f1a695f98de5f7d7442743f1c88147497c6	162.158.79.190	Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:49.0) Gecko/20100101 Firefox/49.0	/	https://www.templesale.com/	www.templesale.com	US			1778690243918	1778690254852	1
1964	2026-05-14	6b1e8f4e440cb9aa8a3f2795fd4f31ea8bed6e03c9bc832c3bd09221b0852d0d	108.162.242.48	Mozilla/5.0 (compatible; Dataprovider.com)	/	https://www.templesale.com/	www.templesale.com	CA			1778775389894	1778775389894	1
1966	2026-05-15	f9135180e7fee53e11b320bbbc290b95302161ad2405ad39f1d1b6e2d26bc0d4	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778823139816	1778823139816	1
1968	2026-05-16	776ec38f6524505c01e2a3f71e2611e746c348dce9399dccc0f05d584f9e239a	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778947832783	1778947832783	1
1970	2026-05-17	b1fdc6cb4e2a0b054b58c5e8bd9633cbf3699941e79889f232c13708d52515d5	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1779008612878	1779008612878	1
1972	2026-05-17	68a449a7f40a35ae8df1845f5810e08cabb8b4e74af50c88c7083d92be91b599	172.70.38.159	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1779023490946	1779023490946	1
1974	2026-05-18	af02a848be89e52f81a18fddc6d5638f856580e6f109ab22c4d58bdb841cb64e	108.162.242.47	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	CA			1779144810129	1779144834129	1
1978	2026-05-19	4a41bcf4a00f32d97e3eb5ef0f0ac58350c9f53624c25d94e85d95d4e72b60ae	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1779182199425	1779182199425	1
1980	2026-05-20	06d5faf8b976dbca2d6ca24c27234c916dc7bbd0a311211800733bf24046cb57	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1779300094250	1779300094250	1
1982	2026-05-20	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	172.69.68.66	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0.7778.166 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1779301906429	1779301936739	1
1984	2026-05-21	8dfb63a4a0d361ab87b541504edcbea61bf2174ca5220fcfb920a7941f33dd3b	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1779354210081	1779354210081	1
1985	2026-05-21	95d29eb083057f64e8db62928e3a5945fc79a983db809db42dc7b8245ae57305	104.23.254.88	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1779354279384	1779354279384	1
1986	2026-05-21	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	37.160.51.254	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0.7778.166 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1779357737674	1779384653277	2
1991	2026-05-22	63fca299845cdf9b2ae5ac122b948715acc69798c566ec24bc112ac5ccae5ea5	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1779427100026	1779427100026	1
1992	2026-05-22	be1ac1ff73b4e8e6e0d9184534a8278250f86d5b9718e331c8f3006e170c8067	172.69.39.66	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1779427134035	1779427134035	1
1993	2026-05-22	a1e168c910871985cd94f06f8b64f94544702f66fcd1b171b1fbe55ab70854c3	146.112.163.46	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1779428274396	1779428281819	1
1995	2026-05-22	93b157e3681880d0f60f37f073f36dce5d5671f06e0f3b9b3314e9b08e2ce321	143.244.47.83	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/143.0.7499.4 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1779484290781	1779484292719	1
1997	2026-05-23	673f9618a743c5b10f3cdb5f65b73ea62a062cf55882b04819b580355ad6756a	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1779515443613	1779515443613	1
1595	2026-04-15	a74cde4783996026c4210ea3553eadb28b34b20bae769ed393f67fae65348206	212.56.53.187	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1776268322641	1776268337496	1
1597	2026-04-16	f3ccc1998722f0d71c92a5906ccc48bbc2eead7b4bb066437c1515cf070f8bd5	162.158.186.16	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1776300345447	1776300345447	1
1912	2026-05-10	0bf88e845ec34c314cd38c006df9eafed180deb612b08dfa6d39b6bc9fc4f0af	104.23.254.97	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778433702948	1778433702948	1
1599	2026-04-17	59163c6ffe81dc4c558b7d4b9e558874952ce71c9867f7bacc91021c6d8a65a8	172.70.38.195	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1776440850593	1776440865683	1
1601	2026-04-17	bcfccc51deecdd1441d618124a38c7a1508c247b2260597bfda9f7c0b317bea0	104.143.84.9	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1776463720652	1776463761091	1
1603	2026-04-19	e928a8b5e1115303eb33c48c235f3c42f146058cc9fff70f9d0d276f737c5fbf	180.153.236.8	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1776576932265	1776576932265	1
1604	2026-04-19	3af0bdacc2432d6059af583c2869089db485434b9a6135bad777d79692beff59	104.23.172.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1776636609878	1776636616877	1
1606	2026-04-19	3fc31706f87335b9e91d78a8048e0d5c47520db548090a9547c600e1415c35c0	180.153.236.85	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1776636624143	1776636629860	1
1607	2026-04-19	9ab008b7818195e497d815b523c60bf138e253d94f3ce7acc3d5e8fffbd5f99c	162.159.113.131	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1776636626050	1776636631104	1
1610	2026-04-20	e0064c01aed397064659e733a6fa159a373781f3499c2e265f7db304b4c416ba	172.70.216.157	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.3 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1776697368698	1776697368698	1
1611	2026-04-20	64dd5807c607db0a917960ccc06afa127e3671dc2befd90b7f12c35a5a8048a1	162.158.116.94	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1776697553692	1776697553692	1
1612	2026-04-21	f29783617c400b0c9093c7938974f1e4a581f9a3b2ca1adc53e013cb6887f966	162.159.122.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	FR			1776768251177	1776768251177	1
1613	2026-04-21	e0064c01aed397064659e733a6fa159a373781f3499c2e265f7db304b4c416ba	78.208.71.230	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.3 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1776775733325	1776775814601	1
1615	2026-04-21	220a85dace9493f2ca32ccc5b5a6a34cb91899615e1dad6d1fa75166cc1e877c	180.153.236.68	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1776793020714	1776793024496	1
1617	2026-04-22	65c1cb5ac5e95e74e7869741b73c2197566b6194c4c555286855129165cea9e2	172.71.95.65	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1776824720336	1776824727496	1
1619	2026-04-22	fef61567b98d97b4baf534eeecd17a89fd0a0f468a3aec55d041a1fd5991623f	104.23.166.77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1776899197592	1776899230653	1
1622	2026-04-23	76308fcb440399e35cc3445c8ad2841d788dbb9eec5288316673f15626361d58	180.153.236.234	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1776925171749	1776925171749	1
1623	2026-04-23	e0064c01aed397064659e733a6fa159a373781f3499c2e265f7db304b4c416ba	172.69.68.90	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.3 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	FR			1776932830977	1776932830977	1
1624	2026-04-23	d2839580f707ffeee0ed8e43b84b9c5dd232216f71cb2afb63111dae9537d863	162.158.90.148	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1776940090328	1776940090328	1
1625	2026-04-23	97fb58ec64e2d92d59db34cc657ad53d331aac92128bbbeb64189698560102c2	172.68.234.226	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.5 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	FR			1776966285984	1776969629726	2
1630	2026-04-23	56073752f76e1df0944d857a056124a1582f633f8799756d05b533dc0e720943	172.71.98.224	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1776982293556	1776982297500	1
1632	2026-04-24	6a9e18377cdfb990bb6ccebdddeb2885ee4b7b26f620f4f68daf87951eaf39c2	162.159.113.131	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1776991384005	1776991390810	1
1634	2026-04-24	30a49ee6cb5e3baca016181bbf15f1866a2890f9c79b71b4ff6d917a367c492f	180.153.236.212	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1776995469111	1776995469111	1
1635	2026-04-24	c20e94755a1718b2946fd0dae85359e556dc44b90357268dacd470adbd80db42	172.71.183.47	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1776998520817	1776998520817	1
2038	2026-06-02	c5a3a70e713b815ac1d4cf9d526711089f220b6f76ead8dd0d2e10679018db6d	104.23.254.89	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1780373596076	1780373596076	1
1636	2026-04-24	6549d9f54c989423b67bbcec50f092736175a21ec5d725eeb4d4aa3a2291474e	172.71.95.66	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1777009835350	1777009840823	1
1640	2026-04-24	838245f57828fe8b94860ff35d21e73bd3735f9324722dc854e5de2e2031eef0	172.70.47.160	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1777028445539	1777028449265	1
1639	2026-04-24	15f5f8f47fbf8db30b43ba89175e9d25c9fb72100c3a90e2eb50a83120750bdb	180.153.236.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1777028445096	1777028452807	1
1644	2026-04-24	c65ea529645e9219c44b7680fae5a1f3d811d87bcdeb20b2237d587e72a2d552	104.143.84.56	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1777032375355	1777032375355	1
1643	2026-04-24	daadbe16c9aa531812f2497dec0a6b99b95933f1a589517d88520cab135a0d83	172.71.195.121	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1777032323788	1777032380874	1
1646	2026-04-25	969c4029f300cb4c173d7b31b9ad3b40b4ff8d68c957ee36aadd14e3031c243a	172.71.183.48	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1777110325979	1777110332434	1
1648	2026-04-25	ddeb95b9218d908336dcd7e350378b497e3542c32f523d18a5fdd0f56179b896	180.153.236.91	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1777150406989	1777150411374	1
1650	2026-04-26	1e216ad11f85d9df1322ad608753c9f537758f69f6493699d89fbaecd4118e80	141.101.76.38	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1777202995027	1777202999986	1
1913	2026-05-10	e0064c01aed397064659e733a6fa159a373781f3499c2e265f7db304b4c416ba	217.200.37.135	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.3 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1778441563108	1778444442264	3
1652	2026-04-26	6fd7406f84f94ff889ba5bb5234f2dae7597d43a1c8fde6a5a35c9ca4064e388	180.153.236.230	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1777209079191	1777209083544	1
1654	2026-04-27	142c0d1a6d454c29f4382799fb621e6ae4962cb6d007bc86544d60e8dd152595	172.70.46.126	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1777294836247	1777294836247	1
1655	2026-04-28	7dbba8869058d6bbc26ac32e134eecf0282c62efd5c4b1f21db857fd2917a36f	162.159.113.69	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1777367460040	1777367460040	1
1656	2026-04-28	6fdb9e53b2ffd9fe520521bfa0c3aef60a8abedb0460c8ac0a57d1a3c92ab4a5	104.23.187.166	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1777398124886	1777398124886	1
1941	2026-05-11	8eaaa347cd16c2476b3530362d119588a9aeef34989f9deb22d76f72c1b80c16	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778488296745	1778488296745	1
1958	2026-05-12	3eccfa6e95999b3f8f13316dceb20f4411ba5f07ab17abef10a95127849d1076	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778605690785	1778605690785	1
1657	2026-04-28	ea20100616be4c1e15cb3dc97b8092d182315bbc79dd20a320cee87e164216cc	108.162.245.11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	/	https://www.facebook.com/	www.facebook.com	US			1777417940808	1777417973552	1
1662	2026-04-29	5ab3e3517f027b92c2f5a650a96d874c48bc2cf305b3de73308034c199f109d2	104.143.84.8	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1777426144836	1777426144836	1
1660	2026-04-29	c591e7d8fef22cd390605bc34e177896b3083ec5e1cc66f353bbab9354cf8caa	172.70.38.207	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1777426089145	1777426151091	1
1664	2026-04-29	15032aae3ac2f123c90696b9c7814e7a19ff66d57a9b331a2a92b9bbb677e7ec	204.101.161.15	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1777480639528	1777480644467	1
1666	2026-04-29	6cf55ee0cadfe7e4a066356732aa1ed0cc5d7b22136648a1afc1596fa00c19fe	180.153.236.107	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1777491999895	1777492006148	1
1671	2026-04-30	b12b6fde9aa221d023e0ba06d3721294d5ce2c3ee2e9da3593ea8f418b2c9d90	149.57.176.87	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1777556622925	1777556622925	1
1668	2026-04-30	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	172.69.68.66	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1	/vintage-cd-422	https://www.templesale.com/vintage-cd-422	www.templesale.com	DE			1777534291367	1777563858823	2
1672	2026-04-30	71684fd1d972bb8d787d5c0f5c5ba755d43da2814aa25762ea688bb3b0beab7f	149.57.191.177	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1777557376401	1777557376401	1
2039	2026-06-02	a725d246cfb6b1ec8a31f365dd07b22302fd05e240f6bb47ec998be41a523810	104.23.254.89	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1780373624807	1780373624807	0
1675	2026-04-30	3731e8961ae5fdb5deb7980829c5e944c63b799e36d60c0ac7f5f8a605af1416	180.153.236.8	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1777590025589	1777590030172	1
1678	2026-04-30	3daf2157b1650499aaeaeb508ef0576a01bb8c666d675e2dee92448a5a699d44	104.143.84.57	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1777592450165	1777592450165	1
1677	2026-04-30	9a2db2a4d98e21a789bd4296a2018acc5f48a42ef8c682298c453cae82edb31c	104.143.84.57	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1777592420651	1777592451844	1
1680	2026-05-01	dfd841b7acaa766e768bd07643a5db9dc18b1ec6ad62d6352fcb3b4d8217eeeb	149.57.176.185	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1777649614453	1777649614453	1
1681	2026-05-02	69ea001de8ac7a1e899764a2de8cc5604032935558b065f5850a8f9cc6f36036	66.84.90.89	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1777736669831	1777736669831	1
1683	2026-05-02	0995b3ba187930a5603f21fbff6f1c5f5843ce595e1c9c1ecf9527ea0cc91d55	104.143.84.57	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1777763930338	1777763930338	1
1682	2026-05-02	c86c42e5d116a48a726840c9faff4d37973618c25020cd592cf6f69efe37b80a	172.70.34.168	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1777763894303	1777763940764	1
1685	2026-05-03	11a56fd2ad144e5722feaea393fe2658c14c2b85de71bcdf97cdc3259a504c28	162.159.113.68	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0; 360Spider	/	https://www.templesale.com/	www.templesale.com	DE			1777820638042	1777820643801	1
1687	2026-05-04	c18b90e6c7ec89c81836a877a7dee5bddf65f55f17ec44e24606445381948704	149.20.245.13	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1777912269439	1777912269439	1
1688	2026-05-04	b20e6581876ba1f8d065fb39ca069a43779ea759e076093455267d5568245393	172.71.234.8	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1777938257574	1777938257574	1
1689	2026-05-04	ed7de7d4bc3a1e00494cbaaa2dfc0f5aa0acda1ff5c48f74febcf7b01787c588	172.71.11.129	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1777938303265	1777938303265	1
1690	2026-05-05	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	217.200.37.135	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1777984113556	1778008486907	2
1700	2026-05-06	56b3e2862865639ec0f6f9648eb849ed0fc7ec9ca107ac2ff1e09b9cfc435308	172.69.138.92	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778048254964	1778048309657	1
1702	2026-05-06	4ceaa7c11bdb622fad16c079d27716fa8bd89364eac28470df72d360310f007d	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778048314345	1778048314345	1
1703	2026-05-07	9d4e2267ad7f1be787bdcd0103cbfe86ade3e236962b504aa3b56e4c0c360b83	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778167572406	1778167572406	1
1704	2026-05-07	b2b24a27aad121745ce4cf66f65e8c0544e2dd48e0488e04bc4e380b51353bf6	104.23.254.97	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778167608117	1778167608117	1
1705	2026-05-08	f9e4034b9f3eeb162ee5f5a8be6cd2864ca666b286ad07b62cc58ddc3a3085ff	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778211300228	1778211300228	1
1710	2026-05-08	59c0ebc1241c5b2319c672607a0de7247c53960e6bbe935546c6b9604c4d7d61	217.200.37.135	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	DE			1778267140205	1778271804549	1
1706	2026-05-08	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	172.71.114.26	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1778250201458	1778271895455	3
1914	2026-05-10	ea7f974ba0f7780f72842ad71621dddd92228f2ed199f840c0459bff58bd88f3	2804:8c0:75c4:6501:e495:8ad4:2126:55b7	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1778441621092	1778454605004	2
1951	2026-05-11	e0064c01aed397064659e733a6fa159a373781f3499c2e265f7db304b4c416ba	172.70.216.156	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.3 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1778496933621	1778515259487	2
1998	2026-05-23	c82c283c16c357220449ffeb5d1b014f0357e832c1388f13f83cb345ad405f63	104.23.213.121	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1779540791940	1779540791940	1
1999	2026-05-25	29666fc34f18b0ea7c8ab9e83b8b3060cef280fa337f4cad299adb02ac524361	54.174.58.241	Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; HubSpot Crawler; +https://www.hubspot.com) Chrome/131.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	US			1779676101230	1779676103439	1
2001	2026-05-25	3f23183668a5f5f69c00c055bc5fd3edf9d9c0fe7f1118bb52f3079853c22eaa	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1779691450737	1779691480883	1
2003	2026-05-26	2089fca53f15576181dd818d0acc6d060426043128bf95d11387faec7c61a97f	172.70.110.25	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1779799589668	1779799589668	1
2004	2026-05-27	23a881e77b4ae49c23d90c1343a307c20dd0f24092a33a86c68ae37b8dbedada	172.68.187.24	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1779871141249	1779871181760	1
2006	2026-05-29	d8aaf0d1633ef39b63eea9dc44564f61a5962fe0e170a710b2dbea89b9d3ab66	154.7.240.99	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1780039793743	1780039805793	1
2008	2026-05-29	5f4826ae51dd1d23496c19a46ba168669a1fa9e1e203d96a0c9d3f4957326e2a	104.23.209.66	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1780060324801	1780060324801	1
2009	2026-06-01	3d23627643766810d7fd82c9df2d43e8651630c26a8963e9db678eaad45b40cf	104.23.213.120	Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)	/	https://www.templesale.com/	www.templesale.com	US			1780318918977	1780318918977	1
2010	2026-06-01	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	78.212.116.142	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0.7778.166 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1780320281540	1780327708601	2
2051	2026-06-02	b5a2ff2ff296fc0c986df8ed88a0634cee77e47bc60853f03a4b11611254f45e	217.200.36.187	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0.7778.166 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1780395608088	1780402364343	3
2179	2026-06-02	68b9cb16dff1598640b8b4d281ad35231df69bbc48f99f633af955300c87a641	172.69.91.86	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1780414445877	1780414571774	1
2184	2026-06-02	be50f01246d63e2e2ffa6040f95c4658fe0f5a7e7793226ab812ef907779a155	78.211.210.26	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	/	https://www.google.com/	www.google.com	DE			1780424338098	1780424367708	1
2146	2026-06-02	ad991126f7395f161a6b721331d0dec574cb33ecbac2c08e6460f5e218fa28a9	172.69.68.67	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	/	https://www.google.com/	www.google.com	DE			1780399327674	1780424974411	2
2187	2026-06-04	32e0095ff423358af310457e05c37a6bcce23545da295fe8b3d8cb5921323893	172.69.11.27	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/139.0.7258.5 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	BR			1780543652544	1780543652544	1
2188	2026-06-04	2f3313e5c13a73e228bc84c80f928f4673d27f7312e8b0e132b2ee0df9ef841b	172.70.216.74	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.3 Mobile/15E148 Safari/604.1	/	https://www.templesale.com/	www.templesale.com	DE			1780563965977	1780563965977	1
2040	2026-06-02	59c0ebc1241c5b2319c672607a0de7247c53960e6bbe935546c6b9604c4d7d61	217.200.36.187	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	/	https://www.templesale.com/	www.templesale.com	DE			1780394126088	1780397140575	2
\.


--
-- Data for Name: support_conversations; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.support_conversations (id, user_id, subject, status, created_at, updated_at, user_last_seen_message_id) FROM stdin;
3	29	\N	open	2026-01-22 18:21:23.236757+00	2026-01-22 18:23:15.075963+00	29
\.


--
-- Data for Name: support_messages; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.support_messages (id, conversation_id, sender_type, sender_id, content, created_at) FROM stdin;
28	3	user	29	kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk	2026-01-22 18:21:23.265582+00
29	3	admin	\N	e ai o que seria o problema !	2026-01-22 18:23:15.038259+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.users (id, username, email, phone, country, state, city, district, street, zip, password, created_at, profile_image_url, rating_avg, rating_count, accepted_privacy_at, accepted_terms_at, accepted_community_at, accepted_version, accepted_legal_payload, accepted_ip, accepted_user_agent, accepted_terms_version, accepted_privacy_version, accepted_community_version, is_banned, ban_reason, auth0_sub, company_name, company_description, company_address, company_city, company_state, company_country, company_lat, company_lng, cover_image_url, cover_theme, profile_frame, neighborhood, whatsapp_country_iso, whatsapp_number, name, password_hash, password_salt, avatar_url, preferred_locale, new_product_defaults, location_latitude, location_longitude) FROM stdin;
29	Eduardo Mateus eichtalt	eduardomateuseichtalt@gmail.com	\N	BR	\N	\N	\N	\N	\N	$2b$10$XXizi0BIdY47pkFdtdmxWuHu78567z6QU59pGNHRwPQyUvHD4qkg2	2025-12-11 19:42:06.933015	https://lh3.googleusercontent.com/a/ACg8ocJ7GXGCF1L9yuQiYse_H6Uqzm8gsSX6ORKbhh3X-TufxltRtw=s96-c	0.00	0	2025-12-20 14:41:02.854+00	2025-12-20 14:41:02.854+00	2025-12-20 14:41:02.854+00	\N	{"source": "legal-page", "accepted_at": "2025-12-20T14:41:02.854Z"}	\N	\N	2025-10-27	2025-10-27	2025-10-27	f	\N	google-oauth2|110500384492473968254	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N		IT		\N	\N	\N		it-IT	{}	\N	\N
111	tebaldiguilherme.roma@gmail.com	tebaldiguilherme.roma@gmail.com	\N	Italia	Lazio	Roma	\N		\N	7b89ebe6ddc256a9a6ab6e48d334381e49b7d3945162553d1a7aa068d3dada418c3abce505ef7715e771b28f84f32599c2148e58b4a1e433457fa89356314065	2026-02-28 20:28:09.557306	\N	0.00	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N		IT	1111111	Guilherme Tebaldi	7b89ebe6ddc256a9a6ab6e48d334381e49b7d3945162553d1a7aa068d3dada418c3abce505ef7715e771b28f84f32599c2148e58b4a1e433457fa89356314065	0b09ca6d2852dbe6369bf8b1897f2f49	https://res.cloudinary.com/dymox62b9/image/upload/v1772310508/templesale/products/profiles/avatar_user_111_1772310507437_0af6608bb208.png	\N	{}	\N	\N
119	salah15mahfoud@gmail.com	salah15mahfoud@gmail.com	\N	Italia	Lazio	Roma	\N	Via laurantina35,500km	\N	fdb5aaf5ae7106c2aa1507b89548b462ad1d9687d7ff8d4093475aec2f94fad2553b5159c77017f6cf77a2e82d5efacd924c14726aa321f077388caa9109e9aa	2026-03-10 12:37:14.546998	\N	0.00	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N		IT	3409880401	Bazar casa blanca	fdb5aaf5ae7106c2aa1507b89548b462ad1d9687d7ff8d4093475aec2f94fad2553b5159c77017f6cf77a2e82d5efacd924c14726aa321f077388caa9109e9aa	3e2610cb624cd469ee1d6c4c70dffb04	https://res.cloudinary.com/dymox62b9/image/upload/v1773146301/templesale/products/profiles/avatar_user_119_1773146300692_fe6c52a01ea3.jpg	\N	{"name":"Statue decorative","category":"Casa, Móveis e Decoração","latitude":"41.589994","longitude":"12.523298","description":"Diversi statue decorative, in terracotta gesso","details":{}}	\N	\N
112	cris@tebaldi.com	cris@tebaldi.com	\N	\N	\N	\N	\N	\N	\N	37289bffddf0530476907a764c947e3afbdebb684e78c1993ac6a10bc9974529a5efe246ec2fd8325f92d0531f0307dddb2334d6ac40397fc3857e776e86ce8c	2026-03-01 00:11:50.360604	\N	0.00	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N		IT		dde	37289bffddf0530476907a764c947e3afbdebb684e78c1993ac6a10bc9974529a5efe246ec2fd8325f92d0531f0307dddb2334d6ac40397fc3857e776e86ce8c	64c5317416c8dc78dbe3e0817fe9d1e3		\N	{}	\N	\N
117	guilhermemagiccloseup@gmail.com	guilhermemagiccloseup@gmail.com	\N				\N		\N	48469cb9d7b2ba7de104a15038d7b5e75aa83e4b3eec5f0afb40bc731ecd581954b286e28ce31be5a8b381b5c638e5715b7979bb3ad31018f83a6e74f118141c	2026-03-06 18:26:55.245893	\N	0.00	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N		IT	3513055041	Gui	48469cb9d7b2ba7de104a15038d7b5e75aa83e4b3eec5f0afb40bc731ecd581954b286e28ce31be5a8b381b5c638e5715b7979bb3ad31018f83a6e74f118141c	53a5173a40f8c2e6d54373c4610ee202	https://res.cloudinary.com/dymox62b9/image/upload/v1775050196/templesale/products/profiles/avatar_user_117_1775050195646_a7cf90b14d59.jpg	\N	{}	\N	\N
\.


--
-- Data for Name: users_backup; Type: TABLE DATA; Schema: public; Owner: saleday_user
--

COPY templesale.users_backup (id, username, email, phone, country, state, city, district, street, zip, password, created_at) FROM stdin;
1	João Silva	joao@email.com	1199999999	Brasil	SP	São Paulo	Centro	Rua A	01000-000	$2b$10$JaTXpfIxORl5SPwoYYUWqOQlZKQfxFYrt0XHPiDjfRVzEzS98FG/G	2025-10-20 10:35:38.24751
2	Maria Souza	maria@email.com	21988888888	Brasil	RJ	Rio de Janeiro	Copacabana	Rua B	22000-000	$2b$10$A0v/2UVzRAlZOOugLyWkGuBYaGQmC5WToVgjLcGsVsMWc3Y96wzqO	2025-10-20 11:03:26.649808
4	Cristiane tebaldi	admin@eskimo.com	49999102026	brasil	santa catarina	chapeco	jardem america 	martinho lutero	00292992929	$2b$10$b.rHEcBcG7r3/DdLjbR/zOLIsUx1lG6Mj4qOCHOS3Lj2te4DebiJu	2025-10-20 12:18:14.691708
5	miguel de oliva	miguel@oliva.com	\N	\N	\N	\N	\N	\N	\N	$2b$10$bUQA55Qsx22/GMv106BJIu0JAuyE2deloNdq/KPbJF71uSTws06NK	2025-10-21 09:56:57.850723
3	Gui_ADM	guilhermetebaldi.curso@gmail.com	47999678478	Brasil	SC	Chapecó ense	jardim america 	Bairro: Jardim América Rua: Martinho Lutero, 2600e, casa	89803-301	$2b$10$xkdK4XYhHMeiPMR0Y.TloOOGEZMafrwNt9FwU2OvLPM9/mSQjxA8K	2025-10-20 11:17:22.290374
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saleday_user
--

SELECT pg_catalog.setval('templesale.activity_logs_id_seq', 899, true);


--
-- Name: admin_visitor_self_signatures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saleday_user
--

SELECT pg_catalog.setval('templesale.admin_visitor_self_signatures_id_seq', 37, true);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saleday_user
--

SELECT pg_catalog.setval('templesale.favorites_id_seq', 177, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saleday_user
--

SELECT pg_catalog.setval('templesale.messages_id_seq', 1085, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saleday_user
--

SELECT pg_catalog.setval('templesale.orders_id_seq', 49, true);


--
-- Name: product_cart_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saleday_user
--

SELECT pg_catalog.setval('templesale.product_cart_notifications_id_seq', 9, true);


--
-- Name: product_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saleday_user
--

SELECT pg_catalog.setval('templesale.product_comments_id_seq', 10, true);


--
-- Name: product_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saleday_user
--

SELECT pg_catalog.setval('templesale.product_questions_id_seq', 70, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saleday_user
--

SELECT pg_catalog.setval('templesale.products_id_seq', 424, true);


--
-- Name: remember_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saleday_user
--

SELECT pg_catalog.setval('templesale.remember_tokens_id_seq', 147, true);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saleday_user
--

SELECT pg_catalog.setval('templesale.reviews_id_seq', 35, true);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saleday_user
--

SELECT pg_catalog.setval('templesale.sessions_id_seq', 57, true);


--
-- Name: site_daily_visitors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saleday_user
--

SELECT pg_catalog.setval('templesale.site_daily_visitors_id_seq', 2189, true);


--
-- Name: support_conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saleday_user
--

SELECT pg_catalog.setval('templesale.support_conversations_id_seq', 3, true);


--
-- Name: support_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saleday_user
--

SELECT pg_catalog.setval('templesale.support_messages_id_seq', 29, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saleday_user
--

SELECT pg_catalog.setval('templesale.users_id_seq', 119, true);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_visitor_self_signatures admin_visitor_self_signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.admin_visitor_self_signatures
    ADD CONSTRAINT admin_visitor_self_signatures_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_user_product_uniq; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.favorites
    ADD CONSTRAINT favorites_user_product_uniq UNIQUE (user_id, product_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_cart_notifications product_cart_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_cart_notifications
    ADD CONSTRAINT product_cart_notifications_pkey PRIMARY KEY (id);


--
-- Name: product_comments product_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_comments
    ADD CONSTRAINT product_comments_pkey PRIMARY KEY (id);


--
-- Name: product_likes product_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_likes
    ADD CONSTRAINT product_likes_pkey PRIMARY KEY (user_id, product_id);


--
-- Name: product_questions product_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_questions
    ADD CONSTRAINT product_questions_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: remember_tokens remember_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.remember_tokens
    ADD CONSTRAINT remember_tokens_pkey PRIMARY KEY (id);


--
-- Name: remember_tokens remember_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.remember_tokens
    ADD CONSTRAINT remember_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.sessions
    ADD CONSTRAINT sessions_token_hash_key UNIQUE (token_hash);


--
-- Name: site_daily_visitors site_daily_visitors_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.site_daily_visitors
    ADD CONSTRAINT site_daily_visitors_pkey PRIMARY KEY (id);


--
-- Name: support_conversations support_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.support_conversations
    ADD CONSTRAINT support_conversations_pkey PRIMARY KEY (id);


--
-- Name: support_messages support_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.support_messages
    ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);


--
-- Name: favorites uq_fav; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.favorites
    ADD CONSTRAINT uq_fav UNIQUE (user_id, product_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_admin_self_signatures_email_last_seen; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_admin_self_signatures_email_last_seen ON templesale.admin_visitor_self_signatures USING btree (admin_email, last_seen_at DESC);


--
-- Name: idx_admin_self_signatures_unique; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE UNIQUE INDEX idx_admin_self_signatures_unique ON templesale.admin_visitor_self_signatures USING btree (admin_email, signature_key);


--
-- Name: idx_orders_buyer; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_orders_buyer ON templesale.orders USING btree (buyer_id);


--
-- Name: idx_orders_product; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_orders_product ON templesale.orders USING btree (product_id);


--
-- Name: idx_orders_seller; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_orders_seller ON templesale.orders USING btree (seller_id);


--
-- Name: idx_product_cart_notifications_owner_created; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_product_cart_notifications_owner_created ON templesale.product_cart_notifications USING btree (owner_user_id, created_at DESC);


--
-- Name: idx_product_cart_notifications_product; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_product_cart_notifications_product ON templesale.product_cart_notifications USING btree (product_id);


--
-- Name: idx_product_cart_notifications_product_id; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_product_cart_notifications_product_id ON templesale.product_cart_notifications USING btree (product_id);


--
-- Name: idx_product_comments_parent; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_product_comments_parent ON templesale.product_comments USING btree (parent_comment_id);


--
-- Name: idx_product_comments_product_created; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_product_comments_product_created ON templesale.product_comments USING btree (product_id, created_at DESC);


--
-- Name: idx_product_likes_product_id; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_product_likes_product_id ON templesale.product_likes USING btree (product_id);


--
-- Name: idx_product_likes_user_product_unique; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE UNIQUE INDEX idx_product_likes_user_product_unique ON templesale.product_likes USING btree (user_id, product_id);


--
-- Name: idx_product_questions_product; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_product_questions_product ON templesale.product_questions USING btree (product_id);


--
-- Name: idx_product_questions_response_user; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_product_questions_response_user ON templesale.product_questions USING btree (response_user_id);


--
-- Name: idx_products_brand_ci; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_products_brand_ci ON templesale.products USING btree (lower(brand));


--
-- Name: idx_products_color_ci; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_products_color_ci ON templesale.products USING btree (lower(color));


--
-- Name: idx_products_created_at; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_products_created_at ON templesale.products USING btree (created_at DESC);


--
-- Name: idx_products_hidden_by_seller; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_products_hidden_by_seller ON templesale.products USING btree (hidden_by_seller);


--
-- Name: idx_products_last_clicked; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_products_last_clicked ON templesale.products USING btree (last_clicked_at DESC);


--
-- Name: idx_products_last_viewed; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_products_last_viewed ON templesale.products USING btree (last_viewed_at DESC);


--
-- Name: idx_products_lat; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_products_lat ON templesale.products USING btree (lat);


--
-- Name: idx_products_lat_lng; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_products_lat_lng ON templesale.products USING btree (lat, lng);


--
-- Name: idx_products_lng; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_products_lng ON templesale.products USING btree (lng);


--
-- Name: idx_products_manual_rank_active; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_products_manual_rank_active ON templesale.products USING btree (manual_rank_position, manual_rank_expires_at DESC);


--
-- Name: idx_products_metrics; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_products_metrics ON templesale.products USING btree (clicks_count DESC, views_count DESC);


--
-- Name: idx_products_model_ci; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_products_model_ci ON templesale.products USING btree (lower(model));


--
-- Name: idx_products_rank; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_products_rank ON templesale.products USING btree (rank DESC);


--
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_products_status ON templesale.products USING btree (status);


--
-- Name: idx_products_user; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_products_user ON templesale.products USING btree (user_id);


--
-- Name: idx_products_user_id; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_products_user_id ON templesale.products USING btree (user_id);


--
-- Name: idx_reviews_order_id; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE UNIQUE INDEX idx_reviews_order_id ON templesale.reviews USING btree (order_id) WHERE (order_id IS NOT NULL);


--
-- Name: idx_reviews_reviewee; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_reviews_reviewee ON templesale.reviews USING btree (reviewee_id);


--
-- Name: idx_reviews_updated_at; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_reviews_updated_at ON templesale.reviews USING btree (updated_at);


--
-- Name: idx_sessions_token_hash; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_sessions_token_hash ON templesale.sessions USING btree (token_hash);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_sessions_user_id ON templesale.sessions USING btree (user_id);


--
-- Name: idx_site_daily_visitors_date_key; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE UNIQUE INDEX idx_site_daily_visitors_date_key ON templesale.site_daily_visitors USING btree (visit_date, visitor_key);


--
-- Name: idx_site_daily_visitors_date_last_seen; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_site_daily_visitors_date_last_seen ON templesale.site_daily_visitors USING btree (visit_date, last_seen_at DESC);


--
-- Name: idx_support_conversations_updated_at; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_support_conversations_updated_at ON templesale.support_conversations USING btree (updated_at DESC);


--
-- Name: idx_support_messages_conversation; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_support_messages_conversation ON templesale.support_messages USING btree (conversation_id, created_at);


--
-- Name: idx_users_accepted_guidelines_at; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_users_accepted_guidelines_at ON templesale.users USING btree (accepted_community_at);


--
-- Name: idx_users_accepted_privacy_at; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_users_accepted_privacy_at ON templesale.users USING btree (accepted_privacy_at);


--
-- Name: idx_users_accepted_terms_at; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_users_accepted_terms_at ON templesale.users USING btree (accepted_terms_at);


--
-- Name: idx_users_company_country; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX idx_users_company_country ON templesale.users USING btree (company_country, company_state, company_city);


--
-- Name: idx_users_email_unique; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE UNIQUE INDEX idx_users_email_unique ON templesale.users USING btree (email);


--
-- Name: remember_tokens_user_idx; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE INDEX remember_tokens_user_idx ON templesale.remember_tokens USING btree (user_id);


--
-- Name: uniq_orders_product_confirmed; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE UNIQUE INDEX uniq_orders_product_confirmed ON templesale.orders USING btree (product_id) WHERE (status = 'confirmed'::text);


--
-- Name: users_auth0_sub_unique; Type: INDEX; Schema: public; Owner: saleday_user
--

CREATE UNIQUE INDEX users_auth0_sub_unique ON templesale.users USING btree (auth0_sub) WHERE (auth0_sub IS NOT NULL);


--
-- Name: favorites fk_fav_product; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.favorites
    ADD CONSTRAINT fk_fav_product FOREIGN KEY (product_id) REFERENCES templesale.products(id) ON DELETE CASCADE;


--
-- Name: favorites fk_fav_user; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.favorites
    ADD CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES templesale.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.messages
    ADD CONSTRAINT messages_product_id_fkey FOREIGN KEY (product_id) REFERENCES templesale.products(id) ON DELETE CASCADE;


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES templesale.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES templesale.users(id) ON DELETE CASCADE;


--
-- Name: orders orders_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.orders
    ADD CONSTRAINT orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES templesale.users(id) ON DELETE CASCADE;


--
-- Name: orders orders_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.orders
    ADD CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES templesale.products(id) ON DELETE CASCADE;


--
-- Name: orders orders_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.orders
    ADD CONSTRAINT orders_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES templesale.users(id) ON DELETE CASCADE;


--
-- Name: product_cart_notifications product_cart_notifications_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_cart_notifications
    ADD CONSTRAINT product_cart_notifications_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES templesale.users(id) ON DELETE SET NULL;


--
-- Name: product_cart_notifications product_cart_notifications_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_cart_notifications
    ADD CONSTRAINT product_cart_notifications_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES templesale.users(id) ON DELETE CASCADE;


--
-- Name: product_cart_notifications product_cart_notifications_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_cart_notifications
    ADD CONSTRAINT product_cart_notifications_product_id_fkey FOREIGN KEY (product_id) REFERENCES templesale.products(id) ON DELETE CASCADE;


--
-- Name: product_comments product_comments_parent_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_comments
    ADD CONSTRAINT product_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES templesale.product_comments(id) ON DELETE CASCADE;


--
-- Name: product_comments product_comments_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_comments
    ADD CONSTRAINT product_comments_product_id_fkey FOREIGN KEY (product_id) REFERENCES templesale.products(id) ON DELETE CASCADE;


--
-- Name: product_comments product_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_comments
    ADD CONSTRAINT product_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES templesale.users(id) ON DELETE CASCADE;


--
-- Name: product_likes product_likes_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_likes
    ADD CONSTRAINT product_likes_product_id_fkey FOREIGN KEY (product_id) REFERENCES templesale.products(id) ON DELETE CASCADE;


--
-- Name: product_likes product_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_likes
    ADD CONSTRAINT product_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES templesale.users(id) ON DELETE CASCADE;


--
-- Name: product_questions product_questions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_questions
    ADD CONSTRAINT product_questions_product_id_fkey FOREIGN KEY (product_id) REFERENCES templesale.products(id) ON DELETE CASCADE;


--
-- Name: product_questions product_questions_response_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_questions
    ADD CONSTRAINT product_questions_response_user_id_fkey FOREIGN KEY (response_user_id) REFERENCES templesale.users(id);


--
-- Name: product_questions product_questions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.product_questions
    ADD CONSTRAINT product_questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES templesale.users(id);


--
-- Name: products products_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.products
    ADD CONSTRAINT products_user_id_fkey FOREIGN KEY (user_id) REFERENCES templesale.users(id) ON DELETE CASCADE;


--
-- Name: remember_tokens remember_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.remember_tokens
    ADD CONSTRAINT remember_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES templesale.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.reviews
    ADD CONSTRAINT reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES templesale.orders(id) ON DELETE SET NULL;


--
-- Name: reviews reviews_reviewee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.reviews
    ADD CONSTRAINT reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES templesale.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.reviews
    ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES templesale.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES templesale.users(id) ON DELETE CASCADE;


--
-- Name: support_conversations support_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.support_conversations
    ADD CONSTRAINT support_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES templesale.users(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.support_messages
    ADD CONSTRAINT support_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES templesale.support_conversations(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saleday_user
--

ALTER TABLE ONLY templesale.support_messages
    ADD CONSTRAINT support_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES templesale.users(id);


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--



--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--



--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--



--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--



--
-- PostgreSQL database dump complete
--

\unrestrict b6fFdpecjXY7eoTOnHSYoE1ZFNicdZxBkOH7FY6bDLjSJsGuhgbeuILlkPQF7a7

