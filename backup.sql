--
-- PostgreSQL database dump
--

\restrict kMBzvMqAmCMTEPLANMTMxifBNktFlozhPVOzeovwMIFmgRLksR1mjnbY86mb5xy

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: booking_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking_requests (
    id integer NOT NULL,
    client_id integer NOT NULL,
    musician_id integer NOT NULL,
    requested_date text NOT NULL,
    requested_time text NOT NULL,
    venue text NOT NULL,
    event_type text NOT NULL,
    notes text,
    status text DEFAULT 'pending'::text NOT NULL,
    musician_response text,
    admin_notes text,
    event_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.booking_requests OWNER TO postgres;

--
-- Name: booking_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.booking_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.booking_requests_id_seq OWNER TO postgres;

--
-- Name: booking_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.booking_requests_id_seq OWNED BY public.booking_requests.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    address text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: event_musicians; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_musicians (
    id integer NOT NULL,
    event_id integer NOT NULL,
    musician_id integer NOT NULL,
    fee numeric(10,2)
);


ALTER TABLE public.event_musicians OWNER TO postgres;

--
-- Name: event_musicians_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.event_musicians_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_musicians_id_seq OWNER TO postgres;

--
-- Name: event_musicians_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.event_musicians_id_seq OWNED BY public.event_musicians.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id integer NOT NULL,
    title text NOT NULL,
    client_id integer,
    date text NOT NULL,
    "time" text NOT NULL,
    venue text NOT NULL,
    event_type text NOT NULL,
    status text DEFAULT 'pendiente'::text NOT NULL,
    total_amount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    advance_amount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_id_seq OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    event_id integer,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    category text DEFAULT 'otro'::text NOT NULL,
    date text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expenses_id_seq OWNER TO postgres;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: musicians; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.musicians (
    id integer NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    instruments text NOT NULL,
    specialty text,
    rate numeric(10,2),
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.musicians OWNER TO postgres;

--
-- Name: musicians_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.musicians_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.musicians_id_seq OWNER TO postgres;

--
-- Name: musicians_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.musicians_id_seq OWNED BY public.musicians.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    event_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    type text NOT NULL,
    method text NOT NULL,
    date text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'approved'::text NOT NULL,
    stripe_session_id text
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    client_id integer,
    musician_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    approval_status text DEFAULT 'active'::text NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: booking_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_requests ALTER COLUMN id SET DEFAULT nextval('public.booking_requests_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: event_musicians id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_musicians ALTER COLUMN id SET DEFAULT nextval('public.event_musicians_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: musicians id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.musicians ALTER COLUMN id SET DEFAULT nextval('public.musicians_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: booking_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.booking_requests (id, client_id, musician_id, requested_date, requested_time, venue, event_type, notes, status, musician_response, admin_notes, event_id, created_at, updated_at) FROM stdin;
3	8	7	2026	20:30	Arboleda	Boda	Formal	confirmed	\N	Cualquier duda comuníquese al número +52 00000	3	2026-04-16 04:27:51.752455	2026-04-16 04:33:55.747
4	8	7	2026-03-08	20:00	Arboleda	Cumpleaños	\N	confirmed	\N	Dudas al 0000	36	2026-04-16 04:57:00.474376	2026-04-16 04:58:33.238
5	8	7	2026-06-06	20:30	FEMSA	Evento corporativo	\N	confirmed	\N	\N	37	2026-04-22 22:30:56.347111	2026-04-22 22:35:35.414
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, name, phone, email, address, notes, created_at) FROM stdin;
8	Julio Covarrubias	+528118682189	juliocov@icloud.com	\N	\N	2026-04-16 04:25:59.180908
10	María García	555-0100	cliente@ejemplo.com	Calle Principal 123	Cliente demo	2026-04-16 05:24:30.528153
\.


--
-- Data for Name: event_musicians; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_musicians (id, event_id, musician_id, fee) FROM stdin;
2	3	7	3000.00
35	36	7	3000.00
36	37	7	5000.00
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, title, client_id, date, "time", venue, event_type, status, total_amount, advance_amount, notes, created_at) FROM stdin;
3	Boda Julio	8	2026	20:30	Arboleda	Boda	confirmado	15000.00	0.00	Cualquier duda comuníquese al número +52 00000	2026-04-16 04:33:55.739331
36	Cumpleaños Julio	8	2026-03-08	20:00	Arboleda	Cumpleaños	confirmado	15000.00	0.00	Dudas al 0000	2026-04-16 04:58:33.229963
37	Corporativo Julio	8	2026-06-06	20:30	FEMSA	Evento corporativo	confirmado	20000.00	0.00	\N	2026-04-22 22:35:35.367059
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, event_id, description, amount, category, date, notes, created_at) FROM stdin;
1	\N	Honorario Iván	3000.00	musician_payment	2026-04-16	\N	2026-04-16 04:55:57.230459
\.


--
-- Data for Name: musicians; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.musicians (id, name, phone, email, instruments, specialty, rate, notes, created_at) FROM stdin;
7	Ivan Triana	0005555	ivan@empresa.com	Violín	Pop	3000.00	\N	2026-04-16 04:26:47.58027
9	Carlos Martínez	555-0200	musico@ejemplo.com	Guitarra	Jazz y Bossa Nova	1500.00	Músico demo	2026-04-16 05:24:30.539596
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, event_id, amount, type, method, date, notes, created_at, status, stripe_session_id) FROM stdin;
2	3	5000.00	anticipo	efectivo	2026-04-16	\N	2026-04-16 04:38:01.108675	approved	\N
3	37	10000.00	pago_parcial	efectivo	2026-04-22	\N	2026-04-22 22:40:07.002036	approved	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, name, role, client_id, musician_id, created_at, approval_status) FROM stdin;
1	admin@cuartoarte.com	$2b$10$J/mJ.dlRPwFpBV9mqUlymOpJ/c9vSzpptiqDtRZvJ5MeY7UnDXkhu	Administrador	admin	\N	\N	2026-03-23 08:10:16.99458	active
8	cliente@ejemplo.com	$2b$10$ajQ6OXMv03ARszgjeIRzVux0nn9pWKmEQFuo9gppJumtoM/x2IYNq	María García	client	\N	\N	2026-04-16 04:14:06.24972	active
9	musico@ejemplo.com	$2b$10$vtxQupNCwp9atzM8J675X.y5Bmv0arPr9hEbp3N54YU/CZoWF4l9q	Carlos Martínez	musician	\N	\N	2026-04-16 04:14:06.338628	active
11	ivan@empresa.com	$2b$10$OoVA95ZXArichntrv15F3eDEbgWgAdtOs9CtGtsVam0oBLsgY3Do6	Ivan Triana	musician	\N	7	2026-04-16 04:26:47.583773	active
10	juliocov@icloud.com	$2b$10$EnUkHiepM5BJJNY1DcLsqOnuMXYVYNnc9Mb1lqCqTdOcVAN8ftDOi	Julio Covarrubias	client	8	\N	2026-04-16 04:25:59.184727	active
\.


--
-- Name: booking_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.booking_requests_id_seq', 5, true);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clients_id_seq', 10, true);


--
-- Name: event_musicians_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.event_musicians_id_seq', 36, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_id_seq', 37, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, true);


--
-- Name: musicians_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.musicians_id_seq', 9, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 11, true);


--
-- Name: booking_requests booking_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_requests
    ADD CONSTRAINT booking_requests_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: event_musicians event_musicians_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_musicians
    ADD CONSTRAINT event_musicians_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: musicians musicians_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.musicians
    ADD CONSTRAINT musicians_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: booking_requests booking_requests_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_requests
    ADD CONSTRAINT booking_requests_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: booking_requests booking_requests_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_requests
    ADD CONSTRAINT booking_requests_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: booking_requests booking_requests_musician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_requests
    ADD CONSTRAINT booking_requests_musician_id_fkey FOREIGN KEY (musician_id) REFERENCES public.musicians(id);


--
-- Name: event_musicians event_musicians_event_id_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_musicians
    ADD CONSTRAINT event_musicians_event_id_events_id_fk FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_musicians event_musicians_musician_id_musicians_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_musicians
    ADD CONSTRAINT event_musicians_musician_id_musicians_id_fk FOREIGN KEY (musician_id) REFERENCES public.musicians(id) ON DELETE CASCADE;


--
-- Name: events events_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: expenses expenses_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;


--
-- Name: payments payments_event_id_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_event_id_events_id_fk FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: users users_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: users users_musician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_musician_id_fkey FOREIGN KEY (musician_id) REFERENCES public.musicians(id);


--
-- PostgreSQL database dump complete
--

\unrestrict kMBzvMqAmCMTEPLANMTMxifBNktFlozhPVOzeovwMIFmgRLksR1mjnbY86mb5xy

